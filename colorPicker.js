import { toolKit } from "./main.js";

export let color = {
  h: 120, // 0–360
  s: 1, // 0–1
  v: 1, // 0–1
  a: 1, // 0–1
};
export let RGB = {
  r: 0,
  g: 0,
  b: 0,
};

export const square = { x: 0, y: 0, size: 200 };
export const hueBar = { x: 0, y: 200, w: 200, h: 10 };
export const alphaBar = { x: 0, y: 210, w: 200, h: 10 };

export function hsvToRgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  RGB.r = Math.round((r + m) * 255);
  RGB.g = Math.round((g + m) * 255);
  RGB.b = Math.round((b + m) * 255);
}

export function drawColorSquare(ctx, x, y, size, hue) {
  // Base hue color
  ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
  ctx.fillRect(x, y, size, size);

  // White gradient (saturation)
  let sat = ctx.createLinearGradient(x, y, x + size, y);
  sat.addColorStop(0, "white");
  sat.addColorStop(1, "transparent");
  ctx.fillStyle = sat;
  ctx.fillRect(x, y, size, size);

  // Black gradient (value)
  let val = ctx.createLinearGradient(x, y, x, y + size);
  val.addColorStop(0, "transparent");
  val.addColorStop(1, "black");
  ctx.fillStyle = val;
  ctx.fillRect(x, y, size, size);
}

export function drawHueSlider(ctx, x, y, w, h) {
  let grad = ctx.createLinearGradient(x, y, x + w, y);

  for (let i = 0; i <= 360; i += 60) {
    grad.addColorStop(i / 360, `hsl(${i},100%,50%)`);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function drawChecker(ctx, x, y, w, h, size = 4) {
  for (let iy = 0; iy < h; iy += size) {
    for (let ix = 0; ix < w; ix += size) {
      ctx.fillStyle =
        (Math.floor(ix / size) + Math.floor(iy / size)) % 2 === 0
          ? "#888"
          : "#444";
      ctx.fillRect(x + ix, y + iy, size, size);
    }
  }
}
export function drawAlphaSlider(ctx) {
  // Checkerboard
  drawChecker(ctx, alphaBar.x, alphaBar.y, alphaBar.w, alphaBar.h);

  // Current RGB color

  // Alpha gradient
  const grad = ctx.createLinearGradient(
    alphaBar.x,
    alphaBar.y,
    alphaBar.x + alphaBar.w,
    alphaBar.y
  );
  grad.addColorStop(0, `rgba(${RGB.r},${RGB.g},${RGB.b},0)`);
  grad.addColorStop(1, `rgba(${RGB.r},${RGB.g},${RGB.b},1)`);

  ctx.fillStyle = grad;
  ctx.fillRect(alphaBar.x, alphaBar.y, alphaBar.w, alphaBar.h);

  // Marker
  const mx = alphaBar.x + color.a * alphaBar.w;
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(mx, alphaBar.y - 2);
  ctx.lineTo(mx, alphaBar.y + alphaBar.h + 2);
  ctx.stroke();
}
export function pickAlpha(mx) {
  const relX = mx - alphaBar.x;
  color.a = clamp(relX / alphaBar.w);
}
export function insideAlpha(x, y) {
  return (
    x >= alphaBar.x &&
    x <= alphaBar.x + alphaBar.w &&
    y >= alphaBar.y &&
    y <= alphaBar.y + alphaBar.h
  );
}

export function insideSquare(x, y) {
  return (
    x >= square.x &&
    x <= square.x + square.size &&
    y >= square.y &&
    y <= square.y + square.size
  );
}

export function insideHue(x, y) {
  return (
    x >= hueBar.x &&
    x <= hueBar.x + hueBar.w &&
    y >= hueBar.y &&
    y <= hueBar.y + hueBar.h
  );
}

export function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function pickSV(mouseX, mouseY) {
  const relX = mouseX - square.x;
  const relY = mouseY - square.y;

  color.s = clamp(relX / square.size);
  color.v = clamp(1 - relY / square.size);
}

export function pickHue(mouseX) {
  const relX = mouseX - hueBar.x;
  color.h = clamp(relX / hueBar.w) * 360;
}
export function drawSVSelector(ctx, x, y, size, color) {
  const sx = x + color.s * size;
  const sy = y + (1 - color.v) * size;

  ctx.save();
  ctx.lineWidth = 1;

  // Outer black ring
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.arc(sx, sy, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Inner white ring
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
export function drawHueMarker(ctx, x, y, width, height, color) {
  const hx = x + (color.h / 360) * width;

  ctx.save();

  // Black line
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(hx, y);
  ctx.lineTo(hx, y + height);
  ctx.stroke();

  // White inner line
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(hx + 1, y);
  ctx.lineTo(hx + 1, y + height);
  ctx.stroke();

  ctx.restore();
}
export function redraw(uiCtx) {
  uiCtx.clearRect(0, 0, ui.width, ui.height);

  // Panel background
  uiCtx.fillStyle = "#1e1e1e";
  uiCtx.fillRect(0, 0, ui.width, ui.height);

  // Widgets
  drawColorSquare(uiCtx, square.x, square.y, square.size, color.h);
  drawHueSlider(uiCtx, hueBar.x, hueBar.y, hueBar.w, hueBar.h);
  drawAlphaSlider(uiCtx);
  hsvToRgb(color.h, color.s, color.v);
  toolKit.brush.setBrushColor(RGB.r, RGB.g, RGB.b, Math.round(color.a * 255));
  // Indicators
  drawSVSelector(uiCtx, square.x, square.y, square.size, color);
  //   drawHueMarker(uiCtx);
}
