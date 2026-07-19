(function () {
  const root = document.documentElement;
  const ritual = document.querySelector("#ritual");
  const canvas = document.querySelector(".ritual-canvas");
  const line = document.querySelector("[data-ritual-line]");
  const skip = document.querySelector("[data-ritual-skip]");
  const site = document.querySelector("#site-content");
  const audio = document.querySelector("[data-fire-audio]");
  const soundToggle = document.querySelector("[data-sound-toggle]");
  const wipeCanvas = document.querySelector("[data-dither-wipe]");
  const navButtons = Array.from(document.querySelectorAll("[data-section-target]"));
  const screens = Array.from(document.querySelectorAll("[data-section]"));

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
  let targetFireScale = 0.34;
  let currentFireScale = 0.34;
  let activeSection = "home";
  let soundMuted = window.localStorage.getItem("protopicaFireMuted") === "true";
  let soundWaiting = false;
  let isWiping = false;
  let wipeCtx = null;
  let wipeWidth = 0;
  let wipeHeight = 0;
  let wipeRaf = 0;

  if (wipeCanvas && typeof wipeCanvas.getContext === "function") {
    wipeCtx = wipeCanvas.getContext("2d");
  }

  function fireScaleForIndex(index) {
    const progress = index / Math.max(1, messages.length - 1);
    return 0.34 + progress * 0.66;
  }

  function setFireScale(index) {
    targetFireScale = fireScaleForIndex(index);
    root.style.setProperty("--fire-scale", targetFireScale.toFixed(3));
  }

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

  function showSection(sectionId, options) {
    const nextSection = screens.find(function (screen) {
      return screen.dataset.section === sectionId;
    });

    if (!nextSection) {
      return;
    }

    activeSection = sectionId;
    screens.forEach(function (screen) {
      const isActive = screen === nextSection;
      screen.hidden = false;
      screen.classList.toggle("is-active", isActive);
      screen.setAttribute("aria-hidden", String(!isActive));
      if (!isActive) {
        window.setTimeout(function () {
          if (!screen.classList.contains("is-active")) {
            screen.hidden = true;
          }
        }, 430);
      }
    });

    navButtons.forEach(function (button) {
      const isActive = button.dataset.sectionTarget === sectionId;
      button.classList.toggle("is-active", isActive);
      if (button.classList.contains("nav-link")) {
        button.setAttribute("aria-current", isActive ? "page" : "false");
      }
    });

    if (!options || options.updateHash !== false) {
      if (sectionId === "home") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        window.history.replaceState(null, "", "#" + sectionId);
      }
    }
  }

  function revealSite() {
    root.classList.remove("is-ritual");
    root.classList.add("is-revealed");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection(activeSection || "home");
  }

  function revealWithDitherDissolve() {
    if (isWiping) {
      return;
    }
    isWiping = true;
    activeSection = "home";
    setFireScale(messages.length - 1);
    if (!wipeCanvas || !wipeCtx) {
      root.classList.add("is-dissolving");
      if (site) {
        site.removeAttribute("aria-hidden");
      }
      showSection("home", { updateHash: false });
      window.setTimeout(revealSite, 520);
      window.setTimeout(function () {
        root.classList.remove("is-dissolving");
        isWiping = false;
      }, 760);
      return;
    }
    startDitherDissolve();
  }

  function resizeWipeCanvas() {
    if (!wipeCanvas || !wipeCtx) {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    wipeWidth = Math.max(1, window.innerWidth);
    wipeHeight = Math.max(1, window.innerHeight);
    wipeCanvas.width = Math.floor(wipeWidth * dpr);
    wipeCanvas.height = Math.floor(wipeHeight * dpr);
    wipeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function maskScore(col, row, cols, rows, seed) {
    const x = cols <= 1 ? 0 : col / (cols - 1);
    const y = rows <= 1 ? 0 : row / (rows - 1);
    const ordered = bayer[(col % 4) + ((row % 4) * 4)] / 16;
    const grain = noise(col * 0.173 + seed, row * 0.211 - seed, seed * 900);
    const secondGrain = noise(col * 0.071 - seed, row * 0.097 + seed, seed * 420);
    const centerPull = 1 - Math.min(1, Math.hypot(x - 0.5, y - 0.54) * 1.52);
    const weave = (Math.sin(x * 11.2 + y * 8.6 + seed * 7.4) + 1) * 0.5;
    return grain * 0.46 + secondGrain * 0.19 + ordered * 0.2 + centerPull * 0.1 + weave * 0.05;
  }

  function applyDitherMask(progress, seed) {
    if (!ritual) {
      return;
    }

    const cell = wipeWidth > 1400 ? 26 : wipeWidth > 900 ? 20 : 16;
    const cols = Math.ceil(wipeWidth / cell);
    const rows = Math.ceil(wipeHeight / cell);
    const eased = smoothstep(0.02, 0.98, progress);
    const threshold = eased * 1.08 - 0.06;
    let rects = "";

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const score = maskScore(col, row, cols, rows, seed);
        if (progress < 0.01 || score > threshold) {
          rects += "<rect x='" + (col * cell) + "' y='" + (row * cell) + "' width='" + cell + "' height='" + cell + "'/>";
        }
      }
    }

    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + wipeWidth + "' height='" + wipeHeight + "' viewBox='0 0 " +
      wipeWidth + " " + wipeHeight + "'><g fill='white'>" + rects + "</g></svg>";
    const url = "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) + "\")";
    ritual.style.webkitMaskImage = url;
    ritual.style.maskImage = url;
    ritual.style.webkitMaskSize = "100% 100%";
    ritual.style.maskSize = "100% 100%";
    ritual.style.webkitMaskRepeat = "no-repeat";
    ritual.style.maskRepeat = "no-repeat";
    ritual.style.opacity = String(1 - smoothstep(0.08, 0.92, progress) * 0.16);
  }

  function clearDitherMask() {
    if (!ritual) {
      return;
    }
    ritual.style.webkitMaskImage = "";
    ritual.style.maskImage = "";
    ritual.style.webkitMaskSize = "";
    ritual.style.maskSize = "";
    ritual.style.webkitMaskRepeat = "";
    ritual.style.maskRepeat = "";
    ritual.style.opacity = "";
  }

  function drawDitherDust(progress, seed) {
    if (!wipeCtx) {
      return;
    }

    wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
    const cell = wipeWidth > 1400 ? 26 : wipeWidth > 900 ? 20 : 16;
    const cols = Math.ceil(wipeWidth / cell);
    const rows = Math.ceil(wipeHeight / cell);
    const threshold = smoothstep(0.02, 0.98, progress) * 1.08 - 0.06;
    const fade = smoothstep(0.02, 0.22, progress) * (1 - smoothstep(0.72, 1, progress));
    const palette = ["#35110c", "#6f2115", "#b63a20", "#ff7a35"];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const score = maskScore(col, row, cols, rows, seed);
        const edge = Math.abs(score - threshold);
        if (edge > 0.045 || noise(col * 0.41, row * 0.37, seed * 500 + progress * 30) < 0.38) {
          continue;
        }

        const intensity = (1 - edge / 0.045) * fade;
        const colorIndex = Math.min(palette.length - 1, Math.floor(noise(col * 0.19, row * 0.23, seed * 300) * palette.length));
        const size = Math.max(3, Math.floor(cell * 0.58));
        wipeCtx.globalAlpha = 0.18 * intensity;
        wipeCtx.fillStyle = palette[colorIndex];
        wipeCtx.fillRect(col * cell, row * cell, size, size);
      }
    }
    wipeCtx.globalAlpha = 1;
  }

  function startDitherDissolve() {
    root.classList.add("is-fire-wipe", "is-dissolving");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection("home", { updateHash: false });
    resizeWipeCanvas();
    const start = performance.now();
    const duration = 1380;
    const seed = performance.now() * 0.0007;

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      applyDitherMask(progress, seed);
      drawDitherDust(progress, seed);
      wipeCanvas.style.opacity = String(0.5 * (1 - smoothstep(0.74, 1, progress)));
      if (progress < 1) {
        wipeRaf = window.requestAnimationFrame(step);
      } else {
        clearDitherMask();
        wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
        wipeCanvas.style.opacity = "";
        root.classList.remove("is-fire-wipe", "is-dissolving");
        revealSite();
        isWiping = false;
      }
    }

    window.cancelAnimationFrame(wipeRaf);
    wipeRaf = window.requestAnimationFrame(step);
  }

  function resetRitual() {
    messageIndex = 0;
    isChanging = false;
    activeSection = "home";
    setFireScale(messageIndex);
    renderMessage(messages[messageIndex]);
    root.classList.add("is-ritual");
    root.classList.remove("is-revealed", "is-fire-wipe", "is-dissolving");
    clearDitherMask();
    if (wipeCtx) {
      wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
    }
    if (site) {
      site.setAttribute("aria-hidden", "true");
    }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function advance() {
    if (isChanging) {
      return;
    }

    if (messageIndex >= messages.length - 1) {
      revealWithDitherDissolve();
      return;
    }

    isChanging = true;
    messageIndex += 1;
    setFireScale(messageIndex);
    updateMessage();
  }

  function handleUserAdvance(event) {
    if (!root.classList.contains("is-ritual")) {
      return;
    }
    if ((skip && skip.contains(event.target)) || (soundToggle && soundToggle.contains(event.target))) {
      return;
    }
    const now = Date.now();
    if (now - lastInputAt < 280) {
      return;
    }
    lastInputAt = now;
    playSound();
    advance();
  }

  function updateSoundUi(isWaiting) {
    if (!soundToggle) {
      return;
    }
    soundWaiting = Boolean(isWaiting) && !soundMuted;
    soundToggle.classList.toggle("is-muted", soundMuted);
    soundToggle.classList.toggle("is-waiting", soundWaiting);
    soundToggle.setAttribute("aria-pressed", String(soundMuted));
    soundToggle.setAttribute(
      "aria-label",
      soundMuted ? "Unmute firepit sound" : soundWaiting ? "Enable firepit sound" : "Mute firepit sound"
    );
  }

  function playSound() {
    if (!audio || soundMuted) {
      updateSoundUi(false);
      return;
    }
    audio.volume = 0.38;
    audio.muted = false;
    const playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt.then(function () {
        updateSoundUi(false);
      }).catch(function () {
        updateSoundUi(true);
      });
    }
  }

  function setMuted(nextMuted) {
    soundMuted = nextMuted;
    window.localStorage.setItem("protopicaFireMuted", String(soundMuted));
    if (!audio) {
      updateSoundUi(false);
      return;
    }
    if (soundMuted) {
      audio.pause();
      audio.muted = true;
      updateSoundUi(false);
    } else {
      playSound();
    }
  }

  document.addEventListener("pointerdown", handleUserAdvance, true);
  document.addEventListener("touchstart", handleUserAdvance, true);
  document.addEventListener("click", handleUserAdvance, true);

  if (skip) {
    skip.addEventListener("click", function () {
      setFireScale(messages.length - 1);
      playSound();
      revealSite();
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (soundWaiting && !soundMuted) {
        playSound();
        return;
      }
      setMuted(!soundMuted);
    });
  }

  navButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const target = button.dataset.sectionTarget;
      if (target === "home") {
        resetRitual();
        playSound();
        return;
      }
      showSection(target);
      playSound();
    });
  });

  window.addEventListener("keydown", function (event) {
    if (!root.classList.contains("is-ritual")) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playSound();
      advance();
    }
    if (event.key === "Escape") {
      setFireScale(messages.length - 1);
      revealSite();
    }
  });

  renderMessage(messages[messageIndex]);
  setFireScale(messageIndex);
  updateSoundUi(false);
  window.setTimeout(playSound, 300);
  document.addEventListener("pointerdown", playSound, { once: true, capture: true });
  document.addEventListener("keydown", playSound, { once: true, capture: true });

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
    currentFireScale += (targetFireScale - currentFireScale) * (reducedMotion ? 1 : 0.07);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#030404";
    ctx.fillRect(0, 0, width, height);

    const cell = width > 800 ? 7 : 5;
    const center = width * 0.5;
    const base = height * (0.81 + currentFireScale * 0.05);
    const flameHeight = Math.min(height * 0.5, 430) * currentFireScale;
    const flameWidth = Math.min(width * 0.32, 360) * (0.78 + currentFireScale * 0.22);
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
      const drift = Math.sin(time * 0.015 + i) * 42 * currentFireScale;
      const y = base - flameHeight * 0.18 - i * 4 * currentFireScale + ((time * 0.3 + i * 11) % 26);
      const x = center + drift + Math.sin(i * 2.1) * 78 * currentFireScale;
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
