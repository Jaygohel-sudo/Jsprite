import { AnimationPlayer } from "./animationPlayer.js";
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
  spriteManager,
} from "./pixel-editor-core.js";
import { exportPNG } from "./savefile.js";
import { displaySpriteBar } from "./spritewindow.js";
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
const viewportEl = document.getElementById("canvas-div");
const playButton = document.getElementById("play-btn");
const stopButton = document.getElementById("stop-btn");
let lastZoomTime = 0;
export const toolKit = {
  brush: new BrushTool([255, 255, 0, 255]),
  eraser: new EraserTool([0, 0, 0, 0]),
  selection: new SelectionTool(),
};
let activeTool = toolKit.brush;

export function getActiveSprite() {
  return spriteManager.sprites.find(
    (s) => s.id === spriteManager.activeSpriteId
  );
}

const firstSprite = new Sprite({
  name: "Sprite 1",
  width: WIDTH,
  height: HEIGHT,
});

spriteManager.sprites.push(firstSprite);
spriteManager.activeSpriteId = firstSprite.id;
export async function withActiveSprite(fn) {
  const sprite = getActiveSprite();
  if (!sprite) return;
  return fn(sprite);
}
export const renderer = new Renderer(WIDTH, HEIGHT);
displaySpriteBar();
withActiveSprite((sprite) => {
  sprite.addLayer("Layer 1");
  sprite.addFrame();
  renderLayers(sprite);
  renderFrames(sprite);
  renderer.resize(sprite.width, sprite.height);
});

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
  await withActiveSprite((sprite) => save(sprite));
});
saveAsButton.addEventListener("click", async () => {
  await withActiveSprite((sprite) => openSaveDialog(sprite));
});
exportButton.addEventListener("click", () => {
  withActiveSprite((sprite) => {
    const img = renderer.renderFrameToImageData(
      sprite.currentFrame,
      sprite.width,
      sprite.height
    );
    exportPNG(img);
  });
});
loadButton.addEventListener("click", async () => {
  await openOpenDialog((loadedSprite) => {
    if (!loadedSprite) return;

    // 1. Add sprite
    spriteManager.sprites.push(loadedSprite);

    // 2. Activate it
    spriteManager.activeSpriteId = loadedSprite.id;

    // 3. Resize renderer
    renderer.resize(loadedSprite.width, loadedSprite.height);

    // 4. Refresh UI
    renderLayers(loadedSprite);
    renderFrames(loadedSprite);
    displaySpriteBar();
  });
});
addFrameBtn.addEventListener("click", () => {
  withActiveSprite((sprite) => {
    sprite.addFrameAfter(sprite.activeFrame, 0);
    renderFrames(sprite);
  });
});
removeFrameBtn.addEventListener("click", () => {
  withActiveSprite((sprite) => {
    sprite.removeFrame();
    renderFrames(sprite);
  });
});

export let mousePixel = { x: null, y: null };

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
    withActiveSprite((sprite) => {
      activeTool.onDown(sprite, x, y, viewport);
      renderFrames(sprite);
    });
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
    withActiveSprite((sprite) => activeTool.onMove(sprite, x, y, viewport));
  }
});

window.addEventListener("mouseup", () => {
  viewport.isPanning = false;
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat) shiftDown = true;
  // if (e.ctrlKey && e.key.toLowerCase() === "r") {
  //   e.preventDefault();
  // }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftDown = false;
});
window.addEventListener("blur", () => {
  shiftDown = false;
});
function draw(e, pixelX, pixelY) {
  // activeTool.onDown( sprite, pixelX, pixelY, viewport);
}

playButton.onclick = () =>
  withActiveSprite((sprite) => animationPlayer.play(sprite));
stopButton.onclick = () =>
  withActiveSprite((sprite) => animationPlayer.stop(sprite));
let lastTime = performance.now();
const animationPlayer = new AnimationPlayer();

function loop(now = performance.now()) {
  const dt = now - lastTime;
  lastTime = now;
  withActiveSprite((sprite) => {
    animationPlayer.update(dt, sprite);
    renderer.renderFrame(
      sprite,
      sprite.currentFrame,
      sprite.width,
      sprite.height
    );
  });

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
