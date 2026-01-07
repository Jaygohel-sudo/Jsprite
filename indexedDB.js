import { Sprite, Frame, Layer, Cel } from "./pixel-editor-core.js";

const dialog = document.getElementById("saveDialog");
const input = document.getElementById("projectNameInput");
const schemaVersion = 2.0;

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

  const tx = db.transaction("sprites", "readwrite");
  const store = tx.objectStore("sprites");

  const data = {
    schemaVersion: 2,
    id,
    name: sprite.name ?? id,
    width: sprite.width,
    height: sprite.height,
    activeFrame: sprite.activeFrame,

    layers: sprite.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      opacity: layer.opacity,
    })),

    frames: sprite.frames.map((frame) => ({
      duration: frame.duration,
      cels: frame.cels.map((cel) => ({
        layerId: cel.layerId,
        pixels: cel.pixels,
      })),
    })),
  };

  let request = store.put(data);

  request.onsuccess = function () {};

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
      if (!data.schemaVersion) {
      }

      const sprite = new Sprite(data.width, data.height);
      sprite.frames.length = 0;
      sprite.layers.length = 0;
      sprite.name = data.name;
      sprite.activeFrame = Math.min(data.activeFrame, data.frames.length - 1);

      // restore layers
      data.layers.forEach((l) => {
        const layer = new Layer(l.name);
        layer.id = l.id;
        layer.visible = l.visible;
        layer.opacity = l.opacity;
        sprite.layers.push(layer);
      });

      // restore frames & cels
      data.frames.forEach((f) => {
        const frame = new Frame();
        frame.duration = f.duration;

        f.cels.forEach((c) => {
          const cel = new Cel(c.layerId, sprite.width, sprite.height);
          cel.pixels.set(c.pixels);
          frame.cels.push(cel);
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
    cancelBtn.removeEventListener("click", close);
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
  sprite.name = name;
  fileState.id = name;
  fileState.name = name;
  fileState.dirty = false;
}
