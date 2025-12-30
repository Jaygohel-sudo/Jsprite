import { RGB } from "./colorPicker.js";
import { CompositeCommand, PixelCommand } from "./commands.js";
import { fileState } from "./indexedDB.js";
import {
  HEIGHT,
  mousePixel,
  WIDTH,
  mx,
  my,
  shiftDown,
  history,
  strokeId,
} from "./main.js";

export function pixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class Sprite {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.frames = [];
    this.activeFrame = 0;
  }

  addFrame() {
    const frame = new Frame();

    frame.addLayer(this.width, this.height);
    this.frames.push(frame);
    return frame;
  }

  get currentFrame() {
    return this.frames[this.activeFrame];
  }
}

export class Frame {
  constructor() {
    this.layers = [];
  }

  addLayer(width, height) {
    const layer = new Layer(width, height);
    this.layers.push(layer);
    return layer;
  }
}

export class Layer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.visible = true;
    this.opacity = 1;

    // RGBA buffer
    this.pixels = new Uint8ClampedArray(width * height * 4);
    this.strokeMask = new Uint32Array(width * height);
  }
}

/* 
   Pixel Operations
    */

export function setPixel(layer, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return;

  const i = pixelIndex(x, y, layer.width);
  const p = layer.pixels;

  const pi = y * layer.width + x;
  if (layer.strokeMask[pi] === strokeId) return;

  layer.strokeMask[pi] = strokeId;

  // Destination pixel
  const dr = p[i];
  const dg = p[i + 1];
  const db = p[i + 2];
  const da = p[i + 3] / 255;

  // Source pixel
  const sa = a / 255;

  // Alpha out
  const outA = sa + da * (1 - sa);

  if (outA === 0) {
    p[i] = p[i + 1] = p[i + 2] = p[i + 3] = 0;
    return;
  }

  // Blend
  p[i] = Math.round((r * sa + dr * da * (1 - sa)) / outA);
  p[i + 1] = Math.round((g * sa + dg * da * (1 - sa)) / outA);
  p[i + 2] = Math.round((b * sa + db * da * (1 - sa)) / outA);
  p[i + 3] = Math.round(outA * 255);
  onPixelChange();
}
function onPixelChange() {
  fileState.dirty = true;
}

export function getPixel(layer, x, y) {
  if (x < 0 || y < 0 || x >= layer.width || y >= layer.height)
    return [0, 0, 0, 0];

  const i = pixelIndex(x, y, layer.width);
  const p = layer.pixels;

  return [p[i], p[i + 1], p[i + 2], p[i + 3]];
}

/* =====================
   Renderer (Canvas View)
   ===================== */

