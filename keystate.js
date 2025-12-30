import { history, strokeId } from "./main.js";

export let spaceDown = false;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    spaceDown = true;
    e.preventDefault(); // stop page scrolling
  }
  // UNDO
  if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    history.undo();
  }

  // REDO (Ctrl+Y or Ctrl+Shift+Z)
  if (
    (e.ctrlKey && e.key.toLowerCase() === "y") ||
    (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z")
  ) {
    e.preventDefault();
    history.redo();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    spaceDown = false;
  }
});
