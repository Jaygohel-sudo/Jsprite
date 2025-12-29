export function exportPNG(imageData) {
  const tmp = document.createElement("canvas");
  tmp.width = imageData.width;
  tmp.height = imageData.height;

  const ctx = tmp.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = tmp.toDataURL("image/png");
  link.click();
}
