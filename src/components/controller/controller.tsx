import { useState } from "react";
import style from "./controller.module.scss";

type Keys =
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "ArrowLeft"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowRight";

export default function Controller() {
  const [pressedKey, setPressedKey] = useState<Keys | undefined>(undefined);

  function releaseArrows() {
    const arrows: Keys[] = [
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    arrows.forEach((code) => {
      const eventOptions: KeyboardEventInit = {
        code,
        bubbles: true,
      };

      const keyUpEvent = new KeyboardEvent("keyup", eventOptions);
      window.dispatchEvent(keyUpEvent);
    });
  }

  let upTimer: NodeJS.Timeout | undefined;
  function dispatchKey(code: Keys, dowm = true, up = true) {
    const eventOptions: KeyboardEventInit = {
      code,
      bubbles: true,
    };

    const keydownEvent = new KeyboardEvent("keydown", eventOptions);
    const keyUpEvent = new KeyboardEvent("keyup", eventOptions);

    if (upTimer) clearTimeout(upTimer);

    if (dowm) {
      releaseArrows();
      window.dispatchEvent(keydownEvent);
      setPressedKey(code);
    }
    if (up)
      upTimer = setTimeout(() => {
        window.dispatchEvent(keyUpEvent);
        setPressedKey(undefined);
      }, 50);
  }

  function press(code: Keys) {
    return {
      onTouchStart: () => dispatchKey(code, true, false),
      onMouseDown: () => dispatchKey(code, true, false),
      onTouchEnd: () => dispatchKey(code, false, true),
      onMouseUp: () => dispatchKey(code, false, true),
    };
  }

  function keyClass(code: Keys) {
    return pressedKey === code ? style.active : "";
  }

  return (
    <div className={style.controller}>
      <div className={style.stickyContainer}>
        <div
          className={`${style.arrowUp} ${keyClass("ArrowUp")}`}
          {...press("ArrowUp")}
        >
          ↑
        </div>
        <div
          className={`${style.arrowLeft} ${keyClass("ArrowLeft")}`}
          {...press("ArrowLeft")}
        >
          ←
        </div>
        <div
          className={`${style.arrowDown} ${keyClass("ArrowDown")}`}
          {...press("ArrowDown")}
        >
          ↓
        </div>
        <div
          className={`${style.arrowRight} ${keyClass("ArrowRight")}`}
          {...press("ArrowRight")}
        >
          →
        </div>
      </div>
      <div className={style.buttonsContainer}>
        <div className={`${style.a} ${keyClass("KeyA")}`} {...press("KeyA")}>
          A
        </div>
        <div className={`${style.b} ${keyClass("KeyS")}`} {...press("KeyS")}>
          B
        </div>
        <div className={`${style.c} ${keyClass("KeyD")}`} {...press("KeyD")}>
          C
        </div>

        <div className={`${style.ak} ${keyClass("KeyA")}`} {...press("KeyA")}>
          A
        </div>
        <div className={`${style.sk} ${keyClass("KeyS")}`} {...press("KeyS")}>
          S
        </div>
        <div className={`${style.dk} ${keyClass("KeyD")}`} {...press("KeyD")}>
          D
        </div>
      </div>
    </div>
  );
}
