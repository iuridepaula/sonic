import { useEffect, useMemo, useState } from "react";
import style from "./sonic.module.scss";

const AudioJump = require("./assets/jump.mp3");
const AudioSkid = require("./assets/skid.mp3");
const AudioSpin = require("./assets/spin.mp3");

const SONIC = {
  width: 156,
  height: 160,
};

type Actions = "idle" | "bored" | "walk" | "loopUp" | "crouch" | "spinDash";

export default function Sonic() {
  const [action, setAction] = useState<Actions>("idle");
  const [distance, setDistance] = useState(0);
  const [direction, setDirection] = useState<1 | 0>(1);
  const [speed, setSpeed] = useState<number>(0);
  const [spin, setSpin] = useState<number>(0);
  const [isSkiding, setSkid] = useState(false);
  const [isSpinning, launchSpin] = useState(false);
  const [controller, setController] = useState<Record<string, boolean>>({});
  const [isJumping, setIsJumping] = useState(false);
  const [jump, setJump] = useState(0);

  const audioJump = new Audio(AudioJump);
  function playJumpAudio() {
    if (jump) return;
    audioJump.currentTime = 0;
    audioJump.play();
  }

  const audioSpin = new Audio(AudioSpin);
  function playSpinAudio() {
    audioSpin.volume = 0.5;
    audioSpin.currentTime = 0;
    audioSpin.play();
  }

  const audioSkid = new Audio(AudioSkid);
  function playSkidAudio() {
    if (isSkiding) return;
    audioSkid.volume = 0.5;
    audioSkid.currentTime = 0;
    audioSkid.play();
  }

  const hasHitEndLimit = useMemo(() => {
    return direction && distance >= window.innerWidth - SONIC.width;
  }, [direction, distance]);
  const hasHitStartLimit = useMemo(() => {
    return !direction && distance <= 0;
  }, [direction, distance]);

  function onKey(e: KeyboardEvent) {
    const isPressed = e.type === "keydown";

    if (controller[e.code] !== isPressed) {
      setController((curMap) => ({ ...curMap, [e.code]: isPressed }));
    }
  }

  // GRAVITY
  useEffect(() => {
    let moveLoop: number | undefined;
    let gravityForce = 16;

    function animation() {
      if (jump) {
        gravityForce = gravityForce * 1.75;
        const newJump = Math.max(0, jump - gravityForce);
        setJump((jump) => Math.max(0, jump - gravityForce));

        if (!newJump) {
          setIsJumping(false);
        }
      }
      moveLoop = requestAnimationFrame(animation);
    }
    moveLoop = requestAnimationFrame(animation);

    return () => {
      if (moveLoop) cancelAnimationFrame(moveLoop);
    };
  }, [jump]);

  // JUMP
  useEffect(() => {
    let moveLoop: number | undefined;
    let jumpForce = 92;

    function animation() {
      if (isJumping) {
        // jump
        jumpForce = jumpForce * 0.92;
        setJump((jump) =>
          Math.min(SONIC.height * 3, jump + Math.max(1, jumpForce))
        );
      }

      moveLoop = requestAnimationFrame(animation);
    }
    moveLoop = requestAnimationFrame(animation);

    return () => {
      if (moveLoop) cancelAnimationFrame(moveLoop);
    };
  }, [isJumping]);

  // MOVEMENT
  useEffect(() => {
    let moveLoop: number | undefined;

    function animation() {
      if (action === "walk") {
        // move
        setSkid(false);
        audioSkid.currentTime = 0;
        audioSkid.pause();

        setSpeed((cur) => Math.min(40, cur + 0.5));
        setDistance((prev) => {
          if (hasHitEndLimit) {
            return window.innerWidth - SONIC.width;
          }
          if (hasHitStartLimit) {
            return 0;
          }

          return direction
            ? prev + Math.max(2, speed / 2)
            : prev - Math.max(2, speed / 2);
        });
      } else {
        // brake
        if (speed > 32 && !jump) playSkidAudio();
        setSkid(!!speed);
        setSpeed((cur) => (cur > 0 ? Math.max(0, cur - 1) : 0));
        // skid
        setDistance((prev) => {
          if (!isSkiding) {
            return prev;
          }
          if (hasHitEndLimit) {
            return window.innerWidth - SONIC.width;
          }
          if (hasHitStartLimit) {
            return 0;
          }

          return direction ? prev + 6 : prev - 6;
        });
      }

      moveLoop = requestAnimationFrame(animation);
    }
    moveLoop = requestAnimationFrame(animation);

    return () => {
      if (moveLoop) cancelAnimationFrame(moveLoop);
    };
  }, [direction, action, speed, isSkiding, hasHitEndLimit, hasHitStartLimit]);

  // SPIN RESISTANCE & LAUNCH
  useEffect(() => {
    let moveLoop: number | undefined;

    function animation() {
      if (spin && !["crouch", "spinDash"].includes(action)) {
        setSpin((cur) => Math.max(0, cur - 0.5));

        if (action !== "spinDash") {
          launchSpin(true);
          setDistance((prev) => {
            return direction
              ? Math.min(window.innerWidth - SONIC.width, prev + 10 * spin)
              : Math.max(0, prev - 10 * spin);
          });
        }
      } else {
        launchSpin(!!spin);
      }

      moveLoop = requestAnimationFrame(animation);
    }
    moveLoop = requestAnimationFrame(animation);

    return () => {
      if (moveLoop) cancelAnimationFrame(moveLoop);
    };
  }, [action, direction, spin]);

  // CONTROLLER
  useEffect(() => {
    const isPressingButtons =
      controller.KeyA || controller.KeyS || controller.KeyD;

    if (isPressingButtons && controller.ArrowLeft) {
      setDirection(0);
      playJumpAudio();
      setIsJumping(true);
      return;
    }
    if (isPressingButtons && controller.ArrowRight) {
      setDirection(1);
      playJumpAudio();
      setIsJumping(true);
      return;
    }
    if (isPressingButtons && controller.ArrowUp) {
      playJumpAudio();
      setIsJumping(true);
      return;
    }
    if (isPressingButtons && controller.ArrowDown) {
      playSpinAudio();
      setSpin((cur) => Math.min(32, cur + 2));
      setAction("spinDash");
      return;
    }
    if (controller.ArrowRight) {
      setDirection(1);
      setAction("walk");
      return;
    }
    if (controller.ArrowLeft) {
      setDirection(0);
      setAction("walk");
      return;
    }
    if (controller.ArrowUp) {
      return setAction("loopUp");
    }
    if (controller.ArrowDown) {
      setAction("crouch");
      return;
    }
    if (isPressingButtons) {
      playJumpAudio();
      setIsJumping(true);
      return;
    }

    // idle + bored
    setAction("idle");
    let boredTimer = setTimeout(() => {
      setAction("bored");
    }, 20 * 1000);

    return () => clearTimeout(boredTimer);
  }, [controller]);

  // LISTENERS
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  });

  const spinSpeedClass = useMemo(
    () =>
      `spin-${
        spin > 24 ? "max" : spin > 32 ? "faster" : spin > 24 ? "fast" : ""
      }`,
    [spin]
  );

  return (
    <div>
      <div
        className={`${style.sonicBox} ${isJumping ? style.dropDash : null} ${
          direction ? style.right : style.left
        }`}
        style={{ transform: `translate3D(${distance}px,-${jump}px,0)` }}
      >
        <div
          className={`${style.sonic} ${
            isSkiding
              ? style.skid
              : spin || isSpinning
              ? style.spinDash
              : style[action]
          } ${direction ? style.right : style.left} ${style[spinSpeedClass]}`}
        />
      </div>
    </div>
  );
}

// idle
// bored
// walking
// running
//
