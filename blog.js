(function () {
  const list = document.querySelector("[data-blog-list]");

  if (!list) {
    return;
  }

  const empty = document.querySelector("[data-blog-empty]");
  const listHeading = document.querySelector("[data-blog-list-heading]");
  const researchNav = document.querySelector("[data-research-nav]");
  const educationNext = document.querySelector("[data-education-next]");
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
  let articles = [];

  function setResearchAvailability(isAvailable) {
    if (researchNav) {
      researchNav.hidden = !isAvailable;
    }
    if (educationNext) {
      educationNext.dataset.sectionTarget = isAvailable ? "research" : "about";
      educationNext.textContent = isAvailable ? "Follow the Research" : "Learn More About the Team";
    }
    document.dispatchEvent(
      new CustomEvent("protopica:research-availability", {
        detail: { available: isAvailable },
      })
    );
  }

  function formatDate(value) {
    if (!value) {
      return "";
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

  function sortArticles(records) {
    return records.slice().sort(function (a, b) {
      return (
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))
      );
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

    return template.innerHTML;
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

  function showEmpty() {
    list.hidden = true;
    if (listHeading) {
      listHeading.hidden = true;
    }
    if (empty) {
      empty.hidden = false;
    }
  }

  function showList() {
    if (empty) {
      empty.hidden = articles.length > 0;
    }
    list.hidden = articles.length === 0;
    if (listHeading) {
      listHeading.hidden = articles.length === 0;
    }
  }

  function renderArticles() {
    list.textContent = "";
    articles = sortArticles(articles);
    setResearchAvailability(articles.length > 0);

    if (!articles.length) {
      showEmpty();
      return;
    }

    articles.forEach(function (article) {
      const entry = document.createElement("article");
      entry.className = "blog-entry";
      entry.id = "article-" + article.id;

      const header = document.createElement("header");
      header.className = "blog-entry__header";

      const meta = document.createElement("span");
      meta.className = "eyebrow";
      meta.textContent = [formatDate(article.date), article.author].filter(Boolean).join(" / ");

      const title = document.createElement("h2");
      title.textContent = article.title || "Untitled note";

      const content = document.createElement("div");
      content.className = "blog-content blog-entry__content";
      content.innerHTML = preserveLineBreaks(article.content);

      header.append(meta, title);
      entry.append(header, content);
      list.appendChild(entry);
    });

    showList();

    const requestedArticle = new URLSearchParams(window.location.search).get("article");
    const requestedEntry = requestedArticle ? document.getElementById("article-" + requestedArticle) : null;
    if (requestedEntry) {
      window.requestAnimationFrame(function () {
        requestedEntry.scrollIntoView({ block: "start" });
      });
    }
  }

  fetch("blog/articles.json?v=" + Date.now(), { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Blog data could not be loaded.");
      }
      return response.json();
    })
    .then(function (data) {
      articles = Array.isArray(data.articles) ? data.articles : [];
      renderArticles();
    })
    .catch(function () {
      setResearchAvailability(false);
      showEmpty();
    });
})();