export class Renderer {
  constructor(width, height) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: false });
    this.ctx.imageSmoothingEnabled = false;
  }
  fillCheckerboard(target, width, height, size = 8) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const isDark = (((x / size) | 0) + ((y / size) | 0)) & 1;

        const c = isDark ? 180 : 220;
        target[i] = c;
        target[i + 1] = c;
        target[i + 2] = c;
        target[i + 3] = 255;
      }
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  renderFrame(frame, width, height) {
    const imageData = this.ctx.createImageData(width, height);
    const out = imageData.data;
    this.fillCheckerboard(out, width, height);
    for (const layer of frame.layers) {
      if (!layer.visible) continue;
      this.compositeLayer(out, layer);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }
  renderFrameToImageData(frame, width, height) {
    const imageData = this.ctx.createImageData(width, height);
    const out = imageData.data;

    // start transparent
    for (let i = 0; i < out.length; i += 4) {
      out[i + 3] = 0;
    }

    for (const layer of frame.layers) {
      if (!layer.visible) continue;
      this.compositeLayer(out, layer);
    }

    return imageData;
  }

  compositeLayer(target, layer) {
    const src = layer.pixels;
    const opacity = layer.opacity;

    for (let i = 0; i < src.length; i += 4) {
      const sr = src[i];
      const sg = src[i + 1];
      const sb = src[i + 2];
      const sa = (src[i + 3] / 255) * opacity;

      if (sa === 0) continue;

      const dr = target[i];
      const dg = target[i + 1];
      const db = target[i + 2];
      const da = target[i + 3] / 255;

      const outA = sa + da * (1 - sa);
      if (outA === 0) {
        target[i] = target[i + 1] = target[i + 2] = target[i + 3] = 0;
        continue;
      }

      target[i] = Math.round((sr * sa + dr * da * (1 - sa)) / outA);
      target[i + 1] = Math.round((sg * sa + dg * da * (1 - sa)) / outA);
      target[i + 2] = Math.round((sb * sa + db * da * (1 - sa)) / outA);
      target[i + 3] = Math.round(outA * 255);
    }
  }
}
// viewport

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.zoom = 16;
    this.minZoom = 1;
    this.maxZoom = 32;
    this.cursorSize = 1;
    this.minCursorSize = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.panX = 0;
    this.panY = 0;

    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.panOriginX = 0;
    this.panOriginY = 0;
  }

  zoomIn() {
    if (this.zoom === this.maxZoom) return;

    this.zoom++;
  }

  zoomOut() {
    if (this.zoom === this.minZoom) return;
    this.zoom--;
  }
  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  draw(sourceCanvas) {
    this.sourceWidth = sourceCanvas.width;
    this.sourceHeight = sourceCanvas.height;
    const ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.imageSmoothingEnabled = false;

    ctx.save();

    const drawW = sourceCanvas.width * this.zoom;
    const drawH = sourceCanvas.height * this.zoom;

    const baseX = Math.floor((this.canvas.width - drawW) / 2);
    const baseY = Math.floor((this.canvas.height - drawH) / 2);

    ctx.translate(baseX + this.panX, baseY + this.panY);
    ctx.scale(this.zoom, this.zoom);

    ctx.drawImage(sourceCanvas, 0, 0);

    ctx.restore();
  }

  getBrushMask(size) {
    // size 1
    if (size === 1) {
      return [[0, 0]];
    }

    // size 2 (2x2 block)
    if (size === 2) {
      return [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [0, 0],
      ];
    }

    // size 3 (cross)
    if (size === 3) {
      return [
        [-1, 0],
        [0, 0],
        [0, -1],
        [1, 0],
        [0, 1],
      ];
    }

    // size >= 4 → Euclidean circle
    return this.generateCircularMask(size);
  }

  generateCircularMask(size) {
    const mask = [];
    const r = size / 2;
    const c = (size - 1) / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - c;
        const dy = y - c;

        if (dx * dx + dy * dy <= r * r) {
          mask.push([x - Math.floor(size / 2), y - Math.floor(size / 2)]);
        }
      }
    }
    return mask;
  }
  _drawCursorBlock(pixelX, pixelY, mask) {
    for (const [mx, my] of mask) {
      const sx = pixelX + mx;
      const sy = pixelY + my;

      const x = this.offsetX + sx * this.zoom;
      const y = this.offsetY + sy * this.zoom;

      this.ctx.fillRect(x, y, this.zoom, this.zoom);
    }
  }
  drawCursor(pixelX, pixelY) {
    const size = this.cursorSize;

    const mask = this.getBrushMask(size);

    const drawW = this.sourceWidth * this.zoom;
    const drawH = this.sourceHeight * this.zoom;

    this.offsetX = Math.floor((this.canvas.width - drawW) / 2) + this.panX;
    this.offsetY = Math.floor((this.canvas.height - drawH) / 2) + this.panY;

    this.ctx.fillStyle = `rgba(${RGB.r}, ${RGB.g}, ${RGB.b}, 0.9)`;
    this._drawCursorBlock(pixelX, pixelY, mask);
  }
  drawLinePreview(x0, y0, x1, y1) {
    const mask = this.getBrushMask(this.cursorSize);

    const drawW = this.sourceWidth * this.zoom;
    const drawH = this.sourceHeight * this.zoom;

    this.offsetX = Math.floor((this.canvas.width - drawW) / 2) + this.panX;
    this.offsetY = Math.floor((this.canvas.height - drawH) / 2) + this.panY;

    this.ctx.fillStyle = `rgba(${RGB.r}, ${RGB.g}, ${RGB.b}, 0.6)`;

    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this._drawCursorBlock(x0, y0, mask);

      if (x0 === x1 && y0 === y1) break;

      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
}

/* Tool System*/

