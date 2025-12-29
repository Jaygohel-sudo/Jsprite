import { RGB } from "./colorPicker.js";
import { History } from "./commands.js";

import {
  listSpritesFromDB,
  loadSpriteFromDB,
  openDB,
  openSaveDialog,
  save,
  saveSpriteToDB,
} from "./indexedDB.js";
import { spaceDown } from "./keystate.js";
import { openOpenDialog } from "./openDialog.js";
import {
  Sprite,
  Renderer,
  BrushTool,
  EraserTool,
  Viewport,
} from "./pixel-editor-core.js";
import { exportPNG } from "./savefile.js";

export const WIDTH = 32;
export const HEIGHT = 32;
export let mx = 0;
export let my = 0;
export let shiftDown = false;
let drawline = false;

export const history = new History();

const canvas = document.getElementById("canvas");

const brushButton = document.getElementById("brush");
const eraserButton = document.getElementById("eraser");
const saveButton = document.getElementById("save-file");
const saveAsButton = document.getElementById("save-as");
const exportButton = document.getElementById("export-file");
const loadButton = document.getElementById("load-file");
let lastZoomTime = 0;
export const toolKit = {
  brush: new BrushTool([255, 255, 0, 255]),
  eraser: new EraserTool([0, 0, 0, 0]),
};

let activeTool = toolKit.brush;

const spriteData = {
  sprite: new Sprite(WIDTH, HEIGHT),
};

brushButton.addEventListener("click", () => {
  activeTool = toolKit.brush;
});
eraserButton.addEventListener("click", () => {
  activeTool = toolKit.eraser;
});
saveButton.addEventListener("click", async () => {
  await save(spriteData.sprite);
});
saveAsButton.addEventListener("click", async () => {
  await openSaveDialog(spriteData.sprite);
});
exportButton.addEventListener("click", () => {
  const img = renderer.renderFrameToImageData(
    spriteData.sprite.currentFrame,
    spriteData.sprite.width,
    spriteData.sprite.height
  );
  exportPNG(img);
});
loadButton.addEventListener("click", async () => {
  await openOpenDialog((sprite) => {
    spriteData.sprite = sprite;
  });
});

export let mousePixel = { x: -1, y: -1 };
const renderer = new Renderer(WIDTH, HEIGHT);
renderer.resize(WIDTH, HEIGHT);
const viewport = new Viewport(canvas);
const rect = viewport.canvas.getBoundingClientRect();
viewport.resize(rect.width, rect.height);

spriteData.sprite.addFrame();

function getPixelFromMouse(e) {
  const rect = viewport.canvas.getBoundingClientRect();

  mx = e.clientX - rect.left;
  my = e.clientY - rect.top;

  const drawW = viewport.sourceWidth * viewport.zoom;
  const drawH = viewport.sourceHeight * viewport.zoom;

  const offsetX = (viewport.canvas.width - drawW) / 2;
  const offsetY = (viewport.canvas.height - drawH) / 2;

  const px = Math.floor((mx - offsetX - viewport.panX) / viewport.zoom);
  const py = Math.floor((my - offsetY - viewport.panY) / viewport.zoom);

  return { x: px, y: py };
}

let drawing = false;
canvas.addEventListener("mouseenter", () => {
  drawline = true;
});
canvas.addEventListener("mousemove", () => {
  drawline = true;
});
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0 && !spaceDown) {
    drawing = true;
    draw(e, mousePixel.x, mousePixel.y);
  }
});
canvas.addEventListener("wheel", (e) => {
  if (e.ctrlKey) return;
  e.preventDefault();
  const now = performance.now();

  if (now - lastZoomTime < 1) return;

  lastZoomTime = now;

  if (e.deltaY < 0) viewport.zoomIn();
  else viewport.zoomOut();
});

window.addEventListener("mousemove", (e) => {
  if (drawing) {
    const { x, y } = getPixelFromMouse(e);

    mousePixel.x = x;
    mousePixel.y = y;
    activeTool.onMove(spriteData.sprite, x, y, viewport);
    draw(e, x, y);
  }
  mousePixel = getPixelFromMouse(e);
});
canvas.addEventListener(
  "wheel",
  (e) => {
    if (!e.ctrlKey) return;

    e.preventDefault(); // VERY IMPORTANT

    if (e.deltaY < 0) {
      viewport.cursorSize++;
    } else {
      viewport.cursorSize = Math.max(viewport.cursorSize - 1, 1);
    }
  },
  { passive: false }
);

canvas.addEventListener("mouseleave", () => {
  mousePixel = { x: null, y: null };
  drawline = false;
});

window.addEventListener("mouseup", (e) => {
  drawing = false;
  activeTool?.onUp();
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 0 && spaceDown) {
    viewport.isPanning = true;
    viewport.panStartX = e.clientX;
    viewport.panStartY = e.clientY;
    viewport.panOriginX = viewport.panX;
    viewport.panOriginY = viewport.panY;
  }
});
window.addEventListener("mousemove", (e) => {
  if (!viewport.isPanning) return;

  const dx = e.clientX - viewport.panStartX;
  const dy = e.clientY - viewport.panStartY;

  viewport.panX = viewport.panOriginX + dx;
  viewport.panY = viewport.panOriginY + dy;
});

window.addEventListener("mouseup", () => {
  viewport.isPanning = false;
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shiftDown = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftDown = false;
});

function draw(e, pixelX, pixelY) {
  activeTool.onDown(spriteData.sprite, pixelX, pixelY, viewport);
}
function loop() {
  renderer.renderFrame(
    spriteData.sprite.currentFrame,
    spriteData.sprite.width,
    spriteData.sprite.height
  );
  viewport.draw(renderer.canvas);
  if (
    activeTool instanceof BrushTool &&
    shiftDown &&
    toolKit.brush.anchor &&
    drawline
  ) {
    viewport.drawLinePreview(
      toolKit.brush.anchor.x,
      toolKit.brush.anchor.y,
      mousePixel.x,
      mousePixel.y
    );
  }
  viewport.drawCursor(mousePixel.x, mousePixel.y);

  requestAnimationFrame(loop);
}

loop();
