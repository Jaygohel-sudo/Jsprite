const layerPanel = document.getElementById("layer-panel");

export function renderLayers(sprite) {
  layerPanel.innerHTML = "";

  sprite.layers.forEach((layer, index) => {
    const row = document.createElement("div");
    row.className = "layer-row";
    row.textContent = layer.name;

    if (index === sprite.activeLayer) {
      row.classList.add("active");
    }

    row.addEventListener("click", () => {
      sprite.activeLayer = index;
      renderLayers(sprite);
    });

    layerPanel.appendChild(row);
  });
}

const framePanel = document.getElementById("frame");

export function renderFrames(sprite) {
  framePanel.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "frame-grid";

  sprite.frames.forEach((frame, frameIndex) => {
    const column = document.createElement("div");
    column.className = "frame-column";

    if (frameIndex === sprite.activeFrame) {
      column.classList.add("active");
    }

    sprite.layers.forEach((_, layerIndex) => {
      const cell = document.createElement("div");
      cell.className = "frame-cell";

      const hasCel = frame.cels.has(layerIndex);
      cell.classList.add(hasCel ? "filled" : "empty");

      cell.addEventListener("click", () => {
        sprite.activeFrame = frameIndex;
        renderFrames(sprite);
      });

      column.appendChild(cell);
    });

    grid.appendChild(column);
  });

  framePanel.appendChild(grid);
}
