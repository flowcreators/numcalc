"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MatrixBackground from './components/MatrixBackground';
import NumerologyCalendar from './components/NumerologyCalendar';
import LifePath from './components/LifePath';
import MerkabahIcon3D from './components/MerkabahIcon3D';
import { readSavedEntries, upsertSavedEntry, type SavedEntryRecord } from './savedEntries';

type TabKey = "calculator" | "calendar" | "lifepath" | "design" | "profiles";
type AccentMode = "green" | "white" | "custom";

const TAB_COOKIE_NAME = "numcalc-active-tab";
const THEME_COOKIE_NAME = "numcalc-theme";
const DEFAULT_CUSTOM_ACCENT = "#ff7a00";

const hexToRgbString = (hex: string) => {
  const normalized = hex.replace("#", "");
  const safeHex = normalized.length === 3
    ? normalized.split("").map((character) => `${character}${character}`).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
    return null;
  }

  const red = parseInt(safeHex.slice(0, 2), 16);
  const green = parseInt(safeHex.slice(2, 4), 16);
  const blue = parseInt(safeHex.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
};

const getResolvedAccentHex = (mode: AccentMode, customAccentColor: string) => {
  switch (mode) {
    case "white":
      return "#f4f4f4";
    case "custom":
      return customAccentColor;
    case "green":
    default:
      return "#00ff00";
  }
};

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const normalizedLightness = lightness / 100;
  const chroma = (saturation * Math.min(normalizedLightness, 1 - normalizedLightness)) / 100;

  const toHexChannel = (index: number) => {
    const shift = (index + hue / 30) % 12;
    const channel = normalizedLightness - chroma * Math.max(Math.min(shift - 3, 9 - shift, 1), -1);
    return Math.round(255 * channel).toString(16).padStart(2, "0");
  };

  return `#${toHexChannel(0)}${toHexChannel(8)}${toHexChannel(4)}`;
};

const hashToTab = (hash: string): TabKey | null => {
  const normalizedHash = hash.replace(/^#/, "").toLowerCase();

  switch (normalizedHash) {
    case "calculator":
    case "gematria":
      return "calculator";
    case "calendar":
      return "calendar";
    case "lifepath":
    case "dharma":
    case "full":
    case "profile":
    case "fullprofile":
    case "full-profile":
      return "lifepath";
    case "design":
    case "human-design":
    case "humandesign":
      return "design";
    case "saves":
    case "saved":
    case "profiles":
      return "profiles";
    default:
      return null;
  }
};

const tabToHash = (tab: TabKey) => {
  switch (tab) {
    case "calculator":
      return "#calculator";
    case "calendar":
      return "#calendar";
    case "lifepath":
      return "#dharma";
    case "design":
      return "#design";
    case "profiles":
      return "#saves";
  }
};

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const formatDateForLifePath = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
};

