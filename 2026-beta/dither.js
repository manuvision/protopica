(function () {
  const root = document.documentElement;
  const ritual = document.querySelector(".ritual");
  const canvas = document.querySelector(".ritual-canvas");
  const line = document.querySelector("[data-ritual-line]");
  const skip = document.querySelector("[data-ritual-skip]");
  const site = document.querySelector("#site-content");

  const messages = [
    "Hello storyteller...",
    "Whether you want to build a new world",
    "or archive what already exists",
    "you are in the right place.",
    "Since the dawn of humanity, we have gathered around a fire to tell stories.",
    "Today, the fire is a network.",
    "Join a community of storytellers and build your own world.",
  ];

  let messageIndex = 0;
  let isChanging = false;
  let lastInputAt = 0;
  let glyphCounter = 0;

  function renderMessage(text) {
    if (!line) {
      return;
    }

    line.textContent = "";
    line.setAttribute("aria-label", text);
    glyphCounter = 0;
    text.split(/(\s+)/).forEach(function (part) {
      if (/^\s+$/.test(part)) {
        line.appendChild(document.createTextNode(part));
        return;
      }

      const word = document.createElement("span");
      word.className = "ritual-word";
      Array.from(part).forEach(function (glyph) {
        const char = document.createElement("span");
        char.className = "ritual-char";
        char.style.setProperty("--i", glyphCounter);
        char.textContent = glyph;
        glyphCounter += 1;
        word.appendChild(char);
      });
      line.appendChild(word);
    });
  }

  function updateMessage() {
    if (!line) {
      isChanging = false;
      return;
    }

    line.classList.add("is-changing");
    window.setTimeout(function () {
      renderMessage(messages[messageIndex]);
      line.classList.remove("is-changing");
      line.classList.add("is-entering");
      window.setTimeout(function () {
        line.classList.remove("is-entering");
        isChanging = false;
      }, 780);
    }, 250);
  }

  function revealSite() {
    root.classList.remove("is-ritual");
    root.classList.add("is-revealed");
    if (site) {
      site.removeAttribute("aria-hidden");
      window.setTimeout(function () {
        site.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  function advance() {
    if (isChanging) {
      return;
    }

    if (messageIndex >= messages.length - 1) {
      revealSite();
      return;
    }

    isChanging = true;
    messageIndex += 1;
    updateMessage();
  }

  function handleUserAdvance(event) {
    if (!root.classList.contains("is-ritual")) {
      return;
    }
    if (skip && skip.contains(event.target)) {
      return;
    }
    const now = Date.now();
    if (now - lastInputAt < 280) {
      return;
    }
    lastInputAt = now;
    advance();
  }

  document.addEventListener("pointerdown", handleUserAdvance, true);
  document.addEventListener("touchstart", handleUserAdvance, true);
  document.addEventListener("click", handleUserAdvance, true);

  if (skip) {
    skip.addEventListener("click", revealSite);
  }

  renderMessage(messages[messageIndex]);

  window.addEventListener("keydown", function (event) {
    if (!root.classList.contains("is-ritual")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
    if (event.key === "Escape") {
      revealSite();
    }
  });

  if (!canvas || typeof canvas.getContext !== "function") {
    return;
  }

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let width = 0;
  let height = 0;
  let raf = 0;
  let time = 0;

  if (!ctx) {
    return;
  }

  root.classList.add("has-canvas-fire");

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function noise(x, y, t) {
    const value = Math.sin(x * 12.9898 + y * 78.233 + t * 0.013) * 43758.5453;
    return value - Math.floor(value);
  }

  function pixel(x, y, size, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  }

  function smoothstep(edge0, edge1, value) {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function drawFire() {
    time += reducedMotion ? 0 : 1;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#030404";
    ctx.fillRect(0, 0, width, height);

    const cell = width > 800 ? 7 : 5;
    const center = width * 0.5;
    const base = height * 0.86;
    const flameHeight = Math.min(height * 0.5, 430);
    const flameWidth = Math.min(width * 0.32, 360);
    const colors = ["#5b1f15", "#ff4d2d", "#ff8a3d", "#d8ff3d", "#f7f0dc"];

    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        const nx = (x - center) / flameWidth;
        const ny = (base - y) / flameHeight;
        const n = noise(x * 0.014, y * 0.018, time);
        const ordered = bayer[((x / cell) % 4 | 0) + (((y / cell) % 4 | 0) * 4)] / 16;
        const taper = Math.max(0.06, 1 - ny * 0.62);
        const sway = Math.sin(ny * 6 + time * 0.05) * 0.14 + Math.sin(ny * 11 - time * 0.035) * 0.08;
        const shape = taper - Math.abs(nx + sway);
        const flicker = Math.sin(time * 0.09 + x * 0.04 + y * 0.03) * 0.15 + n * 0.24;
        const emberFoot = Math.max(0, 0.34 - Math.abs(nx * 0.55)) * Math.max(0, 1 - Math.abs(ny - 0.02) * 4);
        const topFade = 1 - smoothstep(0.72, 1.18, ny);
        const bottomFade = smoothstep(-0.08, 0.08, ny);
        const edgeFade = topFade * bottomFade;
        const sparseTip = topFade > 0.74 || n > 0.42 + (1 - topFade) * 0.36;
        const intensity =
          ny > -0.08 && ny < 1.22 && sparseTip
            ? shape + flicker + emberFoot - ordered * (0.16 + (1 - edgeFade) * 0.8)
            : -1;

        if (intensity > 0.02 && edgeFade > 0.035) {
          const colorIndex = Math.min(colors.length - 1, Math.max(0, Math.floor(intensity * 5)));
          const size = edgeFade < 0.46 ? Math.max(2, cell - 3) : Math.max(2, cell - 1);
          const alpha = Math.min(0.92, (0.28 + intensity) * Math.min(1, edgeFade + 0.2));
          pixel(x, y, size, colors[colorIndex], alpha);
        }
      }
    }

    for (let i = 0; i < 34; i += 1) {
      const drift = Math.sin(time * 0.015 + i) * 42;
      const y = base - flameHeight * 0.18 - i * 4 + ((time * 0.3 + i * 11) % 26);
      const x = center + drift + Math.sin(i * 2.1) * 78;
      if (y > base - flameHeight * 0.92 && y < base + 8) {
        pixel(x, y, 3, i % 3 === 0 ? "#d8ff3d" : "#ff8a3d", 0.05 + (i % 5) * 0.012);
      }
    }
    ctx.globalAlpha = 1;

    raf = window.requestAnimationFrame(drawFire);
  }

  resize();
  drawFire();
  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", function () {
    window.cancelAnimationFrame(raf);
  });
})();
