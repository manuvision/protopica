(function () {
  const root = document.documentElement;
  const body = document.body;
  const ritual = document.querySelector("#ritual");
  const canvas = document.querySelector(".ritual-canvas");
  const homeCanvas = document.querySelector(".home-fire-canvas");
  const line = document.querySelector("[data-ritual-line]");
  const skip = document.querySelector("[data-ritual-skip]");
  const site = document.querySelector("#site-content");
  const audio = document.querySelector("[data-fire-audio]");
  const soundToggle = document.querySelector("[data-sound-toggle]");
  const contactForm = document.querySelector("[data-contact-form]");
  const contactStatus = document.querySelector("[data-contact-status]");
  const impactValues = Array.from(document.querySelectorAll("[data-count-to]"));
  const menuToggle = document.querySelector("#menu-toggle");
  const navLinks = document.querySelector("#nav-links");
  const navButtons = Array.from(document.querySelectorAll("[data-section-target]"));
  const carouselNextButtons = Array.from(document.querySelectorAll("[data-carousel-next]"));
  const screens = Array.from(document.querySelectorAll("[data-section]"));
  const sectionAliases = { frameworks: "collaboration", collaborate: "collaboration", learn: "education" };

  const messages = [
    "Since the beginning, people have gathered to tell stories.",
    "Whether you want to build something new, or preserve what already exists...",
    "...you are in the right place.",
    "Today, the fire is a network.",
  ];

  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const emberPalette = [
    [91, 31, 21],
    [255, 77, 45],
    [255, 138, 61],
    [255, 209, 102],
    [247, 240, 220],
  ];
  const networkPalette = [
    [111, 231, 220],
    [142, 203, 255],
    [181, 156, 255],
    [223, 156, 255],
    [223, 156, 255],
  ];

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
  let targetPaletteMix = 0;
  let currentPaletteMix = 0;
  let activeSection = initialSection;
  let soundMuted = window.localStorage.getItem("protopicaFireMuted") === "true";
  let soundWaiting = false;
  let isIntroTransitioning = false;
  let isRoomTransitioning = false;
  let researchAvailability = null;
  let impactAnimationFrame = 0;

  function fireScaleForIndex(index) {
    const progress = index / Math.max(1, messages.length - 1);
    return 0.34 + progress * 0.66;
  }

  function setFireScale(index) {
    targetFireScale = fireScaleForIndex(index);
    targetPaletteMix = index >= messages.length - 1 ? 1 : 0;
    root.style.setProperty("--fire-scale", targetFireScale.toFixed(3));
    root.classList.toggle("is-network-step", targetPaletteMix === 1);
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

  function renderImpactValue(element, value) {
    const prefix = element.dataset.countPrefix || "";
    const suffix = element.dataset.countSuffix || "";
    element.textContent = prefix + value.toLocaleString("en-US") + suffix;
  }

  function animateImpactValues() {
    if (!impactValues.length) {
      return;
    }

    window.cancelAnimationFrame(impactAnimationFrame);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      impactValues.forEach(function (element) {
        renderImpactValue(element, Number(element.dataset.countTo) || 0);
      });
      return;
    }

    impactValues.forEach(function (element) {
      renderImpactValue(element, 0);
    });

    const startedAt = window.performance.now();
    const duration = 980;

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      impactValues.forEach(function (element) {
        const target = Number(element.dataset.countTo) || 0;
        renderImpactValue(element, Math.round(target * eased));
      });

      if (progress < 1) {
        impactAnimationFrame = window.requestAnimationFrame(tick);
      }
    }

    impactAnimationFrame = window.requestAnimationFrame(tick);
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
    if (sectionId === "work") {
      window.requestAnimationFrame(animateImpactValues);
    }
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
    currentPaletteMix = 0;
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
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const submitButton = contactForm.querySelector('[type="submit"]');
      const data = new FormData(contactForm);
      const payload = {};

      data.forEach(function (value, key) {
        payload[key] = String(value).trim();
      });

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }
      contactForm.setAttribute("aria-busy", "true");
      if (contactStatus) {
        contactStatus.className = "contact-form__status";
        contactStatus.textContent = "Sending your signal...";
      }

      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok || (result.success !== true && result.success !== "true")) {
          throw new Error(result.message || "Unable to send");
        }

        contactForm.reset();
        if (contactStatus) {
          contactStatus.classList.add("is-success");
          contactStatus.textContent = "Signal sent. We will be in touch.";
        }
      } catch (error) {
        if (contactStatus) {
          contactStatus.classList.add("is-error");
          contactStatus.innerHTML = 'The signal could not be sent. Email <a href="mailto:hello@protopica.com">hello@protopica.com</a> instead.';
        }
      } finally {
        contactForm.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send the Signal";
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

  carouselNextButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selector = button.dataset.carouselNext;
      const carousel = selector ? document.querySelector(selector) : null;
      const firstCard = carousel ? carousel.querySelector(".story-card") : null;
      if (!carousel || !firstCard) {
        return;
      }
      const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap || "0") || 0;
      carousel.scrollBy({
        left: firstCard.getBoundingClientRect().width + gap,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
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

  if (
    (!canvas || typeof canvas.getContext !== "function") &&
    (!homeCanvas || typeof homeCanvas.getContext !== "function")
  ) {
    return;
  }

  const ctx = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
  const homeCtx = homeCanvas && typeof homeCanvas.getContext === "function" ? homeCanvas.getContext("2d") : null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let homeWidth = 0;
  let homeHeight = 0;
  let raf = 0;
  let time = 0;

  if (!ctx && !homeCtx) {
    return;
  }

  if (ctx) {
    root.classList.add("has-canvas-fire");
  }

  function resizeSurface(targetCanvas, targetCtx, previousWidth, previousHeight) {
    if (!targetCanvas || !targetCtx) {
      return { width: previousWidth, height: previousHeight };
    }

    const rect = targetCanvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return { width: previousWidth, height: previousHeight };
    }

    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    const pixelWidth = Math.floor(nextWidth * dpr);
    const pixelHeight = Math.floor(nextHeight * dpr);

    if (targetCanvas.width !== pixelWidth || targetCanvas.height !== pixelHeight) {
      targetCanvas.width = pixelWidth;
      targetCanvas.height = pixelHeight;
    }
    targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width: nextWidth, height: nextHeight };
  }

  function resize() {
    const ritualSize = resizeSurface(canvas, ctx, width, height);
    const homeSize = resizeSurface(homeCanvas, homeCtx, homeWidth, homeHeight);
    width = ritualSize.width;
    height = ritualSize.height;
    homeWidth = homeSize.width;
    homeHeight = homeSize.height;
  }

  function noise(x, y, t) {
    const value = Math.sin(x * 12.9898 + y * 78.233 + t * 0.013) * 43758.5453;
    return value - Math.floor(value);
  }

  function pixel(surfaceCtx, x, y, size, color, alpha) {
    surfaceCtx.globalAlpha = alpha;
    surfaceCtx.fillStyle = color;
    const squareSize = Math.max(1, Math.round(size));
    surfaceCtx.fillRect(Math.round(x), Math.round(y), squareSize, squareSize);
  }

  function blendPaletteColor(from, to, mix) {
    const red = Math.round(from[0] + (to[0] - from[0]) * mix);
    const green = Math.round(from[1] + (to[1] - from[1]) * mix);
    const blue = Math.round(from[2] + (to[2] - from[2]) * mix);
    return "rgb(" + red + ", " + green + ", " + blue + ")";
  }

  function drawFireSurface(surfaceCtx, surfaceWidth, surfaceHeight, settings) {
    if (!surfaceCtx || surfaceWidth < 1 || surfaceHeight < 1) {
      return;
    }

    const scale = settings.scale;
    const isNarrow = surfaceWidth < 700;
    const isHome = settings.variant === "home";
    const cell = isNarrow ? 6 : surfaceWidth > 800 ? 7 : 6;
    const center = surfaceWidth * 0.5;
    const base = surfaceHeight * 1.02;
    const flameHeight = Math.min(
      surfaceHeight * (isHome ? (isNarrow ? 0.38 : 0.52) : (isNarrow ? 0.38 : 0.5)),
      isHome ? (isNarrow ? 300 : 480) : (isNarrow ? 340 : 430)
    ) * scale;
    const flameWidth = Math.min(
      surfaceWidth * (isHome ? (isNarrow ? 0.78 : 0.34) : (isNarrow ? 0.72 : 0.32)),
      isHome ? (isNarrow ? 360 : 430) : (isNarrow ? 350 : 360)
    ) * (0.8 + scale * 0.2);
    const paletteMix = Math.max(0, Math.min(1, settings.paletteMix));
    const colors = emberPalette.map(function (color, index) {
      return blendPaletteColor(color, networkPalette[index], paletteMix);
    });

    surfaceCtx.globalAlpha = 1;
    if (isHome) {
      surfaceCtx.clearRect(0, 0, surfaceWidth, surfaceHeight);
    } else {
      surfaceCtx.fillStyle = "#030404";
      surfaceCtx.fillRect(0, 0, surfaceWidth, surfaceHeight);
    }

    for (let y = 0; y < surfaceHeight; y += cell) {
      for (let x = 0; x < surfaceWidth; x += cell) {
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
        const tipWarp = (n - 0.5) * 0.14 + Math.sin(nx * 8 + time * 0.025) * 0.04;
        const tipProgress = smoothstep(0.48, 1.18, ny + tipWarp);
        const tipNoise = noise(x * 0.027 + 19, y * 0.031 - 11, time + 113);
        const tipBreakup = tipProgress * (0.12 + tipNoise * 0.48 + ordered * 0.2);
        const intensity =
          ny > -0.08 && ny < 1.22
            ? shape + flicker + emberFoot - ordered * (0.16 + (1 - edgeFade) * 0.8) - tipBreakup
            : -1;

        if (intensity > 0.02 && edgeFade > 0.035) {
          const colorIndex = Math.min(colors.length - 1, Math.max(0, Math.floor(intensity * 5)));
          const size = Math.max(2, cell - 1);
          const alpha = Math.min(0.92, (0.28 + intensity) * Math.min(1, edgeFade + 0.2));
          pixel(surfaceCtx, x, y, size, colors[colorIndex], alpha);
        }
      }
    }

    surfaceCtx.globalAlpha = 1;
  }

  function drawFire() {
    time += reducedMotion ? 0 : 1;
    currentFireScale += (targetFireScale - currentFireScale) * (reducedMotion ? 1 : 0.07);
    currentPaletteMix += (targetPaletteMix - currentPaletteMix) * (reducedMotion ? 1 : 0.075);

    if (root.classList.contains("is-ritual")) {
      drawFireSurface(ctx, width, height, {
        scale: currentFireScale,
        variant: "ritual",
        paletteMix: currentPaletteMix,
      });
    } else if (root.classList.contains("is-revealed") && activeSection === "home") {
      const homeScale = homeWidth < 700 ? 0.92 : 1.06;
      drawFireSurface(homeCtx, homeWidth, homeHeight, {
        scale: homeScale,
        variant: "home",
        paletteMix: 1,
      });
    }

    raf = window.requestAnimationFrame(drawFire);
  }

  resize();
  drawFire();
  window.addEventListener("resize", resize);
  const resizeObserver = typeof window.ResizeObserver === "function" ? new window.ResizeObserver(resize) : null;
  if (resizeObserver) {
    if (canvas) {
      resizeObserver.observe(canvas);
    }
    if (homeCanvas) {
      resizeObserver.observe(homeCanvas);
    }
  }
  window.addEventListener("beforeunload", function () {
    window.cancelAnimationFrame(raf);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
})();
