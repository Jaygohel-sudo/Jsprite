const menuBtn = document.querySelector(".menu-btn");
const dropdown = document.getElementById("menu-file");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  // toggle
  dropdown.classList.toggle("hidden");

  // position under button
  const rect = menuBtn.getBoundingClientRect();
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.top = `${rect.bottom}px`;
});

// click outside → close
document.addEventListener("click", () => {
  dropdown.classList.add("hidden");
});

// Esc → close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdown.classList.add("hidden");
  }
});

// function to open create new file dialog
newFile.addEventListener("click", () => {
  openCreateFileDialog();
  cancelNewFile.addEventListener("click", () => {
    newFileDialog.classList.add("hidden");
  });
});
export async function openCreateFileDialog() {
  newFileDialog.classList.remove("hidden");
}