const normalizeSavedName = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [accentMode, setAccentMode] = useState<AccentMode>("green");
  const [customAccentColor, setCustomAccentColor] = useState(DEFAULT_CUSTOM_ACCENT);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [lastCalculatedInput, setLastCalculatedInput] = useState("");
  const [calculations, setCalculations] = useState<string[]>([]);
  const [merkabahSpinKey, setMerkabahSpinKey] = useState(0);
  const [merkabahJoltKey, setMerkabahJoltKey] = useState(0);
  const [calculatePerWord, setCalculatePerWord] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [useRecursiveReduction, setUseRecursiveReduction] = useState(true);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [showAboutNumerology, setShowAboutNumerology] = useState(false);
  const [showNumberEnergies, setShowNumberEnergies] = useState(false);
  const [showAngelNumbers, setShowAngelNumbers] = useState(false);
  const [lifePathPrefillName, setLifePathPrefillName] = useState("");
  const [lifePathPrefillBirthdate, setLifePathPrefillBirthdate] = useState("");
  const [calendarResetSignal, setCalendarResetSignal] = useState(0);
  const [lifePathResetSignal, setLifePathResetSignal] = useState(0);
  const [savedEntries, setSavedEntries] = useState<SavedEntryRecord[]>([]);
  const [calculatorSaveMessage, setCalculatorSaveMessage] = useState<string | null>(null);
  const [isRefreshExiting, setIsRefreshExiting] = useState(false);
  const previousHasComputedResultRef = useRef(false);
  const refreshExitTimeoutRef = useRef<number | null>(null);
  const calculatorInputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const reduceToSingleDigit = (num: number): number => {
    if (num === 11 || num === 22 || num === 33) return num;
    if (num < 10) return num;
    const reduced = String(num).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    if (reduced === 11 || reduced === 22 || reduced === 33) return reduced;
    return reduced > 9 ? reduceToSingleDigit(reduced) : reduced;
  };

  const calculatePythagoreanNumber = (text: string) => {
    setIsSettingsCollapsed(true);
    const letterValues: { [key: string]: number } = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter, index) => {
      letterValues[letter] = (index % 9) + 1;
    });

    const newCalculations: string[] = [];
    let finalResult: number;

    if (calculatePerWord) {
      const words = text.split(/[\s./]+/).filter(word => word.length > 0);
      const wordResults = words.map(word => {
        const wordSum = word
          .toUpperCase()
          .split('')
          .filter(char => /[A-Z0-9]/.test(char))
          .reduce((acc, char) => {
            const value = /[0-9]/.test(char) ? parseInt(char) : (letterValues[char] || 0);
            if (showDetails) {
              newCalculations.push(`${char} = ${value}`);
            }
            return acc + value;
          }, 0);
        
        if (showDetails) {
          newCalculations.push(`${word} = ${wordSum}`);
          if (useRecursiveReduction && wordSum > 9) {
            newCalculations.push(`Reduced: ${wordSum} → ${reduceToSingleDigit(wordSum)}`);
          }
        }
        return useRecursiveReduction ? reduceToSingleDigit(wordSum) : wordSum;
      });

      finalResult = useRecursiveReduction 
        ? reduceToSingleDigit(wordResults.reduce((acc, num) => acc + num, 0))
        : wordResults.reduce((acc, num) => acc + num, 0);
    } else {
      const sum = text
        .toUpperCase()
        .split('')
        .filter(char => /[A-Z0-9]/.test(char))
        .reduce((acc, char) => {
          const value = /[0-9]/.test(char) ? parseInt(char) : (letterValues[char] || 0);
          if (showDetails) {
            newCalculations.push(`${char} = ${value}`);
          }
          return acc + value;
        }, 0);

      finalResult = useRecursiveReduction ? reduceToSingleDigit(sum) : sum;
      
      if (showDetails && useRecursiveReduction && sum > 9) {
        newCalculations.push(`Total: ${sum}`);
        newCalculations.push(`Reduced: ${sum} → ${finalResult}`);
      }
    }

    setCalculations(newCalculations);
    setResult(finalResult);
    setLastCalculatedInput(text);
  };

  const refreshSavedEntries = () => {
    setSavedEntries(readSavedEntries());
  };

  useEffect(() => {
    refreshSavedEntries();
  }, []);

  useEffect(() => {
    const savedTab =
      hashToTab(window.location.hash) ??
      hashToTab(getCookieValue(TAB_COOKIE_NAME) ?? "") ??
      hashToTab(window.localStorage.getItem(TAB_COOKIE_NAME) ?? "") ??
      "calendar";

    setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawThemePreference = getCookieValue(THEME_COOKIE_NAME) ?? window.localStorage.getItem(THEME_COOKIE_NAME);

    if (!rawThemePreference) {
      return;
    }

    try {
      const parsedPreference = JSON.parse(rawThemePreference) as {
        mode?: AccentMode;
        customColor?: string;
      };

      if (parsedPreference.mode === "green" || parsedPreference.mode === "white" || parsedPreference.mode === "custom") {
        setAccentMode(parsedPreference.mode);
      }

      if (typeof parsedPreference.customColor === "string" && hexToRgbString(parsedPreference.customColor)) {
        setCustomAccentColor(parsedPreference.customColor);
      }
    } catch {
      // Ignore malformed saved theme preferences.
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = hashToTab(window.location.hash);
      if (hashTab && hashTab !== activeTab) {
        setActiveTab(hashTab);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activeTab]);

  useEffect(() => {
    const nextHash = tabToHash(activeTab);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }

    window.localStorage.setItem(TAB_COOKIE_NAME, nextHash);
    document.cookie = `${TAB_COOKIE_NAME}=${encodeURIComponent(nextHash)}; path=/; max-age=31536000; samesite=lax`;
  }, [activeTab]);

  const resolvedAccentHex = getResolvedAccentHex(accentMode, customAccentColor);
  const resolvedAccentRgb = hexToRgbString(resolvedAccentHex) ?? "0, 255, 0";
  const isMatrixEnabled = accentMode !== "white";
  const resolvedBackgroundHex = accentMode === "white" ? "#000000" : "#0b0b0b";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.documentElement.dataset.themeMode = accentMode === "white" ? "minimal" : accentMode;
    document.documentElement.style.setProperty("--background", resolvedBackgroundHex);
    document.documentElement.style.setProperty("--theme-accent", resolvedAccentHex);
    document.documentElement.style.setProperty("--theme-accent-rgb", resolvedAccentRgb);

    const serializedThemePreference = JSON.stringify({
      mode: accentMode,
      customColor: customAccentColor,
    });

    window.localStorage.setItem(THEME_COOKIE_NAME, serializedThemePreference);
    document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(serializedThemePreference)}; path=/; max-age=31536000; samesite=lax`;
  }, [accentMode, customAccentColor, resolvedAccentHex, resolvedAccentRgb, resolvedBackgroundHex]);

  const sendTodayToLifePath = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setLifePathPrefillName("");
    setLifePathPrefillBirthdate(formatDateForLifePath(today));
    setActiveTab("lifepath");
  };

  const handleSaveCalculatorEntry = () => {
    const trimmedName = lastCalculatedInput.trim();
    const normalizedName = normalizeSavedName(trimmedName);

    if (!trimmedName || !normalizedName) {
      return;
    }

    setSavedEntries(upsertSavedEntry("calculator", trimmedName, normalizedName));
    setCalculatorSaveMessage("Saved to Profiles.");
  };

  const handleLoadSavedEntry = (entry: SavedEntryRecord) => {
    if (entry.kind === "calculator") {
      setInput(entry.displayName);
      calculatePythagoreanNumber(entry.displayName);
      setCalculatorSaveMessage(null);
      setActiveTab("calculator");
      return;
    }

    setLifePathPrefillName(entry.displayName);
    setLifePathPrefillBirthdate(entry.birthdate);
    setLifePathResetSignal((currentValue) => currentValue + 1);
    setActiveTab("lifepath");
  };

  const handleAccentSpectrumSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > radius) {
      return;
    }

    const hue = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const normalizedHue = (hue + 360) % 360;
    const distanceRatio = Math.min(distance / radius, 1);
    const saturation = Math.max(42, distanceRatio * 100);
    const lightness = 64 - distanceRatio * 12;

    setCustomAccentColor(hslToHex(normalizedHue, saturation, lightness));
    setAccentMode("custom");
  };

  const resetCalculatorInput = (shouldFocus = false) => {
    setInput("");
    setResult(null);
    setLastCalculatedInput("");
    setCalculations([]);
    setCalculatorSaveMessage(null);

    if (shouldFocus) {
      requestAnimationFrame(() => {
        calculatorInputRef.current?.focus();
      });
    }
  };

  const resetCurrentPage = () => {
    switch (activeTab) {
      case "calculator":
        resetCalculatorInput();
        setCalculatePerWord(true);
        setShowDetails(true);
        setUseRecursiveReduction(true);
        setIsSettingsCollapsed(true);
        break;
      case "calendar":
        setCalendarResetSignal((currentValue) => currentValue + 1);
        break;
      case "lifepath":
        setLifePathPrefillName("");
        setLifePathPrefillBirthdate("");
        setLifePathResetSignal((currentValue) => currentValue + 1);
        break;
      case "design":
      case "profiles":
        break;
    }
  };

  const hasComputedResult = result !== null && input.trim().length > 0 && input === lastCalculatedInput;

  useEffect(() => {
    const previousHasComputedResult = previousHasComputedResultRef.current;

    if (previousHasComputedResult && !hasComputedResult) {
      setIsRefreshExiting(true);

      if (refreshExitTimeoutRef.current !== null) {
        window.clearTimeout(refreshExitTimeoutRef.current);
      }

      refreshExitTimeoutRef.current = window.setTimeout(() => {
        setIsRefreshExiting(false);
        refreshExitTimeoutRef.current = null;
      }, 220);
    } else if (hasComputedResult) {
      setIsRefreshExiting(false);

      if (refreshExitTimeoutRef.current !== null) {
        window.clearTimeout(refreshExitTimeoutRef.current);
        refreshExitTimeoutRef.current = null;
      }
    }

    previousHasComputedResultRef.current = hasComputedResult;
  }, [hasComputedResult]);

  useEffect(() => {
    return () => {
      if (refreshExitTimeoutRef.current !== null) {
        window.clearTimeout(refreshExitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isThemeMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isThemeMenuOpen]);

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100">
      <MatrixBackground enabled={isMatrixEnabled} accentRgb={resolvedAccentRgb} backgroundHex={resolvedBackgroundHex} />
      <main className="relative max-w-4xl mx-auto px-4 pt-6 pb-8 z-10">
        <div className="mb-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-white leading-none">
              <a
                href="https://x.com/dantoruno"
                target="_blank"
                rel="noreferrer"
                className="flex h-5 items-center justify-center text-white transition-colors hover:text-[#8D7F62]"
                title="X"
                aria-label="X"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2H21.5l-7.11 8.127L22.75 22h-6.547l-5.128-7.106L4.86 22H1.602l7.605-8.692L1.25 2h6.713l4.635 6.45L18.244 2Zm-1.142 18.034h1.804L6.978 3.86H5.04l12.062 16.174Z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/dantoruno"
                target="_blank"
                rel="noreferrer"
                className="flex h-5 items-center justify-center text-white transition-colors hover:text-[#8D7F62]"
                title="Instagram"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.9} aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://dantoruno.substack.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-5 items-center justify-center text-white transition-colors hover:text-[#8D7F62]"
                title="Substack"
                aria-label="Substack"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3h18v2H3V3Zm0 4h18v2H3V7Zm0 4h18v10.5l-9-4.2-9 4.2V11Zm2 2v5.35l7-3.267 7 3.267V13H5Z" />
                </svg>
              </a>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-black dark:text-white md:text-3xl mystical-title">
              <span className="text-[11px] font-black tracking-[0.04em] text-[#8D7F62] leading-[0.72] rotate-180 [writing-mode:vertical-rl] [text-orientation:mixed]">
                1.2
              </span>
              <span>NUMCALC</span>
              <span className="leading-none text-[1em]">㊥</span>
              <Image
                src="/profile-badge.png"
                alt="Dan Toruno profile badge"
                width={22}
                height={22}
                className="inline-block h-[22px] w-[22px] rounded-sm object-cover align-middle"
                priority
              />
            </h1>
          </div>
          <div className="max-w-2xl mx-auto flex justify-end">
            <a
              href="https://dantoruno.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 transition-colors hover:text-[#8D7F62] dark:text-gray-400"
            >
              Divination Resource by Dan Toruno
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-2xl mx-auto mb-6 flex justify-end gap-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`ui-square-button inter-caps rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border ${
              activeTab === "calendar"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
            title="Calendar"
            aria-label="Calendar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M3 11h18" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`ui-square-button inter-caps rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border ${
              activeTab === "calculator"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
            title="Calculator"
            aria-label="Calculator"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M8 7h8" />
              <path d="M8 11h2" />
              <path d="M14 11h2" />
              <path d="M8 15h2" />
              <path d="M14 15h2" />
              <path d="M8 19h8" />
            </svg>
          </button>
          <button
            onClick={() => setActiveTab("lifepath")}
            className={`ui-square-button inter-caps rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border ${
              activeTab === "lifepath"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
            title="Dharma"
            aria-label="Dharma"
          >
            <span className="text-base font-semibold leading-none">#</span>
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`ui-square-button inter-caps rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border ${
              activeTab === "design"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
            title="External Calculators"
            aria-label="External Calculators"
          >
            <span className="text-base leading-none">᯽</span>
          </button>
          <button
            onClick={() => {
              refreshSavedEntries();
              setActiveTab("profiles");
            }}
            className={`ui-square-button rounded-lg border transition-all ${
              activeTab === "profiles"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 text-gray-600 dark:bg-[#0B0B0B] dark:text-gray-400"
            }`}
            title="Profiles"
            aria-label="Profiles"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h11l3 3v13H5Z" />
              <path d="M9 4v5h6V4" />
              <path d="M9 17h6" />
            </svg>
          </button>
          <div ref={themeMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen((currentValue) => !currentValue)}
              className={`ui-square-button rounded-lg border transition-all ${isThemeMenuOpen ? "accent-glow-button bg-[#0B0B0B] text-white" : "border-transparent bg-gray-200 text-gray-600 dark:bg-[#0B0B0B] dark:text-gray-400"}`}
              title="Theme settings"
              aria-label="Theme settings"
              aria-expanded={isThemeMenuOpen}
              aria-haspopup="menu"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 3C9.2 6.9 6 10.3 6 13.6A6 6 0 0 0 18 13.6C18 10.3 14.8 6.9 12 3Z" />
              </svg>
            </button>
            {isThemeMenuOpen && (
              <div
                className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#0B0B0B]/95 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur"
                role="menu"
                aria-label="Theme settings"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccentMode("green");
                    setIsThemeMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${accentMode === "green" ? "accent-glow-button bg-[#141414] text-white" : "text-gray-300 hover:bg-white/5"}`}
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/60">
                    <span className="font-mono text-[15px] font-bold leading-none text-[#00ff00]">10</span>
                  </span>
                  <span className="block font-medium">Matrix Green</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccentMode("white");
                    setIsThemeMenuOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${accentMode === "white" ? "accent-glow-button bg-[#141414] text-white" : "text-gray-300 hover:bg-white/5"}`}
                  role="menuitem"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/60">
                    <span className="h-4 w-4 rounded-full bg-white" aria-hidden="true" />
                  </span>
                  <span className="block font-medium">Minimal</span>
                </button>
                <div className={`mt-1 rounded-lg px-3 py-3 ${accentMode === "custom" ? "accent-glow-button bg-[#141414] text-white" : "text-gray-300"}`}>
                  <div className="mb-3 flex items-center gap-3 text-left text-sm">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/60">
                      <span className="absolute h-4 w-4 rounded-full" style={{ background: "conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #0a84ff, #5856d6, #ff2d55, #ff3b30)" }} />
                      <svg className="relative h-3 w-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path d="M12 3C9.2 6.9 6 10.3 6 13.6A6 6 0 0 0 18 13.6C18 10.3 14.8 6.9 12 3Z" />
                      </svg>
                    </span>
                    <span className="block font-medium">Custom Accent</span>
                  </div>
                  <div className="flex justify-center">
                    <div
                      onClick={handleAccentSpectrumSelect}
                      className="relative flex h-24 w-24 cursor-crosshair items-center justify-center rounded-full bg-[#050505]"
                      role="button"
                      tabIndex={0}
                      aria-label="Choose a custom accent from the rainbow spectrum"
                    >
                      <span
                        className="relative h-20 w-20 overflow-hidden rounded-full border border-white/8 shadow-[inset_0_0_14px_rgba(255,255,255,0.06)]"
                        style={{
                          background: "radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 42%), conic-gradient(#ff3b30, #ff9500, #ffcc00, #34c759, #0a84ff, #5856d6, #ff2d55, #ff3b30)",
                        }}
                      >
                        <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#0B0B0B]/80" />
                        <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30" style={{ backgroundColor: customAccentColor }} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className={activeTab === "calculator" ? "block" : "hidden"} aria-hidden={activeTab !== "calculator"}>
        <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="name" className="block text-sm font-medium">
                  What are we calculating today?
                </label>
                <button
                  onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                  className="text-[#8D7F62] hover:text-[#a89872] transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${isSettingsCollapsed ? 'rotate-90' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-[6px] flex gap-2">
                <button
                  onClick={() => {
                    if (hasComputedResult) {
                      handleSaveCalculatorEntry();
                      return;
                    }

                    const items = ["flowcreators.org", "Balanced Beings", "flowcreators", "gumroad.com/flowcreators"];
                    const currentIndex = items.indexOf(input);
                    const nextIndex = (currentIndex + 1) % items.length;
                    const nextItem = items[nextIndex];
                    setInput(nextItem);
                    setCalculatorSaveMessage(null);
                    calculatePythagoreanNumber(nextItem);
                    setMerkabahSpinKey((currentValue) => currentValue + 1);
                  }}
                  id="merkabah-btn"
                  className="ui-square-button rounded-md border border-[#8D7F62] bg-[#0B0B0B] text-white btn-hover-subtle group"
                  title={hasComputedResult ? "Save To Profiles" : "Cycle Brand Names"}
                >
                  {hasComputedResult ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 4h11l3 3v13H5Z" />
                      <path d="M9 4v5h6V4" />
                      <path d="M9 17h6" />
                    </svg>
                  ) : (
                    <MerkabahIcon3D spinKey={merkabahSpinKey} joltKey={merkabahJoltKey} className="h-6 w-6" />
                  )}
                </button>
                <input
                  ref={calculatorInputRef}
                  type="text"
                  id="name"
                  value={input}
                  onChange={(e) => {
                    const nextValue = e.target.value;

                    if (nextValue.length > input.length) {
                      setMerkabahJoltKey((currentValue) => currentValue + 1);
                    }

                    setInput(nextValue);
                    if (calculatorSaveMessage) {
                      setCalculatorSaveMessage(null);
                    }
                    if (!nextValue.trim()) {
                      resetCalculatorInput();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
                      e.preventDefault();
                      resetCalculatorInput(true);
                      return;
                    }

                    if (e.key === 'Enter') {
                      calculatePythagoreanNumber(input);
                    }
                  }}
                  className="accent-focus-input w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] outline-none transition-all font-medium placeholder:font-medium"
                  placeholder="Names, Brands, or Domains"
                />
                <button
                  onClick={() => {
                    if (hasComputedResult) {
                      resetCalculatorInput(true);
                    } else {
                      calculatePythagoreanNumber(input);
                    }
                  }}
                  className="ui-square-button btn-accent relative rounded-md font-medium transition-colors overflow-hidden"
                  title={hasComputedResult ? "Reset" : "Calculate"}
                >
                  <span className="relative inline-flex items-center justify-center h-5 w-5">
                    <svg
                      className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${hasComputedResult ? 'scale-75 rotate-[-70deg] opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden={hasComputedResult}
                    >
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="7" y1="6" x2="17" y2="6" />
                      <line x1="8" y1="11" x2="8.01" y2="11" />
                      <line x1="12" y1="11" x2="12.01" y2="11" />
                      <line x1="16" y1="11" x2="16.01" y2="11" />
                      <line x1="8" y1="15" x2="8.01" y2="15" />
                      <line x1="12" y1="15" x2="12.01" y2="15" />
                      <line x1="16" y1="15" x2="16.01" y2="15" />
                      <line x1="8" y1="19" x2="8.01" y2="19" />
                      <line x1="12" y1="19" x2="12.01" y2="19" />
                      <line x1="16" y1="19" x2="16.01" y2="19" />
                    </svg>
                    <svg
                      className={`absolute inset-0 h-5 w-5 ${hasComputedResult ? 'refresh-icon-enter opacity-100' : isRefreshExiting ? 'refresh-icon-exit' : 'opacity-0 scale-75'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden={!hasComputedResult}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l1 14h10l1-14" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 10v6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10v6" />
                    </svg>
                  </span>
                </button>
              </div>
              {calculatorSaveMessage && (
                <p className="mt-3 text-xs text-[#8D7F62]">{calculatorSaveMessage}</p>
              )}
            </div>

            <div className={`space-y-4 overflow-hidden transition-all duration-300 ${isSettingsCollapsed ? 'max-h-0 opacity-0 -mb-2' : 'max-h-[500px] opacity-100 mb-4'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculation</span>
                <div className="flex items-center space-x-2">
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${!calculatePerWord ? 'btn-accent' : 'bg-gray-200 dark:bg-[#0B0B0B]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={!calculatePerWord}
                      onChange={() => setCalculatePerWord(false)}
                    />
                    For All Letters
                  </label>
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${calculatePerWord ? 'btn-accent' : 'bg-gray-200 dark:bg-[#0B0B0B]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={calculatePerWord}
                      onChange={() => setCalculatePerWord(true)}
                    />
                    For Each Word
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Display</span>
                <div className="flex items-center space-x-2">
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${!showDetails ? 'btn-accent' : 'bg-gray-200 dark:bg-[#0B0B0B]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={!showDetails}
                      onChange={() => setShowDetails(false)}
                    />
                    Result Only
                  </label>
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${showDetails ? 'btn-accent' : 'bg-gray-200 dark:bg-[#0B0B0B]'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={showDetails}
                      onChange={() => setShowDetails(true)}
                    />
                    Calculation Details
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recursive"
                  checked={useRecursiveReduction}
                  onChange={(e) => setUseRecursiveReduction(e.target.checked)}
                  className="w-4 h-4 accent-[#8D7F62] rounded border-gray-300"
                />
                <label htmlFor="recursive" className="text-sm font-medium">
                  Use recursive reduction to get only one digit
                </label>
              </div>
            </div>
            {hasComputedResult && (
              <div className="mt-6">
                <div className={`grid gap-3 md:gap-6 ${showDetails && calculations.length > 0 ? 'grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:grid-cols-2 items-start' : 'grid-cols-1'}`}>
                  <div className={`text-center ${showDetails && calculations.length > 0 ? 'order-2 md:order-2' : 'order-1'}`}>
                    <h2 className="text-xl font-semibold mb-2">Your Number</h2>
                    <div className="text-5xl font-extrabold text-white mystical-title py-2">
                      {result}
                    </div>

                    <div className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <h3 className="font-medium mb-2">Number Meaning</h3>
                      <p className="italic">
                        {result === 1 && "Unity and beginnings - representing leadership and independence"}
                        {result === 2 && "Harmony and balance - symbolizing cooperation and diplomacy"}
                        {result === 3 && "Creativity and expression - bringing joy and artistic abilities"}
                        {result === 4 && "Stability and foundation - signifying hard work and reliability"}
                        {result === 5 && "Freedom and adventure - representing change and versatility"}
                        {result === 6 && "Love and harmony - symbolizing responsibility and care"}
                        {result === 7 && "Wisdom and spirituality - representing analysis and understanding"}
                        {result === 8 && "Power and abundance - symbolizing material success"}
                        {result === 9 && "Completion and humanitarianism - representing compassion"}
                        {result === 11 && "Master number - Intuition and spiritual insight"}
                        {result === 22 && "Master number - Master builder and manifestation"}
                        {result === 33 && "Master number - Master teacher and spiritual guidance"}
                      </p>
                    </div>
                  </div>

                  {showDetails && calculations.length > 0 && (
                    <div className="p-3 md:p-4 bg-gray-50 dark:bg-[#0B0B0B] rounded-lg text-left order-1 md:order-1 min-w-0">
                      <h3 className="font-medium mb-2 text-sm">Calculation Details</h3>
                      {calculations.map((calc, index) => {
                        const isLabel = calc.startsWith('Reduced:') || calc.startsWith('Total:') || calc.includes('→');
                        const isLetterLine = /^[A-Z] = \d+$/.test(calc);
                        const isWordTotal = !isLabel && !isLetterLine && calc.includes(' = ');
                        return isLabel ? (
                          <div key={index} className="text-[12px] sm:text-sm text-gray-600 dark:text-gray-300 break-words">{calc}</div>
                        ) : isWordTotal ? (
                          <div key={index} className="text-[12px] sm:text-sm font-semibold text-white mystical-title break-words" style={{fontFamily: 'var(--font-space-grotesk)'}}>{calc}</div>
                        ) : (
                          <div key={index} className="text-[12px] sm:text-sm text-gray-400 break-words" style={{fontFamily: 'var(--font-space-grotesk)'}}>{calc}</div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 max-w-2xl mx-auto space-y-3">

          {/* About Numerology */}
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowAboutNumerology(!showAboutNumerology)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="font-semibold text-black dark:text-white text-sm">About Numerology</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showAboutNumerology ? 'rotate-0' : 'rotate-90'}`}
                fill="none"
                stroke="#8D7F62"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAboutNumerology && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 bg-[#0d0d0d] text-sm text-gray-400 leading-relaxed pt-4">
                <p>
                  <span className="font-semibold text-white mystical-title">Pythagorean numerology</span> assigns
                  numerical values to letters (A=1 · B=2 · … · I=9 · J=1 · …), a system attributed to the ancient Greek
                  philosopher Pythagoras. Each name or word reduces to a single core number — or a master number
                  (11, 22, 33) — believed to carry its own energetic signature and spiritual vibration.
                  It is a lens for self-reflection: understanding the frequencies encoded in names, dates, and words
                  that move through your life.
                </p>
              </div>
            )}
          </div>

          {/* What The Numbers Mean */}
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowNumberEnergies(!showNumberEnergies)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="font-semibold text-black dark:text-white text-sm">What The Numbers Mean</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showNumberEnergies ? 'rotate-0' : 'rotate-90'}`}
                fill="none"
                stroke="#8D7F62"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNumberEnergies && (
              <div className="px-4 pb-5 border-t border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {([
                    { n: 1,  label: "LEADERSHIP · INDEPENDENCE",      assoc: ["Masculine energy", "Originality", "Action", "Assertiveness", "Willpower", "Focus"] },
                    { n: 2,  label: "HARMONY · DIPLOMACY",             assoc: ["Sensitivity", "Intuition", "Receptivity", "Patience", "Partnership", "Empathy"] },
                    { n: 3,  label: "CREATIVITY · EXPRESSION",         assoc: ["Self-expression", "Optimism", "Communication", "Enthusiasm", "Social energy", "Imagination"] },
                    { n: 4,  label: "STABILITY · FOUNDATION",          assoc: ["Discipline", "Order", "Loyalty", "Practicality", "Persistence", "Structure"] },
                    { n: 5,  label: "FREEDOM · ADVENTURE",             assoc: ["Adaptability", "Curiosity", "Sensory experience", "Travel", "Wit", "Spontaneity"] },
                    { n: 6,  label: "LOVE · RESPONSIBILITY",           assoc: ["Nurturing", "Family", "Community", "Beauty", "Sacrifice", "Healing"] },
                    { n: 7,  label: "WISDOM · SPIRITUALITY",           assoc: ["Introspection", "Mystery", "Inner knowing", "Faith", "Research", "Solitude"] },
                    { n: 8,  label: "POWER · ABUNDANCE",               assoc: ["Authority", "Ambition", "Karma", "Business acumen", "Executive energy", "Endurance"] },
                    { n: 9,  label: "COMPASSION · HUMANITARIAN",       assoc: ["Wisdom", "Philanthropy", "Endings", "Universal love", "Idealism", "Transformation"] },
                    { n: 11, label: "INTUITION · SPIRITUAL INSIGHT",   assoc: ["Visionary", "Sensitivity", "Nervous energy", "Psychic awareness", "Inspiration", "Duality"] },
                    { n: 22, label: "MASTER BUILDER · MANIFESTATION",  assoc: ["Global thinking", "Building legacy", "Discipline + vision", "Mastery", "Practicality at scale", "Architecture"] },
                    { n: 33, label: "MASTER TEACHER · DIVINE GUIDANCE", assoc: ["Unconditional love", "Healing", "Artistic mastery", "Compassion in action", "Upliftment", "Cosmic responsibility"] },
                  ] as { n: number; label: string; assoc: string[] }[]).map(({ n, label, assoc }) => (
                    <div
                      key={n}
                      className="bg-[#0B0B0B] rounded-lg px-2 py-4 text-center"
                    >
                      <div className="text-5xl font-extrabold text-white mystical-title py-2">
                        {n}
                      </div>
                      <div className="text-gray-600 text-[10px] my-1 select-none tracking-widest">···</div>
                      <div className="inter-caps text-[9px] text-gray-300 tracking-widest leading-[1.6] uppercase">
                        {label}
                      </div>
                      <p className="inter-caps text-[10px] text-gray-500 tracking-wide leading-loose mt-2">
                        {assoc.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Synchronicities & Angel Numbers */}
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowAngelNumbers(!showAngelNumbers)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="font-semibold text-black dark:text-white text-sm">Synchronicities &amp; Angel Numbers</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showAngelNumbers ? 'rotate-0' : 'rotate-90'}`}
                fill="none"
                stroke="#8D7F62"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAngelNumbers && (
              <div className="px-4 pb-5 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-4 mb-4 italic">
                  Synchronicities appear more frequently when you are living in alignment with your true path.
                  Repeating numbers are not coincidences — they are universal confirmations and guided signals
                  directing your attention to what matters most in that moment.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { n: 111, label: "SELF-TRUST",                assoc: ["New beginnings", "Conscious thought", "Manifestation seeds", "Self-belief", "Aligned thinking", "Creative power"] },
                    { n: 222, label: "BALANCE · COLLABORATION",   assoc: ["Partnership", "Trust", "Divine timing", "Balance in relationships", "Co-creation", "Patience"] },
                    { n: 333, label: "DIVINE FLOW",               assoc: ["Trinity energy", "Ascended masters", "Expansion", "Creativity", "Communication", "Holy flow"] },
                    { n: 444, label: "MANIFESTATION · GROUNDING", assoc: ["Angelic protection", "Stability", "Hard work rewarded", "Groundedness", "Divine support", "Perseverance"] },
                    { n: 555, label: "CHANGE · FREEDOM",          assoc: ["Major change", "Liberation", "Adventure", "Releasing old", "New chapter", "Transformation"] },
                    { n: 666, label: "SURRENDER · SELF-CARE",     assoc: ["Mind-body-spirit", "Compassion", "Releasing fear", "Self-care reminder", "Earthly love", "Trust"] },
                    { n: 777, label: "EVOLUTION · ALIGNMENT",     assoc: ["Spiritual awakening", "Lucky alignment", "Inner wisdom", "Mystical path", "Divine favor", "Flow state"] },
                    { n: 888, label: "FLOW · ABUNDANCE",          assoc: ["Financial abundance", "Karmic return", "Business success", "Infinite energy", "Manifestation", "Prosperity"] },
                    { n: 999, label: "KARMIC CYCLE · MOVING ON",  assoc: ["Completion", "Release", "Humanitarian calling", "Karmic closure", "Higher purpose", "Soul graduation"] },
                  ] as { n: number; label: string; assoc: string[] }[]).map(({ n, label, assoc }) => (
                    <div
                      key={n}
                      className="bg-[#0B0B0B] rounded-lg px-2 py-4 text-center"
                    >
                      <div className="text-5xl font-extrabold text-white mystical-title py-2">
                        {n}
                      </div>
                      <div className="text-gray-600 text-[10px] my-1 select-none tracking-widest">···</div>
                      <div className="inter-caps text-[9px] text-gray-300 tracking-widest leading-[1.6] uppercase">
                        {label}
                      </div>
                      <p className="inter-caps text-[10px] text-gray-500 tracking-wide leading-loose mt-2">
                        {assoc.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </section>

        <section className={activeTab === "calendar" ? "block" : "hidden"} aria-hidden={activeTab !== "calendar"}>
          <NumerologyCalendar key={calendarResetSignal} onSendTodayToLifePath={sendTodayToLifePath} />
        </section>

        <section className={activeTab === "lifepath" ? "block" : "hidden"} aria-hidden={activeTab !== "lifepath"}>
          <LifePath
            prefilledName={lifePathPrefillName}
            prefilledBirthdate={lifePathPrefillBirthdate}
            resetSignal={lifePathResetSignal}
            onSavedEntriesChange={refreshSavedEntries}
          />
        </section>

        <section className={activeTab === "profiles" ? "block" : "hidden"} aria-hidden={activeTab !== "profiles"}>
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <div className="space-y-4 text-center">
              <p className="text-xs tracking-[0.35em] uppercase text-gray-500 dark:text-gray-400">Saved Profiles</p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mystical-title">Quick Loads</h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Saved names and Dharma profiles from this browser are stored in cookies and local storage so you can reopen them fast.
              </p>
            </div>

            <div className="mt-6">
              {savedEntries.length === 0 ? (
                <div className="rounded-lg border border-[#8D7F62]/30 bg-gray-50 dark:bg-[#0B0B0B] p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nothing saved yet. Save a calculated name from Calculator or a completed Dharma profile to see it here.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {savedEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleLoadSavedEntry(entry)}
                      className="rounded-lg border border-[#8D7F62]/30 bg-gray-50 dark:bg-[#0B0B0B] p-4 text-left transition-colors hover:bg-white/80 dark:hover:bg-[#121212]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                            {entry.kind === "dharma" ? "Dharma Profile" : "Calculator Save"}
                          </p>
                          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white break-words">
                            {entry.displayName}
                          </p>
                          {entry.birthdate && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{entry.birthdate}</p>
                          )}
                        </div>
                        <svg className="mt-1 h-4 w-4 text-[#8D7F62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m7 6 6 6-6 6" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={activeTab === "design" ? "block" : "hidden"} aria-hidden={activeTab !== "design"}>
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <div className="space-y-4 text-center">
              <p className="text-xs tracking-[0.35em] uppercase text-gray-500 dark:text-gray-400">External Calculators</p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mystical-title">Design Tools</h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                This page is reserved for embedded external systems and supporting chart tools, including Human Design, Vedic calculators, and other specialized modalities you want to keep alongside NUMCALC.
              </p>
              <div className="rounded-lg border border-[#8D7F62]/30 bg-gray-50 dark:bg-[#0B0B0B] p-6">
                <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2 text-left">
                  <div className="rounded-lg border border-[#8D7F62]/20 bg-white/60 dark:bg-[#121212] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">Planned Sources</p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Human Design, Vedic numerology, astrology utilities, and other external calculators you want to embed or link from one place.</p>
                  </div>
                  <div className="rounded-lg border border-[#8D7F62]/20 bg-white/60 dark:bg-[#121212] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">Planned Output</p>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Embedded tools, comparison views, and quick-launch panels for calculators that extend beyond the core NUMCALC pages.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
