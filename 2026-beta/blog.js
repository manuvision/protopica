(function () {
  const list = document.querySelector("[data-blog-list]");

  if (!list) {
    return;
  }

  const empty = document.querySelector("[data-blog-empty]");
  const reader = document.querySelector("[data-blog-reader]");
  const backButton = document.querySelector("[data-blog-back]");
  const readerMeta = document.querySelector("[data-blog-meta]");
  const readerTitle = document.querySelector("[data-blog-title]");
  const readerContent = document.querySelector("[data-blog-content]");
  const researchNav = document.querySelector("[data-research-nav]");
  const educationNext = document.querySelector("[data-education-next]");
  const allowedTags = new Set([
    "A",
    "B",
    "BLOCKQUOTE",
    "BR",
    "CODE",
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
      educationNext.textContent = isAvailable ? "Follow the Research" : "Meet the People Behind It";
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
      return String(b.date || "").localeCompare(String(a.date || ""));
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

  function createExcerpt(html) {
    const template = document.createElement("template");
    template.innerHTML = sanitizeHtml(html);
    const text = template.content.textContent || "";
    return text.trim().replace(/\s+/g, " ").slice(0, 168);
  }

  function showEmpty() {
    list.hidden = true;
    if (reader) {
      reader.hidden = true;
    }
    if (empty) {
      empty.hidden = false;
    }
  }

  function showList() {
    if (reader) {
      reader.hidden = true;
    }
    if (empty) {
      empty.hidden = articles.length > 0;
    }
    list.hidden = articles.length === 0;
  }

  function showReader(article) {
    if (!reader || !readerTitle || !readerMeta || !readerContent) {
      return;
    }

    list.hidden = true;
    if (empty) {
      empty.hidden = true;
    }
    readerTitle.textContent = article.title || "Untitled note";
    readerMeta.textContent = [formatDate(article.date), article.author].filter(Boolean).join(" / ");
    readerContent.innerHTML = sanitizeHtml(article.content);
    reader.hidden = false;
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
      const card = document.createElement("article");
      card.className = "blog-card";

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.articleId = article.id;

      const meta = document.createElement("span");
      meta.className = "eyebrow";
      meta.textContent = [formatDate(article.date), article.author].filter(Boolean).join(" / ");

      const title = document.createElement("h3");
      title.textContent = article.title || "Untitled note";

      const excerpt = document.createElement("p");
      excerpt.textContent = createExcerpt(article.content) || "Open the note.";

      button.append(meta, title, excerpt);
      card.appendChild(button);
      list.appendChild(card);
    });

    showList();
  }

  list.addEventListener("click", function (event) {
    const button = event.target.closest("[data-article-id]");
    if (!button) {
      return;
    }

    const article = articles.find(function (record) {
      return record.id === button.dataset.articleId;
    });
    if (article) {
      showReader(article);
    }
  });

  if (backButton) {
    backButton.addEventListener("click", showList);
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
