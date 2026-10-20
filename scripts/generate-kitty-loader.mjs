import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import gifenc from "gifenc";
const { GIFEncoder } = gifenc;

// Package the generated artwork into a tiny, single-color transparent GIF.
// Runtime uses the exported GIF/PNG only; no canvas, timers or encoder ship.
const width = 240;
const height = 192;
const source = await readFile("design/kitty-loader/sprite-sheet.png");
await mkdir("public/images", { recursive: true });
await mkdir(".impeccable/review/kitty-loader", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
  headless: true,
});
try {
  const page = await browser.newPage();
  const frames = await page.evaluate(
    async ({ base64, width, height }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const cellWidth = image.naturalWidth / 4;
      const cellHeight = image.naturalHeight / 3;
      const crops = [];
      for (let i = 0; i < 12; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = cellWidth;
        canvas.height = cellHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          (i % 4) * cellWidth,
          Math.floor(i / 4) * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight,
        );
        const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = canvas.width,
          right = 0,
          top = canvas.height,
          bottom = 0;
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            if (rgba[(y * canvas.width + x) * 4 + 3] < 100) continue;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        crops.push({
          canvas,
          left,
          top,
          width: right - left + 1,
          height: bottom - top + 1,
        });
      }
      const maxWidth = Math.max(...crops.map((c) => c.width));
      const maxHeight = Math.max(...crops.map((c) => c.height));
      const scale = Math.min(
        (width - 28) / maxWidth,
        (height - 28) / maxHeight,
      );
      return crops.map((crop) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Common scale, nose anchor and foot baseline prevent cell-position jitter.
        ctx.drawImage(
          crop.canvas,
          crop.left,
          crop.top,
          crop.width,
          crop.height,
          width / 2 + (maxWidth * scale) / 2 - crop.width * scale,
          height - 14 - crop.height * scale,
          crop.width * scale,
          crop.height * scale,
        );
        const data = ctx.getImageData(0, 0, width, height);
        const indexed = [];
        for (let i = 0; i < width * height; i++) {
          const visible = data.data[i * 4 + 3] >= 100;
          indexed.push(visible ? 1 : 0);
          data.data.set([7, 63, 59, visible ? 255 : 0], i * 4);
        }
        ctx.putImageData(data, 0, 0);
        return { indexed, png: canvas.toDataURL("image/png") };
      });
    },
    { base64: source.toString("base64"), width, height },
  );
  const gif = GIFEncoder();
  for (const frame of frames)
    gif.writeFrame(Uint8Array.from(frame.indexed), width, height, {
      palette: [
        [0, 0, 0],
        [7, 63, 59],
      ],
      transparent: true,
      transparentIndex: 0,
      dispose: 2,
      delay: 80,
      repeat: 0,
    });
  gif.finish();
  const bytes = gif.bytes();
  await writeFile("public/images/kitty-running-v2.gif", bytes);
  await writeFile(
    "public/images/kitty-still-v2.png",
    Buffer.from(frames[0].png.split(",")[1], "base64"),
  );
  await page.setContent(
    `<body style="margin:0;padding:24px;background:#f7f9f8;display:grid;grid-template-columns:repeat(4,240px);gap:12px">${frames.map((f) => `<img src="${f.png}" width="240" height="192"/>`).join("")}</body>`,
  );
  await page.screenshot({
    path: ".impeccable/review/kitty-loader/frames-v2.png",
    fullPage: true,
  });
  console.log(
    `Exported ${frames.length} solid-color frames / 960ms loop / ${bytes.length} bytes.`,
  );
} finally {
  await browser.close();
}
