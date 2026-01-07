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
  SelectionTool,
  drawSelection,
} from "./pixel-editor-core.js";
import { exportPNG } from "./savefile.js";
import { renderFrames, renderLayers } from "./timeline.js";

export const WIDTH = 32;
export const HEIGHT = 32;
export let mx = 0;
export let my = 0;
export let shiftDown = false;
let drawline = false;
export let strokeId = 0;
export const history = new History();

const canvas = document.getElementById("canvas");

const brushButton = document.getElementById("brush");
const eraserButton = document.getElementById("eraser");
const saveButton = document.getElementById("save-file");
const saveAsButton = document.getElementById("save-as");
const exportButton = document.getElementById("export-file");
const loadButton = document.getElementById("load-file");
const viewportEl = document.getElementById("viewport");
let lastZoomTime = 0;
export const toolKit = {
  brush: new BrushTool([255, 255, 0, 255]),
  eraser: new EraserTool([0, 0, 0, 0]),
  selection: new SelectionTool(),
};

let activeTool = toolKit.brush;

const spriteData = {
  sprite: new Sprite(WIDTH, HEIGHT),
};
spriteData.sprite.addLayer("Layer 1");
spriteData.sprite.addFrame();
renderLayers(spriteData.sprite);
renderFrames(spriteData.sprite);

brushButton.addEventListener("click", () => {
  activeTool = toolKit.brush;
});
eraserButton.addEventListener("click", () => {
  activeTool = toolKit.eraser;
});
selection.addEventListener("click", () => {
  activeTool = toolKit.selection;
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
addFrameBtn.addEventListener("click", () => {
  spriteData.sprite.addFrameAfter(spriteData.sprite.activeFrame, 0);
  renderFrames(spriteData.sprite);
});

export let mousePixel = { x: null, y: null };
const renderer = new Renderer(WIDTH, HEIGHT);
renderer.resize(WIDTH, HEIGHT);
const viewport = new Viewport(canvas);

function resizeViewport() {
  const rect = viewportEl.getBoundingClientRect();
  viewport.resize(rect.width, rect.height);
}
const resizeObserver = new ResizeObserver(() => {
  resizeViewport();
});

resizeObserver.observe(viewportEl);

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
    strokeId++;

    drawing = true;
    const { x, y } = getPixelFromMouse(e);
    mousePixel.x = x;
    mousePixel.y = y;

    activeTool.onDown(spriteData.sprite, x, y, viewport);
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
  const { x, y } = getPixelFromMouse(e);
  mousePixel.x = x;
  mousePixel.y = y;

  // Panning
  if (viewport.isPanning) {
    const dx = e.clientX - viewport.panStartX;
    const dy = e.clientY - viewport.panStartY;

    viewport.panX = viewport.panOriginX + dx;
    viewport.panY = viewport.panOriginY + dy;
  }

  // Drawing
  if (drawing) {
    activeTool.onMove(spriteData.sprite, x, y, viewport);
  }
});

window.addEventListener("mouseup", () => {
  viewport.isPanning = false;
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat) shiftDown = true;
  if (e.ctrlKey && e.key.toLowerCase() === "r") {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftDown = false;
});
window.addEventListener("blur", () => {
  shiftDown = false;
});
function draw(e, pixelX, pixelY) {
  // activeTool.onDown(spriteData.sprite, pixelX, pixelY, viewport);
}
function loop() {
  renderer.renderFrame(
    spriteData.sprite,
    spriteData.sprite.currentFrame,
    spriteData.sprite.width,
    spriteData.sprite.height
  );
  viewport.draw(renderer.canvas);
  drawSelection(viewport.ctx, viewport);
  if (
    activeTool instanceof BrushTool &&
    activeTool.anchor !== null &&
    shiftDown &&
    mousePixel.x !== null
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
