"use client";

import { useState, useRef, useEffect } from "react";

/* Matrix cipher characters used during the decoding animation */
const MATRIX_CHARS =
  "!@#$%&*<>?|{}[]ΔΩΨΞΓabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface Props {
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** All standard Tailwind classes for the underlying <input>. */
  className?: string;
  maxLength?: number;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  /** Center-align both cipher overlay and placeholder (for date inputs). */
  center?: boolean;
  /** Text-size class for the cipher overlay (default "text-sm"). */
  textSizeClass?: string;
}

export default function CipherInput({
  id,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = "",
  maxLength,
  inputMode,
  center = false,
  textSizeClass = "text-sm",
}: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;

    // Clear any in-flight animation timers
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Deletion or same length — settle immediately
    if (value.length <= prev.length) {
      setDisplay(value);
      return;
    }

    const prefix = value.slice(0, prev.length);
    const added = value.slice(prev.length);
    const FRAMES = 8;
    const DELAY = 36; // ms per frame

    for (let f = 1; f <= FRAMES; f++) {
      const t = setTimeout(() => {
        const scrambled = added
          .split("")
          .map(() => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)])
          .join("");
        setDisplay(prefix + scrambled);
      }, f * DELAY);
      timers.current.push(t);
    }

    // Final frame: settle on real value
    const t = setTimeout(() => setDisplay(value), FRAMES * DELAY + 40);
    timers.current.push(t);

    return () => timers.current.forEach(clearTimeout);
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder=""
        maxLength={maxLength}
        inputMode={inputMode}
        className={className}
        style={{ color: "transparent", caretColor: "rgb(74 222 128)" }}
        autoComplete="off"
        spellCheck={false}
      />
      {/* Cipher overlay — visually replaces the hidden input text */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 flex items-center ${center ? "justify-center" : ""} px-4 pointer-events-none select-none overflow-hidden`}
      >
        {value === "" ? (
          <span className={`text-gray-400 dark:text-gray-500 ${textSizeClass}`}>
            {placeholder}
          </span>
        ) : (
          <span className={`text-green-400 font-mono tracking-wide ${textSizeClass}`}>
            {display}
          </span>
        )}
      </div>
    </div>
  );
}
