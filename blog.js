(function () {
  const list = document.querySelector("[data-blog-list]");

  if (!list) {
    return;
  }

  const empty = document.querySelector("[data-blog-empty]");
  const listHeading = document.querySelector("[data-blog-list-heading]");
  const researchNav = document.querySelector("[data-research-nav]");
  const educationNext = document.querySelector("[data-education-next]");
  const blogCarouselCue = document.querySelector(".carousel-cue--blog");
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
      educationNext.dataset.sectionTarget = isAvailable ? "blog" : "about";
      educationNext.textContent = isAvailable ? "Read the Blog" : "Learn More About the Team";
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
        String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")) ||
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
      );
    });
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

  function articlePath(article) {
    return "blog/" + slugify(article.title || article.id) + ".html";
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

  function textFromHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = preserveLineBreaks(html);
    template.content.querySelectorAll("img").forEach(function (image) {
      image.remove();
    });
    template.content.querySelectorAll("br, h2, h3, h4, p, li, blockquote, figure, pre, hr").forEach(function (node) {
      node.after(document.createTextNode(" "));
    });
    return (template.content.textContent || "").trim().replace(/\s+/g, " ");
  }

  function articleExcerpt(article) {
    const text = textFromHtml(article.content);
    return text.length > 150 ? text.slice(0, 150).replace(/\s+\S*$/, "") + "..." : text;
  }

  function articleThumbnail(article) {
    const template = document.createElement("template");
    template.innerHTML = preserveLineBreaks(article.content);
    const image = template.content.querySelector("img");
    return image ? sanitizeUrl(image.getAttribute("src"), "image") : "";
  }

  function showEmpty() {
    list.hidden = true;
    if (blogCarouselCue) {
      blogCarouselCue.hidden = true;
    }
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
    if (blogCarouselCue) {
      blogCarouselCue.hidden = articles.length < 2;
    }
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
      const entry = document.createElement("a");
      entry.className = "blog-preview-card";
      entry.id = "article-" + article.id;
      entry.href = articlePath(article);

      const meta = document.createElement("span");
      meta.className = "eyebrow";
      meta.textContent = [formatDate(article.date), article.author].filter(Boolean).join(" / ");

      const title = document.createElement("h2");
      title.textContent = article.title || "Untitled note";

      const thumbnail = articleThumbnail(article);
      if (thumbnail) {
        const image = document.createElement("img");
        image.className = "blog-preview-card__image";
        image.src = thumbnail;
        image.alt = "";
        image.loading = "lazy";
        entry.appendChild(image);
      }

      const copy = document.createElement("div");
      copy.className = "blog-preview-card__copy";

      const excerpt = document.createElement("p");
      excerpt.textContent = articleExcerpt(article);

      copy.append(meta, title, excerpt);
      entry.appendChild(copy);
      list.appendChild(entry);
    });

    showList();
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
