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
    "Whether you want to build a new world or archive what already exists",
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
  let isRoomTransitioning = false;
  let wipeCtx = null;
  let wipeWidth = 0;
  let wipeHeight = 0;
  let wipeDpr = 1;
  let wipeRaf = 0;
  let transitionSeed = 0;

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

  function updateNavState(sectionId) {
    navButtons.forEach(function (button) {
      const isActive = button.dataset.sectionTarget === sectionId;
      button.classList.toggle("is-active", isActive);
      if (button.classList.contains("nav-link")) {
        button.setAttribute("aria-current", isActive ? "page" : "false");
      }
    });
  }

  function updateLocation(sectionId, options) {
    if (!options || options.updateHash !== false) {
      if (sectionId === "home") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      } else {
        window.history.replaceState(null, "", "#" + sectionId);
      }
    }
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
      screen.classList.remove("is-dissolve-under", "is-dissolving-out");
      screen.setAttribute("aria-hidden", String(!isActive));
      if (!isActive) {
        window.setTimeout(function () {
          if (!screen.classList.contains("is-active")) {
            screen.hidden = true;
          }
        }, 430);
      }
    });

    updateNavState(sectionId);
    updateLocation(sectionId, options);
  }

  function revealSite() {
    root.classList.remove("is-quiet-reveal");
    root.classList.remove("is-ritual");
    root.classList.add("is-revealed");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection(activeSection || "home");
  }

  function finishDitherReveal() {
    root.classList.add("is-quiet-reveal");
    root.classList.remove("is-ritual");
    root.classList.add("is-revealed");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection("home", { updateHash: false });
  }

  function revealWithDitherDissolve() {
    if (isWiping) {
      return;
    }
    isWiping = true;
    activeSection = "home";
    setFireScale(messages.length - 1);
    startDitherDissolve();
  }

  function resizeWipeCanvas() {
    wipeDpr = Math.min(window.devicePixelRatio || 1, 2);
    wipeWidth = Math.max(1, window.innerWidth);
    wipeHeight = Math.max(1, window.innerHeight);
    if (!wipeCanvas || !wipeCtx) {
      return;
    }
    wipeCanvas.width = Math.floor(wipeWidth * wipeDpr);
    wipeCanvas.height = Math.floor(wipeHeight * wipeDpr);
    wipeCtx.setTransform(wipeDpr, 0, 0, wipeDpr, 0, 0);
  }

  function clearDitherOverlay() {
    window.cancelAnimationFrame(wipeRaf);
    if (wipeCtx) {
      wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
    }
  }

  function cellNoise(col, row, seed) {
    const value = Math.sin((col + seed * 17) * 12.9898 + (row - seed * 11) * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function buildDitherCells(seed) {
    const cellSize = wipeWidth > 1500 ? 8 : wipeWidth > 760 ? 7 : 6;
    const cols = Math.ceil(wipeWidth / cellSize);
    const rows = Math.ceil(wipeHeight / cellSize);
    const fireColors = ["#5b1f15", "#ff4d2d", "#ff8a3d", "#ff8a3d", "#d8ff3d"];
    const cells = [];

    for (let row = 0; row < rows; row += 1) {
      const vertical = 1 - (row + 0.5) / rows;
      for (let col = 0; col < cols; col += 1) {
        const ordered = bayer[(col % 4) + ((row % 4) * 4)] / 15;
        const grain = cellNoise(col, row, seed);
        const colorIndex = Math.min(fireColors.length - 1, Math.floor((ordered * 0.55 + grain * 0.45) * fireColors.length));
        cells.push({
          x: col * cellSize,
          y: row * cellSize,
          size: cellSize + 0.6,
          score: vertical * 0.34 + ordered * 0.48 + grain * 0.18,
          color: fireColors[colorIndex],
          alpha: 0.72 + grain * 0.22,
        });
      }
    }

    cells.sort(function (a, b) {
      return a.score - b.score;
    });
    return cells;
  }

  function captureCurrentViewport() {
    if (typeof window.html2canvas !== "function") {
      return Promise.reject(new Error("html2canvas unavailable"));
    }

    resizeWipeCanvas();
    return window.html2canvas(document.documentElement, {
      backgroundColor: "#030404",
      scale: wipeDpr,
      width: wipeWidth,
      height: wipeHeight,
      windowWidth: wipeWidth,
      windowHeight: wipeHeight,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      logging: false,
      ignoreElements: function (element) {
        return element === wipeCanvas;
      },
    });
  }

  function paintSnapshot(snapshot) {
    if (!wipeCtx) {
      return;
    }
    wipeCtx.globalCompositeOperation = "source-over";
    wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
    wipeCtx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, wipeWidth, wipeHeight);
  }

  function animatePixelReplacement(duration, seed, onComplete) {
    const cells = buildDitherCells(seed);
    const startedAt = performance.now();
    let ignited = 0;
    let cleared = 0;

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const igniteTarget = Math.min(cells.length, Math.floor(smoothstep(0, 0.94, progress) * cells.length));
      const clearTarget = Math.min(igniteTarget, Math.floor(smoothstep(0.07, 1, progress) * cells.length));

      wipeCtx.globalCompositeOperation = "source-over";
      while (ignited < igniteTarget) {
        const cell = cells[ignited];
        wipeCtx.globalAlpha = cell.alpha;
        wipeCtx.fillStyle = cell.color;
        wipeCtx.fillRect(cell.x, cell.y, cell.size, cell.size);
        ignited += 1;
      }

      wipeCtx.globalAlpha = 1;
      wipeCtx.globalCompositeOperation = "destination-out";
      while (cleared < clearTarget) {
        const cell = cells[cleared];
        wipeCtx.clearRect(cell.x, cell.y, cell.size, cell.size);
        cleared += 1;
      }

      if (progress < 1) {
        wipeRaf = window.requestAnimationFrame(frame);
        return;
      }

      wipeCtx.clearRect(0, 0, wipeWidth, wipeHeight);
      onComplete();
    }

    wipeRaf = window.requestAnimationFrame(frame);
  }

  function runDitherTransition(settings) {
    const duration = settings.duration;
    const className = settings.className;
    window.cancelAnimationFrame(wipeRaf);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settings.onSwap();
      settings.onComplete();
      return;
    }

    captureCurrentViewport().then(function (snapshot) {
      paintSnapshot(snapshot);
      transitionSeed = (transitionSeed + 1) % 997;
      root.classList.add("is-pixel-transitioning", className);
      settings.onSwap();
      animatePixelReplacement(duration, transitionSeed, function () {
        root.classList.remove("is-pixel-transitioning", className);
        clearDitherOverlay();
        settings.onComplete();
      });
    }).catch(function () {
      settings.onSwap();
      root.classList.remove("is-pixel-transitioning", className);
      clearDitherOverlay();
      settings.onComplete();
    });
  }

  function startDitherDissolve() {
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection("home", { updateHash: false });
    runDitherTransition({
      className: "is-dissolving",
      duration: 1500,
      onSwap: function () {
        finishDitherReveal();
      },
      onComplete: function () {
        isWiping = false;
      },
    });
  }

  function transitionToSection(sectionId) {
    const nextSection = screens.find(function (screen) {
      return screen.dataset.section === sectionId;
    });
    const currentSection = screens.find(function (screen) {
      return screen.classList.contains("is-active");
    });

    if (!nextSection || nextSection === currentSection || isWiping || isRoomTransitioning) {
      return;
    }

    if (!currentSection) {
      showSection(sectionId);
      return;
    }

    isRoomTransitioning = true;
    runDitherTransition({
      className: "is-room-dissolving",
      duration: 1400,
      onSwap: function () {
        showSection(sectionId);
      },
      onComplete: function () {
        isRoomTransitioning = false;
      },
    });
  }

  function resetRitual() {
    messageIndex = 0;
    isChanging = false;
    activeSection = "home";
    setFireScale(messageIndex);
    renderMessage(messages[messageIndex]);
    root.classList.add("is-ritual");
    root.classList.remove(
      "is-revealed",
      "is-pixel-transitioning",
      "is-dissolving",
      "is-room-dissolving",
      "is-intro-swap",
      "is-room-swap",
      "is-quiet-reveal"
    );
    screens.forEach(function (screen) {
      screen.classList.remove("is-dissolve-under", "is-dissolving-out");
    });
    clearDitherOverlay();
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
      transitionToSection(target);
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