export class Tool {
  onDown(sprite, x, y, viewport) {
    this.stroke = new CompositeCommand();
  }
  onMove(sprite, x, y) {}
  onUp(sprite, x, y) {
    if (this.stroke && this.stroke.commands.length > 0) {
      history.push(this.stroke);
    }
    this.stroke = null;
  }
  applyPixel(sprite, x, y, color) {
    if (!this.stroke) return;
    const layer = sprite.currentFrame.layers[0];
    if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return;
    const prevColor = getPixel(layer, x, y).slice();

    // // prevent duplicate commands
    // if (
    //   prevColor[0] === color[0] &&
    //   prevColor[1] === color[1] &&
    //   prevColor[2] === color[2] &&
    //   prevColor[3] === color[3]
    // ) {
    //   return;
    // }

    const cmd = new PixelCommand(layer, x, y, prevColor, color);

    this.stroke.add(cmd);
    cmd.execute();
  }
}

export class BrushTool extends Tool {
  constructor(color = [0, 0, 0, 255]) {
    super();
    this.color = color;
    this.anchor = null;
  }
  setBrushColor(r, g, b, a = 255) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.color[3] = a;
  }
  onDown(sprite, x, y, viewport) {
    super.onDown(sprite, x, y, viewport);
    if (!shiftDown) {
      this.anchor = { x, y };
    }
    if (shiftDown && this.anchor) {
      drawLine(
        sprite,
        this.anchor.x,
        this.anchor.y,
        x,
        y,
        viewport.getBrushMask(viewport.cursorSize),
        viewport.cursorSize,
        (px, py) => {
          this.applyPixel(sprite, px, py, this.color);
        }
      );
      this.anchor = { x, y };
    }
    this.lastX = x;
    this.lastY = y;

    const mask = viewport.getBrushMask(viewport.cursorSize);

    const layer = sprite.currentFrame.layers[0];

    for (const [mx, my] of mask) {
      this.applyPixel(sprite, x + mx, y + my, this.color);
    }
  }

  onMove(sprite, x, y, viewport) {
    if (this.lastX === null) return;

    const mask = viewport.getBrushMask(viewport.cursorSize);
    drawLine(
      sprite,
      this.lastX,
      this.lastY,
      x,
      y,
      mask,
      viewport.cursorSize,
      (px, py) => {
        this.applyPixel(sprite, px, py, this.color);
      }
    );

    this.lastX = x;
    this.lastY = y;
  }

  onUp() {
    super.onUp();
    this.lastX = null;
    this.lastY = null;
  }
}
export class EraserTool extends Tool {
  constructor(color = [0, 0, 0, 0]) {
    super();
    this.color = color;
  }
  onDown(sprite, x, y, viewport) {
    this.lastX = x;
    this.lastY = y;

    const mask = viewport.getBrushMask(viewport.cursorSize);
    const half = Math.floor(viewport.cursorSize / 2);

    const layer = sprite.currentFrame.layers[0];

    for (const [mx, my] of mask) {
      const px = x + mx;
      const py = y + my;

      if (px < 0 || py < 0 || px >= layer.width || py >= layer.height) continue;

      const i = pixelIndex(px, py, layer.width);

      layer.pixels[i + 3] = 0; // hard erase alpha
    }
  }

  onMove(sprite, x, y, viewport) {
    if (this.lastX === null) return;
    const mask = viewport.getBrushMask(viewport.cursorSize);
    this.eraseLine(
      sprite,
      this.lastX,
      this.lastY,
      x,
      y,
      mask,

      this.color
    );

    this.lastX = x;
    this.lastY = y;
  }

  onUp() {
    this.lastX = null;
    this.lastY = null;
  }

  drawPixel(sprite, x, y) {
    const layer = sprite.currentFrame.layers[0];
    setPixel(layer, x, y, ...this.color);
  }
  eraseLine(sprite, x0, y0, x1, y1, brushMask, color) {
    const layer = sprite.currentFrame.layers[0];
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      for (const [mx, my] of brushMask) {
        const px = x0 + mx;
        const py = y0 + my;
        const i = pixelIndex(px, py, layer.width);
        layer.pixels[i + 3] = 0;
      }

      if (x0 === x1 && y0 === y1) break;

      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
}

export function drawLine(sprite, x0, y0, x1, y1, brushMask, size, plot) {
  const layer = sprite.currentFrame.layers[0];

  x0 |= 0;
  y0 |= 0;
  x1 |= 0;
  y1 |= 0;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    for (const [mx, my] of brushMask) {
      const px = x0 + mx;
      const py = y0 + my;
      plot(px, py);
    }

    if (x0 === x1 && y0 === y1) break;

    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}
