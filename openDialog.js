import { fileState, listSpritesFromDB, loadSpriteFromDB } from "./indexedDB.js";

const dialog = document.getElementById("openDialog");
const listEl = document.getElementById("projectList");
const cancelBtn = document.getElementById("openCancel");

export async function openOpenDialog(onLoad) {
  dialog.classList.remove("hidden");
  listEl.innerHTML = "";
  const project = await listSpritesFromDB();
  if (project.length === 0) {
    listEl.innerHTML = "<div class='project-item'>No Saved Projects</div>";
    return;
  }

  project.forEach((p) => {
    const item = document.createElement("div");
    item.className = "project-item";
    item.textContent = p.id;
    item.onclick = async () => {
      const sprite = await loadSpriteFromDB(p.id);
      fileState.id = p.id;
      fileState.name = p.id;
      fileState.dirty = false;
      closeDialog();
      onLoad(sprite);
    };
    listEl.appendChild(item);
  });
}

function closeDialog() {
  dialog.classList.add("hidden");
}

cancelBtn.onclick = closeDialog;
