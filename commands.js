/*
   Undo / Redo System
   */

import { setPixel, setPixelDirect } from "./pixel-editor-core.js";

export class Command {
  execute() {}
  undo() {}
}
export class CompositeCommand extends Command {
  constructor() {
    super();
    this.commands = [];
  }

  add(cmd) {
    this.commands.push(cmd);
  }

  execute() {
    this.commands.forEach((c) => c.execute());
  }

  undo() {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

export class PixelCommand extends Command {
  constructor(layer, x, y, before, after) {
    super();
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.before = before;
    this.after = after;
  }

  execute() {
    setPixelDirect(this.layer, this.x, this.y, ...this.after);
  }

  undo() {
    setPixelDirect(this.layer, this.x, this.y, ...this.before);
  }
}

export class History {
  constructor() {
    this.stack = [];
    this.index = -1;
    this.strokeId = 0;
  }

  push(cmd) {
    this.stack.length = this.index + 1;
    this.stack.push(cmd);
    this.index++;
    this.strokeId++;
  }

  undo() {
    if (this.index < 0) return;
    this.stack[this.index].undo();
    this.index--;
    this.strokeId--;
  }

  redo() {
    if (this.index >= this.stack.length - 1) return;
    this.index++;
    this.stack[this.index].execute();
    this.strokeId++;
  }
}
