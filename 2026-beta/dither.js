(function () {
  const root = document.documentElement;
  const body = document.body;
  const ritual = document.querySelector("#ritual");
  const canvas = document.querySelector(".ritual-canvas");
  const line = document.querySelector("[data-ritual-line]");
  const skip = document.querySelector("[data-ritual-skip]");
  const site = document.querySelector("#site-content");
  const audio = document.querySelector("[data-fire-audio]");
  const soundToggle = document.querySelector("[data-sound-toggle]");
  const contactForm = document.querySelector("[data-contact-form]");
  const universityModal = document.querySelector("[data-university-modal]");
  const universityModalOpeners = Array.from(document.querySelectorAll("[data-university-modal-open]"));
  const menuToggle = document.querySelector("#menu-toggle");
  const navLinks = document.querySelector("#nav-links");
  const navButtons = Array.from(document.querySelectorAll("[data-section-target]"));
  const screens = Array.from(document.querySelectorAll("[data-section]"));
  const sectionAliases = { frameworks: "collaborate", learn: "education" };

  const messages = [
    "Since the dawn of humanity, we have gathered around a fire to tell stories.",
    "Whether you want to build a new world, or preserve what already exists...",
    "...you are in the right place.",
    "Today, the fire is a network.",
  ];

  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  let messageIndex = 0;
  let isChanging = false;
  let lastInputAt = 0;
  let glyphCounter = 0;
  const requestedHash = window.location.hash.replace("#", "");
  const initialHash = sectionAliases[requestedHash] || requestedHash;
  const initialSection = screens.some(function (screen) {
    return screen.dataset.section === initialHash;
  })
    ? initialHash
    : "home";
  let targetFireScale = 0.34;
  let currentFireScale = 0.34;
  let activeSection = initialSection;
  let soundMuted = window.localStorage.getItem("protopicaFireMuted") === "true";
  let soundWaiting = false;
  let isIntroTransitioning = false;
  let isRoomTransitioning = false;
  let researchAvailability = null;

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

  function setMenuOpen(nextOpen, options) {
    if (!menuToggle || !navLinks) {
      return;
    }

    navLinks.classList.toggle("is-open", nextOpen);
    body.classList.toggle("nav-open", nextOpen);
    menuToggle.setAttribute("aria-expanded", String(nextOpen));
    menuToggle.setAttribute("aria-label", nextOpen ? "Close navigation" : "Open navigation");
    if (options && options.restoreFocus) {
      menuToggle.focus();
    }
  }

  function closeMenu(options) {
    setMenuOpen(false, options);
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

  function finishIntroReveal() {
    const targetSection = activeSection || "home";
    root.classList.add("is-quiet-reveal");
    root.classList.remove("is-ritual");
    root.classList.add("is-revealed");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    showSection(targetSection, { updateHash: false });
  }

  function smoothstep(edge0, edge1, value) {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function runClassicTransition(settings) {
    const classNames = ["is-classic-transitioning"];
    if (settings.className) {
      classNames.push(settings.className);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settings.onSwap();
      settings.onComplete();
      return;
    }

    root.classList.remove("is-classic-out", "is-classic-in");
    root.classList.add(...classNames, "is-classic-out");

    window.setTimeout(function () {
      settings.onSwap();
      root.classList.remove("is-classic-out");
      root.classList.add("is-classic-in");

      window.setTimeout(function () {
        root.classList.remove(...classNames, "is-classic-in");
        settings.onComplete();
      }, settings.enterDuration || 360);
    }, settings.exitDuration || 170);
  }

  function revealWithClassicTransition() {
    if (isIntroTransitioning) {
      return;
    }
    isIntroTransitioning = true;
    setFireScale(messages.length - 1);
    runClassicTransition({
      className: "is-intro-fade",
      exitDuration: 190,
      enterDuration: 430,
      onSwap: function () {
        finishIntroReveal();
      },
      onComplete: function () {
        isIntroTransitioning = false;
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

    if (!nextSection || nextSection === currentSection || isIntroTransitioning || isRoomTransitioning) {
      return;
    }

    if (!currentSection) {
      showSection(sectionId);
      return;
    }

    isRoomTransitioning = true;
    runClassicTransition({
      className: "is-section-fade",
      exitDuration: 140,
      enterDuration: 330,
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
    isIntroTransitioning = false;
    isRoomTransitioning = false;
    activeSection = "home";
    setFireScale(messageIndex);
    renderMessage(messages[messageIndex]);
    root.classList.add("is-ritual");
    root.classList.remove(
      "is-revealed",
      "is-classic-transitioning",
      "is-classic-out",
      "is-classic-in",
      "is-intro-fade",
      "is-section-fade",
      "is-quiet-reveal",
      "is-route-pending"
    );
    if (site) {
      site.setAttribute("aria-hidden", "true");
    }
    closeMenu();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function advance() {
    if (isChanging) {
      return;
    }

    if (messageIndex >= messages.length - 1) {
      revealWithClassicTransition();
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

  function revealInitialSectionFromHash() {
    if (initialSection === "home") {
      return;
    }
    if (initialSection === "research" && researchAvailability === null) {
      return;
    }

    const resolvedSection = initialSection === "research" && !researchAvailability ? "about" : initialSection;

    root.classList.remove("is-ritual", "is-route-pending");
    root.classList.add("is-revealed", "is-quiet-reveal");
    if (site) {
      site.removeAttribute("aria-hidden");
    }
    if (ritual) {
      ritual.setAttribute("aria-hidden", "true");
    }
    showSection(resolvedSection, {
      updateHash: requestedHash === initialHash && resolvedSection === initialSection ? false : true,
    });
  }

  document.addEventListener("pointerdown", handleUserAdvance, true);
  document.addEventListener("touchstart", handleUserAdvance, true);
  document.addEventListener("click", handleUserAdvance, true);

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target === navLinks) {
        closeMenu();
      }
    });

    document.addEventListener("click", function (event) {
      if (!body.classList.contains("nav-open")) {
        return;
      }
      if (!event.target.closest(".site-nav")) {
        closeMenu();
      }
    });
  }

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

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(contactForm);
      const lines = [
        ["Name", data.get("name")],
        ["Email", data.get("email")],
        ["Organization or creative practice", data.get("organization")],
        ["What are you trying to build, understand or preserve?", data.get("challenge")],
        ["Who is it intended to serve?", data.get("audience")],
        ["Relevant support", data.get("support")],
        ["Meaningful progress in the next 90 days", data.get("progress")],
      ]
        .filter(function (entry) {
          return String(entry[1] || "").trim();
        })
        .map(function (entry) {
          return entry[0] + ":\n" + String(entry[1]).trim();
        });
      const subject = encodeURIComponent("Protopica project signal");
      const body = encodeURIComponent(lines.join("\n\n"));
      window.location.href = "mailto:hello@protopica.com?subject=" + subject + "&body=" + body;
    });
  }

  if (universityModal && universityModalOpeners.length) {
    universityModalOpeners.forEach(function (button) {
      button.addEventListener("click", function () {
        if (typeof universityModal.showModal === "function") {
          universityModal.showModal();
        } else {
          universityModal.setAttribute("open", "");
        }
      });
    });

    universityModal.addEventListener("click", function (event) {
      if (event.target === universityModal) {
        if (typeof universityModal.close === "function") {
          universityModal.close();
        } else {
          universityModal.removeAttribute("open");
        }
      }
    });
  }

  document.addEventListener("protopica:research-availability", function (event) {
    const isAvailable = Boolean(event.detail && event.detail.available);
    researchAvailability = isAvailable;
    if (initialSection === "research" && root.classList.contains("is-route-pending")) {
      revealInitialSectionFromHash();
      return;
    }
    if (!isAvailable && activeSection === "research") {
      transitionToSection("about");
    }
  });

  navButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const target = button.dataset.sectionTarget;
      closeMenu();
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
    if (event.key === "Escape" && body.classList.contains("nav-open")) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }

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
  revealInitialSectionFromHash();
  window.setTimeout(playSound, 300);
  document.addEventListener("pointerdown", playSound, { once: true, capture: true });
  document.addEventListener("keydown", playSound, { once: true, capture: true });

  if (!canvas || typeof canvas.getContext !== "function") {
    return;
  }

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    const squareSize = Math.max(1, Math.round(size));
    ctx.fillRect(Math.round(x), Math.round(y), squareSize, squareSize);
  }

  function drawFire() {
    time += reducedMotion ? 0 : 1;
    currentFireScale += (targetFireScale - currentFireScale) * (reducedMotion ? 1 : 0.07);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#030404";
    ctx.fillRect(0, 0, width, height);

    const isNarrow = width < 700;
    const cell = isNarrow ? 6 : width > 800 ? 7 : 6;
    const center = width * 0.5;
    const base = height * (isNarrow ? 0.78 + currentFireScale * 0.04 : 0.81 + currentFireScale * 0.05);
    const flameHeight = Math.min(height * (isNarrow ? 0.38 : 0.5), isNarrow ? 340 : 430) * currentFireScale;
    const flameWidth = Math.min(width * (isNarrow ? 0.72 : 0.32), isNarrow ? 350 : 360) * (0.8 + currentFireScale * 0.2);
    const colors = ["#5b1f15", "#ff4d2d", "#ff8a3d", "#ffd166", "#f7f0dc"];

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
        pixel(x, y, isNarrow ? 4 : 3, i % 3 === 0 ? "#ffd166" : "#ff8a3d", 0.05 + (i % 5) * 0.012);
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
