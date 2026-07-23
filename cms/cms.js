(function () {
  const config = {
    owner: "manuvision",
    repo: "protopica",
    branch: "main",
    apiVersion: "2026-03-10",
    articlesPath: "blog/articles.json",
    rssPath: "blog/rss.xml",
    assetsRoot: "blog/assets",
    publicAssetRoot: "/blog/assets",
    siteUrl: "https://protopica.com",
  };
  const tokenStorageKey = "protopicaCmsToken";
  const defaultAuthorKey = "protopicaCmsAuthor";
  const allowedTags = new Set([
    "A",
    "B",
    "BLOCKQUOTE",
    "BR",
    "CODE",
    "DEL",
    "EM",
    "FIGCAPTION",
    "FIGURE",
    "H2",
    "H3",
    "H4",
    "HR",
    "I",
    "IMG",
    "LI",
    "OL",
    "P",
    "PRE",
    "STRONG",
    "UL",
    "U",
  ]);
  const allowedAttributes = {
    A: new Set(["href", "target", "rel"]),
    IMG: new Set(["src", "alt", "loading"]),
  };

  const tokenInput = document.querySelector("#github-token");
  const rememberInput = document.querySelector("#remember-token");
  const connectButton = document.querySelector("#connect");
  const refreshButton = document.querySelector("#refresh");
  const newButton = document.querySelector("#new-article");
  const saveButton = document.querySelector("#save-article");
  const deleteButton = document.querySelector("#delete-article");
  const articleList = document.querySelector("#article-list");
  const titleInput = document.querySelector("#article-title");
  const dateInput = document.querySelector("#article-date");
  const authorInput = document.querySelector("#article-author");
  const contentInput = document.querySelector("#article-content");
  const imageInput = document.querySelector("#image-files");
  const imageAltInput = document.querySelector("#image-alt");
  const uploadButton = document.querySelector("#upload-image");
  const preview = document.querySelector("#article-preview");
  const status = document.querySelector("#status");
  const toolbarButtons = Array.from(document.querySelectorAll("[data-insert]"));

  const state = {
    token: "",
    articles: [],
    articlesSha: null,
    rssSha: null,
    currentId: null,
    connected: false,
    busy: false,
  };

  function setStatus(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone || "";
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    [connectButton, refreshButton, newButton, saveButton, deleteButton, uploadButton].forEach(function (button) {
      if (button) {
        button.disabled = isBusy || (button === deleteButton && !state.currentId);
      }
    });
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) {
      return "Draft";
    }

    const date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function slugify(value) {
    const slug = String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || "field-note";
  }

  function uniqueSlug(value, existingId) {
    const base = slugify(value);
    let candidate = base;
    let index = 2;

    while (
      state.articles.some(function (article) {
        return article.id === candidate && article.id !== existingId;
      })
    ) {
      candidate = base + "-" + index;
      index += 1;
    }

    return candidate;
  }

  function articleSlug(article) {
    return slugify(article && (article.title || article.id));
  }

  function articlePagePath(article) {
    return "blog/" + articleSlug(article) + ".html";
  }

  function articleUrl(article) {
    return config.siteUrl + "/" + articlePagePath(article);
  }

  function safeFileName(file, index) {
    const parts = file.name.split(".");
    const extension = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
    const name = slugify(parts.join(".") || file.name);
    return Date.now() + "-" + index + "-" + name + "." + extension;
  }

  function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function encodeBase64Text(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  function decodeBase64Text(value) {
    const binary = atob(String(value || "").replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, function (character) {
      return character.charCodeAt(0);
    });

    return new TextDecoder().decode(bytes);
  }

  function readFileBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.addEventListener("load", function () {
        resolve(String(reader.result).split(",")[1]);
      });
      reader.addEventListener("error", reject);
      reader.readAsDataURL(file);
    });
  }

  function sanitizeUrl(value, type) {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
      return "";
    }

    if (type === "image" && /^(\/|\.\/|\.\.\/|https?:\/\/)/i.test(trimmed)) {
      return trimmed;
    }

    if (type === "link" && /^(https?:\/\/|mailto:|\/|#)/i.test(trimmed)) {
      return trimmed;
    }

    return "";
  }

  function sanitizeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");

    Array.from(template.content.querySelectorAll("*")).forEach(function (node) {
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }

      Array.from(node.attributes).forEach(function (attribute) {
        const allowed = allowedAttributes[node.tagName];
        if (!allowed || !allowed.has(attribute.name)) {
          node.removeAttribute(attribute.name);
        }
      });

      if (node.tagName === "A") {
        const href = sanitizeUrl(node.getAttribute("href"), "link");
        if (!href) {
          node.removeAttribute("href");
        }
        if (/^https?:\/\//i.test(href)) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      }

      if (node.tagName === "IMG") {
        const src = sanitizeUrl(node.getAttribute("src"), "image");
        if (!src) {
          node.remove();
          return;
        }
        node.setAttribute("src", src);
        node.setAttribute("loading", "lazy");
        node.setAttribute("alt", node.getAttribute("alt") || "");
      }
    });

    return template.innerHTML.trim();
  }

  function preserveLineBreaks(html) {
    const template = document.createElement("template");
    template.innerHTML = sanitizeHtml(html);
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node = walker.nextNode();

    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }

    textNodes.forEach(function (textNode) {
      const parent = textNode.parentElement;
      const value = textNode.nodeValue || "";

      if (!value.includes("\n") || !value.trim() || (parent && parent.closest("pre, code"))) {
        return;
      }

      const fragment = document.createDocumentFragment();
      value.replace(/\r/g, "").split("\n").forEach(function (line, index, lines) {
        fragment.appendChild(document.createTextNode(line));
        if (index < lines.length - 1) {
          fragment.appendChild(document.createElement("br"));
        }
      });
      textNode.replaceWith(fragment);
    });

    return template.innerHTML.trim();
  }

  function escapeHtml(value) {
    const span = document.createElement("span");
    span.textContent = value;
    return span.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function escapeXml(value) {
    return String(value || "").replace(/[<>&'\"]/g, function (character) {
      return {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      }[character];
    });
  }

  function cdata(value) {
    return String(value || "").replace(/]]>/g, "]]]]><![CDATA[>");
  }

  function articleDescription(html) {
    const template = document.createElement("template");
    template.innerHTML = preserveLineBreaks(html);
    template.content.querySelectorAll("figure, figcaption, img").forEach(function (node) {
      node.remove();
    });
    template.content.querySelectorAll("br, h2, h3, h4, p, li, blockquote, figure, pre, hr").forEach(function (node) {
      node.after(document.createTextNode(" "));
    });
    return (template.content.textContent || "").trim().replace(/\s+/g, " ").slice(0, 280);
  }

  function articlePublishDate(article) {
    const date = new Date(article.createdAt || article.updatedAt || (article.date ? article.date + "T12:00:00Z" : new Date().toISOString()));
    return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
  }

  function buildRssFeed() {
    const items = sortArticles(state.articles)
      .map(function (article) {
        const url = articleUrl(article);
        const content = preserveLineBreaks(article.content);
        return [
          "    <item>",
          "      <title>" + escapeXml(article.title) + "</title>",
          "      <link>" + escapeXml(url) + "</link>",
          "      <guid isPermaLink=\"true\">" + escapeXml(url) + "</guid>",
          "      <pubDate>" + articlePublishDate(article) + "</pubDate>",
          "      <dc:creator>" + escapeXml(article.author || "Protopica") + "</dc:creator>",
          "      <description>" + escapeXml(articleDescription(content)) + "</description>",
          "      <content:encoded><![CDATA[" + cdata(content) + "]]></content:encoded>",
          "    </item>",
        ].join("\n");
      })
      .join("\n");

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
      "  <channel>",
      "    <title>Protopica Blog</title>",
      "    <link>" + config.siteUrl + "/#blog</link>",
      "    <description>Articles, experiments and field notes from Protopica.</description>",
      "    <language>en-ca</language>",
      "    <lastBuildDate>" + new Date().toUTCString() + "</lastBuildDate>",
      '    <atom:link href="' + config.siteUrl + '/blog/rss.xml" rel="self" type="application/rss+xml" />',
      "    <generator>Protopica CMS</generator>",
      items,
      "  </channel>",
      "</rss>",
      "",
    ].join("\n");
  }

  function firstImageFromArticle(article) {
    const template = document.createElement("template");
    template.innerHTML = preserveLineBreaks(article.content);
    const image = template.content.querySelector("img");
    return image ? sanitizeUrl(image.getAttribute("src"), "image") : "";
  }

  function articlePageNavigation(article, sortedArticles) {
    const index = sortedArticles.findIndex(function (record) {
      return record.id === article.id;
    });
    const previous = index > 0 ? sortedArticles[index - 1] : null;
    const next = index >= 0 && index < sortedArticles.length - 1 ? sortedArticles[index + 1] : null;

    return [
      '<nav class="article-page__pager" aria-label="Article navigation">',
      previous
        ? '  <a class="button" href="/' + escapeAttribute(articlePagePath(previous)) + '">Previous Article</a>'
        : '  <span class="button article-page__pager-disabled" aria-disabled="true">Previous Article</span>',
      next
        ? '  <a class="button button--primary" href="/' + escapeAttribute(articlePagePath(next)) + '">Next Article</a>'
        : '  <span class="button button--primary article-page__pager-disabled" aria-disabled="true">Next Article</span>',
      "</nav>",
    ].join("\n");
  }

  function buildArticlePage(article, sortedArticles) {
    const url = articleUrl(article);
    const title = article.title || "Untitled article";
    const description = articleDescription(article.content);
    const image = firstImageFromArticle(article) || "/protopica/og-logo-2026-v2.png";
    const absoluteImage = /^https?:\/\//i.test(image) ? image : config.siteUrl + image;
    const navigation = articlePageNavigation(article, sortedArticles);

    return [
      "<!doctype html>",
      '<html lang="en" class="js is-revealed is-quiet-reveal article-document">',
      "  <head>",
      '    <meta charset="utf-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
      "    <title>" + escapeHtml(title) + " - Protopica Blog</title>",
      '    <meta name="description" content="' + escapeAttribute(description) + '" />',
      '    <meta property="og:title" content="' + escapeAttribute(title) + '" />',
      '    <meta property="og:description" content="' + escapeAttribute(description) + '" />',
      '    <meta property="og:type" content="article" />',
      '    <meta property="og:url" content="' + escapeAttribute(url) + '" />',
      '    <meta property="og:image" content="' + escapeAttribute(absoluteImage) + '" />',
      '    <meta name="twitter:card" content="summary_large_image" />',
      '    <meta name="twitter:title" content="' + escapeAttribute(title) + '" />',
      '    <meta name="twitter:description" content="' + escapeAttribute(description) + '" />',
      '    <meta name="twitter:image" content="' + escapeAttribute(absoluteImage) + '" />',
      '    <link rel="canonical" href="' + escapeAttribute(url) + '" />',
      '    <link rel="icon" href="/favicon.png" />',
      '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
      '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
      '    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Manrope:wght@400;500;600;700;800&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet" />',
      '    <link rel="stylesheet" href="/styles.css?v=20260723-mobile-blog-card4" />',
      "  </head>",
      '  <body class="article-body">',
      '    <main class="article-page">',
      '      <article class="article-page__inner">',
      '        <a class="blog-back" href="/#blog">Back to Blog</a>',
      '        <header class="article-page__header">',
      '          <p class="eyebrow">' + escapeHtml([formatDate(article.date), article.author].filter(Boolean).join(" / ")) + "</p>",
      "          <h2>" + escapeHtml(title) + "</h2>",
      "        </header>",
      '        <div class="blog-content article-page__content">',
      preserveLineBreaks(article.content),
      "        </div>",
      '        <a class="blog-back" href="/#blog">Back to Blog</a>',
      navigation,
      "      </article>",
      "    </main>",
      "  </body>",
      "</html>",
      "",
    ].join("\n");
  }

  async function putArticlePages(sortedArticles) {
    for (const article of sortedArticles) {
      const path = articlePagePath(article);
      const latest = await getContent(path, true);
      await putContentWithCurrentSha(
        path,
        encodeBase64Text(buildArticlePage(article, sortedArticles)),
        "Update Protopica blog page: " + article.title,
        latest ? latest.sha : null
      );
    }
  }

  async function deleteArticlePage(article) {
    const latest = await getContent(articlePagePath(article), true);
    if (latest && latest.sha) {
      await deleteContent(latest.path, latest.sha, "Delete Protopica blog page: " + article.title);
    }
  }

  function sanitizeInlineHtml(html) {
    const inlineTags = new Set(["A", "B", "BR", "CODE", "DEL", "EM", "I", "IMG", "STRONG", "U"]);
    const template = document.createElement("template");
    template.innerHTML = sanitizeHtml(html);

    Array.from(template.content.querySelectorAll("*")).forEach(function (node) {
      if (!inlineTags.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
      }
    });

    return template.innerHTML.trim();
  }

  async function apiFetch(path, options) {
    if (!state.token) {
      throw new Error("Paste a GitHub token first.");
    }

    const response = await fetch("https://api.github.com" + path, {
      method: (options && options.method) || "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + state.token,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": config.apiVersion,
      },
      body: options && options.body,
    });

    if (response.status === 404 && options && options.allow404) {
      return null;
    }

    if (!response.ok) {
      let message = response.statusText;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch (error) {
        message = response.statusText;
      }
      const requestError = new Error(message + " (" + response.status + ")");
      requestError.status = response.status;
      throw requestError;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  function contentsUrl(path) {
    return "/repos/" + config.owner + "/" + config.repo + "/contents/" + encodePath(path);
  }

  function getContent(path, allow404) {
    return apiFetch(contentsUrl(path) + "?ref=" + encodeURIComponent(config.branch), {
      allow404: allow404,
    });
  }

  function putContent(path, content, message, sha) {
    const body = {
      message: message,
      content: content,
      branch: config.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return apiFetch(contentsUrl(path), {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async function putContentWithCurrentSha(path, content, message, sha) {
    try {
      return await putContent(path, content, message, sha);
    } catch (error) {
      if (error.status !== 409) {
        throw error;
      }

      const latest = await getContent(path, true);
      return putContent(path, content, message, latest ? latest.sha : null);
    }
  }

  function deleteContent(path, sha, message) {
    return apiFetch(contentsUrl(path), {
      method: "DELETE",
      body: JSON.stringify({
        message: message,
        sha: sha,
        branch: config.branch,
      }),
    });
  }

  function normalizeArticles(data) {
    if (!data || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles
      .filter(function (article) {
        return article && article.id;
      })
      .map(function (article) {
        return {
          id: String(article.id),
          title: String(article.title || "Untitled article"),
          date: String(article.date || ""),
          author: String(article.author || "Protopica"),
          content: String(article.content || ""),
          createdAt: article.createdAt || article.updatedAt || new Date().toISOString(),
          updatedAt: article.updatedAt || null,
        };
      });
  }

  function sortArticles(records) {
    return records.slice().sort(function (a, b) {
      return (
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")) ||
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) ||
        String(a.title).localeCompare(String(b.title))
      );
    });
  }

  function renderArticleList() {
    articleList.textContent = "";

    if (!state.connected) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent = "Connect to GitHub to load articles.";
      articleList.appendChild(message);
      return;
    }

    if (!state.articles.length) {
      const message = document.createElement("p");
      message.className = "muted";
      message.textContent = "No articles yet. Create the first field note.";
      articleList.appendChild(message);
      return;
    }

    sortArticles(state.articles).forEach(function (article) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "article-list__item";
      button.dataset.articleId = article.id;
      button.classList.toggle("is-active", article.id === state.currentId);

      const title = document.createElement("span");
      title.textContent = article.title;

      const meta = document.createElement("small");
      meta.textContent = [formatDate(article.date), article.author].filter(Boolean).join(" / ");

      button.append(title, meta);
      articleList.appendChild(button);
    });
  }

  function setCurrentArticle(article) {
    state.currentId = article ? article.id : null;
    titleInput.value = article ? article.title : "";
    dateInput.value = article && article.date ? article.date : today();
    authorInput.value = article ? article.author : window.localStorage.getItem(defaultAuthorKey) || "Protopica";
    contentInput.value = article ? article.content : "";
    if (deleteButton) {
      deleteButton.disabled = !state.currentId || state.busy;
    }
    renderArticleList();
    renderPreview();
  }

  function renderPreview() {
    const title = preview.querySelector("h2");
    const meta = preview.querySelector(".meta");
    const content = preview.querySelector(".preview-content");

    title.textContent = titleInput.value.trim() || "Untitled article";
    meta.textContent = [formatDate(dateInput.value), authorInput.value.trim()].filter(Boolean).join(" / ");
    content.innerHTML = preserveLineBreaks(contentInput.value);
  }

  async function loadArticles() {
    setBusy(true);
    setStatus("Loading articles from GitHub...");

    try {
      const responses = await Promise.all([getContent(config.articlesPath, true), getContent(config.rssPath, true)]);
      const response = responses[0];
      const rssResponse = responses[1];
      state.rssSha = rssResponse ? rssResponse.sha : null;

      if (!response) {
        state.articles = [];
        state.articlesSha = null;
      } else {
        state.articlesSha = response.sha;
        state.articles = normalizeArticles(JSON.parse(decodeBase64Text(response.content)));
      }

      state.connected = true;
      renderArticleList();

      const selected = state.articles.find(function (article) {
        return article.id === state.currentId;
      });
      setCurrentArticle(selected || state.articles[0] || null);
      setStatus("Connected. " + state.articles.length + " article" + (state.articles.length === 1 ? "" : "s") + " loaded.", "success");
    } catch (error) {
      state.connected = false;
      renderArticleList();
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveArticleIndex(message) {
    const sortedArticles = sortArticles(state.articles);
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      articles: sortedArticles,
    };

    const response = await putContentWithCurrentSha(
      config.articlesPath,
      encodeBase64Text(JSON.stringify(payload, null, 2) + "\n"),
      message,
      state.articlesSha
    );
    state.articlesSha = response.content.sha;

    const rssResponse = await putContentWithCurrentSha(
      config.rssPath,
      encodeBase64Text(buildRssFeed()),
      "Update Protopica blog RSS feed",
      state.rssSha
    );
    state.rssSha = rssResponse.content.sha;
    await putArticlePages(sortedArticles);
  }

  async function saveArticle() {
    if (!state.connected) {
      setStatus("Connect to GitHub before saving.", "error");
      return;
    }

    const title = titleInput.value.trim();
    if (!title) {
      setStatus("Add a title before saving.", "error");
      titleInput.focus();
      return;
    }

    const now = new Date().toISOString();
    const existing = state.articles.find(function (article) {
      return article.id === state.currentId;
    });
    const previousPagePath = existing ? articlePagePath(existing) : "";
    const id = state.currentId || uniqueSlug(title);
    const article = {
      id: id,
      title: title,
      date: dateInput.value || today(),
      author: authorInput.value.trim() || "Protopica",
      content: preserveLineBreaks(contentInput.value),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    const index = state.articles.findIndex(function (record) {
      return record.id === id;
    });

    setBusy(true);
    setStatus("Saving article to GitHub...");

    try {
      window.localStorage.setItem(defaultAuthorKey, article.author);
      if (index >= 0) {
        state.articles[index] = article;
      } else {
        state.articles.unshift(article);
      }
      state.currentId = id;
      contentInput.value = article.content;
      await saveArticleIndex("Update Protopica blog article: " + title);
      if (previousPagePath && previousPagePath !== articlePagePath(article)) {
        const latestPreviousPage = await getContent(previousPagePath, true);
        if (latestPreviousPage && latestPreviousPage.sha) {
          await deleteContent(latestPreviousPage.path, latestPreviousPage.sha, "Delete renamed Protopica blog page: " + existing.title);
        }
      }
      setCurrentArticle(article);
      setStatus("Saved. GitHub Pages will publish the update shortly.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAssetFolder(articleId) {
    const path = config.assetsRoot + "/" + articleId;
    const entries = await getContent(path, true);

    if (!Array.isArray(entries)) {
      return;
    }

    for (const entry of entries) {
      if (entry.type === "file" && entry.sha) {
        await deleteContent(entry.path, entry.sha, "Delete Protopica blog asset: " + entry.name);
      }
    }
  }

  async function deleteArticle() {
    if (!state.currentId) {
      return;
    }

    const article = state.articles.find(function (record) {
      return record.id === state.currentId;
    });

    if (!article || !window.confirm("Delete \"" + article.title + "\" from the public blog?")) {
      return;
    }

    setBusy(true);
    setStatus("Deleting article...");

    try {
      state.articles = state.articles.filter(function (record) {
        return record.id !== article.id;
      });
      await saveArticleIndex("Delete Protopica blog article: " + article.title);
      await deleteArticlePage(article);
      await deleteAssetFolder(article.id);
      setCurrentArticle(state.articles[0] || null);
      setStatus("Deleted. GitHub Pages will publish the update shortly.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function insertAtCursor(value) {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;
    const before = contentInput.value.slice(0, start);
    const after = contentInput.value.slice(end);
    contentInput.value = before + value + after;
    contentInput.focus();
    contentInput.setSelectionRange(start + value.length, start + value.length);
    renderPreview();
  }

  function selectedText(fallback) {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;
    return contentInput.value.slice(start, end) || fallback;
  }

  function replaceSelection(value) {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;
    const before = contentInput.value.slice(0, start);
    const after = contentInput.value.slice(end);
    contentInput.value = before + value + after;
    contentInput.focus();
    contentInput.setSelectionRange(start, start + value.length);
    renderPreview();
  }

  function insertFormatting(type) {
    const text = selectedText("Write here");
    const inlineMarkup = sanitizeInlineHtml(text) || escapeHtml(text);
    const escaped = escapeHtml(text);
    let markup = "";

    if (type === "h2") {
      markup = "<h2>" + inlineMarkup + "</h2>\n";
    } else if (type === "h3") {
      markup = "<h3>" + inlineMarkup + "</h3>\n";
    } else if (type === "h4") {
      markup = "<h4>" + inlineMarkup + "</h4>\n";
    } else if (type === "p") {
      markup = "<p>" + inlineMarkup + "</p>\n";
    } else if (type === "strong") {
      markup = "<strong>" + inlineMarkup + "</strong>";
    } else if (type === "em") {
      markup = "<em>" + inlineMarkup + "</em>";
    } else if (type === "u") {
      markup = "<u>" + inlineMarkup + "</u>";
    } else if (type === "del") {
      markup = "<del>" + inlineMarkup + "</del>";
    } else if (type === "blockquote") {
      markup = "<blockquote><p>" + inlineMarkup + "</p></blockquote>\n";
    } else if (type === "ul") {
      markup = createListMarkup("ul", text);
    } else if (type === "ol") {
      markup = createListMarkup("ol", text);
    } else if (type === "link") {
      const href = window.prompt("Paste the link URL");
      if (!href) {
        return;
      }
      markup = '<a href="' + escapeAttribute(href) + '">' + inlineMarkup + "</a>";
    } else if (type === "code") {
      markup = "<code>" + escaped + "</code>";
    } else if (type === "pre") {
      markup = "<pre><code>" + escaped + "</code></pre>\n";
    } else if (type === "hr") {
      markup = "\n<hr>\n";
    }

    replaceSelection(markup);
  }

  function createListMarkup(tagName, value) {
    const items = String(value || "")
      .split(/\r?\n/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
    const listItems = (items.length ? items : ["List item"])
      .map(function (item) {
        return "  <li>" + (sanitizeInlineHtml(item) || escapeHtml(item)) + "</li>";
      })
      .join("\n");

    return "<" + tagName + ">\n" + listItems + "\n</" + tagName + ">\n";
  }

  async function uploadImages() {
    if (!state.connected) {
      setStatus("Connect to GitHub before uploading images.", "error");
      return;
    }

    const files = Array.from(imageInput.files || []);
    if (!files.length) {
      setStatus("Choose one or more images first.", "error");
      return;
    }

    const articleTitle = titleInput.value.trim() || "field note";
    const articleId = state.currentId || uniqueSlug(articleTitle);
    state.currentId = articleId;
    const altText = imageAltInput.value.trim();

    setBusy(true);
    setStatus("Uploading " + files.length + " image" + (files.length === 1 ? "" : "s") + "...");

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const fileName = safeFileName(file, index + 1);
        const repoPath = config.assetsRoot + "/" + articleId + "/" + fileName;
        const publicPath = config.publicAssetRoot + "/" + articleId + "/" + fileName;
        const content = await readFileBase64(file);

        await putContent(repoPath, content, "Upload Protopica blog asset: " + fileName);
        insertAtCursor(
          '\n<figure>\n  <img src="' +
            publicPath +
            '" alt="' +
            escapeAttribute(altText || file.name) +
            '" />\n  <figcaption></figcaption>\n</figure>\n'
        );
      }

      imageInput.value = "";
      imageAltInput.value = "";
      renderArticleList();
      setStatus("Images uploaded and inserted. Save the article to publish the content changes.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  connectButton.addEventListener("click", function () {
    state.token = tokenInput.value.trim();
    if (!state.token) {
      setStatus("Paste a GitHub token first.", "error");
      tokenInput.focus();
      return;
    }

    if (rememberInput.checked) {
      window.localStorage.setItem(tokenStorageKey, state.token);
    } else {
      window.localStorage.removeItem(tokenStorageKey);
    }

    loadArticles();
  });

  refreshButton.addEventListener("click", function () {
    if (!state.token) {
      state.token = tokenInput.value.trim();
    }
    loadArticles();
  });

  newButton.addEventListener("click", function () {
    setCurrentArticle(null);
    setStatus("New draft ready.");
  });

  saveButton.addEventListener("click", saveArticle);
  deleteButton.addEventListener("click", deleteArticle);
  uploadButton.addEventListener("click", uploadImages);

  articleList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-article-id]");
    if (!button) {
      return;
    }

    const article = state.articles.find(function (record) {
      return record.id === button.dataset.articleId;
    });
    if (article) {
      setCurrentArticle(article);
      setStatus("Editing \"" + article.title + "\".");
    }
  });

  toolbarButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      insertFormatting(button.dataset.insert);
    });
  });

  [titleInput, dateInput, authorInput, contentInput].forEach(function (input) {
    input.addEventListener("input", renderPreview);
  });

  const storedToken = window.localStorage.getItem(tokenStorageKey);
  if (storedToken) {
    tokenInput.value = storedToken;
    rememberInput.checked = true;
    state.token = storedToken;
  }

  dateInput.value = today();
  authorInput.value = window.localStorage.getItem(defaultAuthorKey) || "Protopica";
  renderPreview();
})();
