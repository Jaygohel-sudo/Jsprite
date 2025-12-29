import { Sprite, Frame, Layer } from "./pixel-editor-core.js";

const dialog = document.getElementById("saveDialog");
const input = document.getElementById("projectNameInput");

export const fileState = {
  id: null,
  name: null,
  dirty: false,
};

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PixelApp", 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      console.log(e);
      if (!db.objectStoreNames.contains("sprites")) {
        db.createObjectStore("sprites", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveSpriteToDB(sprite, id) {
  const db = await openDB();
  console.log(db);
  const tx = db.transaction("sprites", "readwrite");
  const store = tx.objectStore("sprites");

  const data = {
    id,
    name: id,
    width: sprite.width,
    height: sprite.height,
    activeFrame: sprite.activeFrame,

    frames: sprite.frames.map((frame) => ({
      layers: frame.layers.map((layer) => ({
        width: layer.width,
        height: layer.height,
        visible: layer.visible,
        opacity: layer.opacity,
        pixels: layer.pixels, // Uint8ClampedArray stored directly
      })),
    })),
  };

  let request = store.put(data);

  request.onsuccess = function () {
    // (4)
    console.log(sprite.currentFrame.layers[0].pixels);
  };

  request.onerror = function () {
    console.log("Error", request.error);
  };
}

// load sprite

export async function loadSpriteFromDB(id = "autosave") {
  const db = await openDB();
  const tx = db.transaction("sprites", "readonly");
  const store = tx.objectStore("sprites");

  return new Promise((resolve, reject) => {
    const req = store.get(id);

    req.onsuccess = () => {
      const data = req.result;
      if (!data) return resolve(null);

      const sprite = new Sprite(data.width, data.height);
      sprite.activeFrame = data.activeFrame;

      data.frames.forEach((frameData) => {
        const frame = new Frame();

        frameData.layers.forEach((layerData) => {
          const layer = new Layer(layerData.width, layerData.height);

          layer.visible = layerData.visible;
          layer.opacity = layerData.opacity;
          layer.pixels.set(layerData.pixels);

          frame.layers.push(layer);
        });

        sprite.frames.push(frame);
      });

      resolve(sprite);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function listSpritesFromDB() {
  const db = await openDB();
  const tx = db.transaction("sprites", "readonly");
  const store = tx.objectStore("sprites");

  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// open dialog box to save
export async function openSaveDialog(sprite) {
  dialog.classList.remove("hidden");
  input.value = sprite.name || "";
  input.focus();

  const onSave = async () => {
    const name = input.value.trim();

    if (!name) return;

    await saveAs(sprite, name);
    close();
  };

  const close = () => {
    dialog.classList.add("hidden");
    saveBtn.removeEventListener("click", onSave);
  };

  const saveBtn = document.getElementById("saveConfirm");
  const cancelBtn = document.getElementById("saveCancel");

  saveBtn.addEventListener("click", onSave);
  cancelBtn.addEventListener("click", close);
}

export async function save(sprite) {
  // Already saved → overwrite silently
  if (fileState.id) {
    await saveSpriteToDB(sprite, fileState.id);
    fileState.dirty = false;
    return;
  }

  // Never saved → Save As
  openSaveDialog(sprite);
}
async function saveAs(sprite, name) {
  await saveSpriteToDB(sprite, name);

  fileState.id = name;
  fileState.name = name;
  fileState.dirty = false;
  console.log(fileState);
}
