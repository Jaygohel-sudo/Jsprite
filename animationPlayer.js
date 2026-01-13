import { renderFrames } from "./timeline.js";

export class AnimationPlayer {
  constructor() {
    this.playing = false;
    this.frameIndex = 0;
    this.accumulator = 0;
    this.loop = true;
  }

  play(sprite) {
    this.playing = true;
    this.frameIndex = sprite.activeFrame ?? 0;
    this.accumulator = 0;
  }

  stop(sprite) {
    this.playing = false;
    sprite.activeFrame = this.frameIndex;
  }
  update(dt, sprite) {
    if (!this.playing) return;

    this.accumulator += dt;

    const frame = sprite.frames[this.frameIndex];
    if (!frame) return;

    if (this.accumulator >= frame.duration) {
      this.accumulator -= frame.duration;
      this.frameIndex++;

      if (this.frameIndex >= sprite.frames.length) {
        if (this.loop) {
          this.frameIndex = 0;
        } else {
          this.stop(sprite);
          return;
        }
      }

      sprite.activeFrame = this.frameIndex;
      renderFrames(sprite);
    }
  }
}
