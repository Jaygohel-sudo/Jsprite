# Jsprite

Jsprite is a lightweight, browser‑based **pixel sprite editor** built with modern JavaScript. It focuses on clarity, performance, and a clean workflow for creating and editing pixel art sprites, frames, and layers — without heavy frameworks or unnecessary complexity.

---

## What does this project do?

Jsprite lets you:

* Draw and edit **pixel‑perfect sprites** in the browser
* Work with **layers** and **animation frames**
* Select, move, and transform pixel regions
* Manage sprite data using a simple internal data model
* Save and load projects locally (via browser storage)

The project is designed to be modular and readable, making it suitable both as a **usable tool** and as a **learning reference** for canvas‑based editors.

---

## Why is this project useful?

* 🧠 **Educational** – Demonstrates how a pixel editor works internally (layers, frames, tools, rendering loop)
* 🧩 **Hackable** – No large frameworks; easy to modify or extend
* ⚡ **Lightweight** – Fast startup and minimal dependencies
* 🎮 **Game‑dev friendly** – Useful for indie devs or hobbyists creating 2D assets

If you’re interested in building creative tools, game editors, or learning how professional pixel editors are structured, Jsprite provides a solid foundation.

---

## How do I get started?

### 1. Clone the repository

```bash
git clone https://github.com/Jaygohel-sudo/Jsprite.git
cd Jsprite
```

### 2. Run locally

Jsprite runs entirely in the browser. You can use any local server:

```bash
# Using VS Code Live Server
# OR
python -m http.server
```

Then open:

```
http://localhost:8000
```

> ⚠️ A local server is required because browsers restrict certain APIs (like modules and storage) when opening files directly.

---

## Project structure (high‑level)

```
Jsprite/
├── index.html        # App entry point
├── src/
│   ├── editor/       # Core editor logic
│   ├── tools/        # Drawing & selection tools
│   ├── ui/           # UI components
│   └── core/         # Sprite, Layer, Frame models
├── styles/           # CSS styles
└── LICENSE
```

---

## Where can I get more help?

* 📄 **Source code** – The codebase is intentionally readable and commented
* 🐞 **Issues** – Open an issue on GitHub for bugs or feature requests
* 💡 **Discussions / PRs** – Contributions and suggestions are welcome

If something is unclear, feel free to open an issue — even documentation questions are valid.

---

## Contributing

Contributions are welcome! You can help by:

* Fixing bugs
* Improving performance
* Adding tools or UI improvements
* Improving documentation

### Basic workflow

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please keep changes focused and well‑documented.

---

## License

This project is licensed under the **GNU General Public License (GPL)**.

You are free to use, modify, and distribute this software under the terms of the license.

---

## Project status

Jsprite is an **active personal project** and may change frequently. Some features are experimental, and APIs are not yet stable.

Feedback is highly appreciated.

---

### ✨ Why Jsprite exists

Jsprite exists to explore how creative tools work under the hood — not just to use them, but to understand them.

If you learn something from this project, it’s already a success.
