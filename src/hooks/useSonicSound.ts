import React, { useRef } from "react";

type Track = "jump" | "launch" | "spin" | "skid";

const audio: Record<Track, HTMLAudioElement> = {
  jump: new Audio(require("../components/sonic/assets/jump.mp3")),
  launch: new Audio(require("../components/sonic/assets/spin-launch.mp3")),
  spin: new Audio(require("../components/sonic/assets/spin.mp3")),
  skid: new Audio(require("../components/sonic/assets/skid.mp3")),
};

export function useSonicAudio() {
  // load files
  const canPlay: Record<Track, React.MutableRefObject<boolean>> = {
    jump: useRef(true),
    launch: useRef(true),
    spin: useRef(true),
    skid: useRef(true),
  };

  // volume
  audio.skid.volume = 0.75;
  audio.spin.volume = 0.5;
  // can't play mutiple times
  (["launch", "jump"] as Track[]).forEach((track) => {
    audio[track].onplay = () => (canPlay[track].current = false);
    audio[track].onended = () => (canPlay[track].current = true);
  });

  async function pauseAll() {
    try {
      await Promise.all(
        Object.keys(audio).map((track) => stop(track as Track))
      );
    } catch (error) {
      // silence is golden
    }
  }

  async function play(track: Track) {
    if (!canPlay[track].current) return;

    try {
      await stop(track);
      await audio[track].play();
    } catch (error) {
      // silence is golden
    }
  }

  async function stop(track: Track) {
    if (audio[track].paused) return;

    try {
      await audio[track].pause();
      audio[track].currentTime = 0;
    } catch (error) {
      // silence is golden
    }
  }

  return { play, stop, pauseAll };
}
