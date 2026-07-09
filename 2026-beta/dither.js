(function () {
  const canvas = document.querySelector(".hero-canvas");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const buffer = document.createElement("canvas");
  const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });
  const image = new Image();
  const pointer = { active: false, x: 0.62, y: 0.42, force: 0.45 };
  const matrix = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const palette = ["#f8f2df", "#d8ff3d", "#42e8dc", "#ff765c", "#8e78ff"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let raf = 0;
  let time = 0;
  let width = 0;
  let height = 0;
  let loaded = false;

  if (!ctx || !bufferCtx) {
    return;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCoveredImage(sampleWidth, sampleHeight) {
    buffer.width = sampleWidth;
    buffer.height = sampleHeight;
    bufferCtx.imageSmoothingEnabled = true;
    bufferCtx.clearRect(0, 0, sampleWidth, sampleHeight);

    const scale = Math.max(
      sampleWidth / image.naturalWidth,
      sampleHeight / image.naturalHeight,
    );
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = (sampleWidth - drawWidth) / 2;
    const drawY = (sampleHeight - drawHeight) / 2;

    bufferCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function draw() {
    if (!loaded || !bufferCtx || !ctx) {
      raf = window.requestAnimationFrame(draw);
      return;
    }

    time += reducedMotion ? 0 : 0.018;
    pointer.force = pointer.active
      ? Math.min(1, pointer.force + 0.035)
      : Math.max(0.38, pointer.force - 0.015);

    const cell = width > 920 ? 7 : width > 560 ? 6 : 5;
    const sampleWidth = Math.max(1, Math.ceil(width / cell));
    const sampleHeight = Math.max(1, Math.ceil(height / cell));

    drawCoveredImage(sampleWidth, sampleHeight);

    const pixels = bufferCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#050606";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const index = (y * sampleWidth + x) * 4;
        const red = pixels[index] || 0;
        const green = pixels[index + 1] || 0;
        const blue = pixels[index + 2] || 0;
        const luma = red * 0.299 + green * 0.587 + blue * 0.114;
        const dx = x / sampleWidth - pointer.x;
        const dy = y / sampleHeight - pointer.y;
        const distance = Math.hypot(dx, dy);
        const reveal = Math.max(0, 1 - distance * 1.85) * 74 * pointer.force;
        const wave = Math.sin(x * 0.18 + y * 0.11 + time * 6) * 18;
        const ordered = matrix[(x % 4) + (y % 4) * 4] * 4 - 28;
        const value = luma + reveal + wave + ordered;

        if (value < 116) {
          continue;
        }

        const color = value > 205 ? palette[0] : palette[(x + y) % palette.length];
        const size = value > 176 ? cell : Math.max(2, cell - 3);

        ctx.fillStyle = color;
        ctx.globalAlpha = value > 205 ? 0.92 : 0.58;
        ctx.fillRect(x * cell, y * cell, size, size);
      }
    }

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#f8f2df";
    for (let y = 0; y < height; y += 9) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;

    raf = window.requestAnimationFrame(draw);
  }

  function handlePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.active = true;
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  image.onload = function () {
    loaded = true;
    resize();
    draw();
  };

  image.src = canvas.dataset.image || "protopica/artechouse-panorama.jpg";
  canvas.addEventListener("pointermove", handlePointer);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", function () {
    window.cancelAnimationFrame(raf);
  });
})();
