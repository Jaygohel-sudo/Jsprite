import {
  color,
  drawColorSquare,
  drawHueSlider,
  insideSquare,
  insideHue,
  pickSV,
  pickHue,
  redraw,
  drawAlphaSlider,
  insideAlpha,
  pickAlpha,
} from "./colorPicker.js";

let active = null; // "sv" | "hue" | null

const ui = document.getElementById("ui");
const uiCtx = ui.getContext("2d");

ui.width = 200;
ui.height = 220;

drawColorSquare(uiCtx, 0, 0, 200, color.h);
drawHueSlider(uiCtx, 0, 200, 200, 10);
drawAlphaSlider(uiCtx);

ui.addEventListener("mousedown", (e) => {
  const r = ui.getBoundingClientRect();

  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  if (insideSquare(mx, my)) {
    active = "sv";
    pickSV(mx, my);
  } else if (insideHue(mx, my)) {
    active = "hue";
    pickHue(mx);
  } else if (insideAlpha(mx, my)) {
    active = "alpha";
    pickAlpha(mx);
  }

  redraw(uiCtx);
});

ui.addEventListener("mousemove", (e) => {
  if (!active) return;

  const r = ui.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  if (active === "sv") pickSV(mx, my);
  if (active === "hue") pickHue(mx);
  if (active === "alpha") pickAlpha(mx);

  redraw(uiCtx);
});
window.addEventListener("mouseup", () => {
  active = null;
});
