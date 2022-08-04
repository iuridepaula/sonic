import { useCallback, useRef } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRAF } from "../../hooks/useRAF";
import { useSonicAudio } from "../../hooks/useSonicSound";
import style from "./sonic.module.scss";

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
  const audio = useSonicAudio();

  const hasHitEndLimit = useMemo(() => {
    return direction && distance >= window.innerWidth - SONIC.width;
  }, [direction, distance]);
  const hasHitStartLimit = useMemo(() => {
    return !direction && distance <= 0;
  }, [direction, distance]);
  const spinSpeedClass = useMemo(
    () =>
      `spin-${
        spin > 24 ? "max" : spin > 32 ? "faster" : spin > 24 ? "fast" : ""
      }`,
    [spin]
  );

  function onKey(e: KeyboardEvent) {
    const isPressed = e.type === "keydown";

    if (controller[e.code] !== isPressed) {
      setController((curMap) => ({ ...curMap, [e.code]: isPressed }));
    }
  }

  // JUMP ANIMATION
  useRAF(
    ([jumpLimit, i]) => {
      if (isJumping) {
        i.current = i.current + 0.1;

        if (i.current > Math.PI) {
          i.current = 0;
          setJump(0);
          setIsJumping(false);
          return;
        }

        const value = Math.max(0, jumpLimit.current * Math.sin(i.current));
        setJump(value);
      }
    },
    [useRef(SONIC.height * 3), useRef(0)],
    [isJumping]
  );

  // MOVE ANIMATION
  useRAF(
    () => {
      if (action === "walk") {
        // move
        setSkid(false);
        audio.stop("skid");

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
      } else if (action === "idle") {
        // brake
        if (speed > 24 && !jump) audio.play("skid");
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
      } else {
        setSkid(false);
        audio.stop("skid");
      }
    },
    [],
    [direction, action, speed, isSkiding, hasHitEndLimit, hasHitStartLimit]
  );

  // SPIN RESISTANCE & LAUNCH ANIMATION
  useRAF(
    () => {
      if (spin && !["crouch", "spinDash"].includes(action)) {
        setSpin((cur) => Math.max(0, cur - 0.5)); // RESISTANCE

        if (action !== "spinDash") {
          // LAUNCH
          audio.play("launch");
          launchSpin(true);

          setDistance((prev) => {
            return direction
              ? Math.min(window.innerWidth - SONIC.width, prev + 10 * spin)
              : Math.max(0, prev - 10 * spin);
          });
        }
      } else {
        launchSpin(false);
      }
    },
    [],
    [action, direction, spin]
  );

  // COMMANDS
  const doJump = useCallback(() => {
    if (!isJumping) {
      audio.play("jump");
      setIsJumping(true);
    }
  }, [audio, isJumping]);
  const doWalk = useCallback(() => {
    if (action !== "walk") setAction("walk");
  }, [action]);
  const doFace = useCallback(
    (newDirection: 0 | 1) => {
      if (direction !== newDirection) setDirection(newDirection);
    },
    [direction]
  );
  const doMoveLeft = useCallback(() => {
    doFace(0);
    doWalk();
  }, [doFace, doWalk]);
  const doMoveRight = useCallback(() => {
    doFace(1);
    doWalk();
  }, [doFace, doWalk]);
  const doSpin = useCallback(() => {
    audio.play("spin");
    setSpin((cur) => Math.min(9, cur + 2));
    setAction("spinDash");
  }, [audio]);
  const doLookUp = useCallback(() => {
    if (action !== "loopUp") setAction("loopUp");
  }, [action]);
  const doCrouch = useCallback(() => {
    if (action !== "crouch") setAction("crouch");
  }, [action]);
  const doNothing = useCallback(() => {
    if (action === "idle") return;

    // idle...bored
    setAction("idle");
    return setTimeout(() => {
      if (action !== "bored") setAction("bored");
    }, 20 * 1000);
  }, [action]);

  // CONTROLLER
  useEffect(() => {
    const isPressingButtons =
      controller.KeyA || controller.KeyS || controller.KeyD;

    if (isPressingButtons && controller.ArrowLeft) {
      doFace(0);
      doJump();
      return;
    }
    if (isPressingButtons && controller.ArrowRight) {
      doFace(1);
      doJump();
      return;
    }
    if (isPressingButtons && controller.ArrowUp) {
      doJump();
      return;
    }
    if (isPressingButtons && controller.ArrowDown) {
      doSpin();
      return;
    }
    if (controller.ArrowRight) {
      doMoveRight();
      return;
    }
    if (controller.ArrowLeft) {
      doMoveLeft();
      return;
    }
    if (controller.ArrowUp) {
      doLookUp();
      return;
    }
    if (controller.ArrowDown) {
      doCrouch();
      return;
    }
    if (isPressingButtons) {
      doJump();
      return;
    }

    let boredTimer = doNothing();
    return () => clearTimeout(boredTimer);
  }, [controller, isJumping]);

  // KEYBOARD LISTENERS
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  });

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
