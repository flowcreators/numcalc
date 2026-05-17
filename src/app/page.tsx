"use client";

import { useEffect, useState } from "react";
import MatrixBackground from './components/MatrixBackground';
import NumerologyCalendar from './components/NumerologyCalendar';
import LifePath from './components/LifePath';

type TabKey = "calculator" | "calendar" | "lifepath";

const TAB_COOKIE_NAME = "numcalc-active-tab";

const hashToTab = (hash: string): TabKey | null => {
  const normalizedHash = hash.replace(/^#/, "").toLowerCase();

  switch (normalizedHash) {
    case "calculator":
    case "gematria":
      return "calculator";
    case "calendar":
      return "calendar";
    case "lifepath":
    case "full":
    case "profile":
    case "fullprofile":
    case "full-profile":
      return "lifepath";
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
      return "#profile";
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [calculations, setCalculations] = useState<string[]>([]);
  const [calculatePerWord, setCalculatePerWord] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [useRecursiveReduction, setUseRecursiveReduction] = useState(true);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [showAboutNumerology, setShowAboutNumerology] = useState(false);
  const [showNumberEnergies, setShowNumberEnergies] = useState(false);
  const [showAngelNumbers, setShowAngelNumbers] = useState(false);
  const [lifePathPrefillBirthdate, setLifePathPrefillBirthdate] = useState("");
  const [calendarResetSignal, setCalendarResetSignal] = useState(0);
  const [lifePathResetSignal, setLifePathResetSignal] = useState(0);

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
  };

  useEffect(() => {
    const savedTab =
      hashToTab(window.location.hash) ??
      hashToTab(getCookieValue(TAB_COOKIE_NAME) ?? "") ??
      hashToTab(window.localStorage.getItem(TAB_COOKIE_NAME) ?? "") ??
      "calendar";

    setActiveTab(savedTab);
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

  const sendTodayToLifePath = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setLifePathPrefillBirthdate(formatDateForLifePath(today));
    setActiveTab("lifepath");
  };

  const resetCurrentPage = () => {
    switch (activeTab) {
      case "calculator":
        setInput("");
        setResult(null);
        setCalculations([]);
        setCalculatePerWord(true);
        setShowDetails(true);
        setUseRecursiveReduction(true);
        setIsSettingsCollapsed(true);
        break;
      case "calendar":
        setCalendarResetSignal((currentValue) => currentValue + 1);
        break;
      case "lifepath":
        setLifePathPrefillBirthdate("");
        setLifePathResetSignal((currentValue) => currentValue + 1);
        break;
    }
  };

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100">
      <MatrixBackground />
      <main className="relative max-w-4xl mx-auto px-4 pt-6 pb-8 z-10">
        <div className="mb-4">
          <div className="max-w-2xl mx-auto flex justify-end">
            <h1 className="flex items-baseline gap-2 text-2xl font-bold text-black dark:text-white md:text-3xl mystical-title">
              <span>NUMCAL</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8D7F62] md:text-sm leading-none">
                V1.1
              </span>
              <span>㊥</span>
            </h1>
          </div>
          <div className="max-w-2xl mx-auto flex justify-end">
            <a
              href="https://dantoruno.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 transition-colors hover:text-[#8D7F62] dark:text-gray-400"
            >
              Numerology Resource by Dan Toruno
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-2xl mx-auto mb-6 flex justify-end gap-2">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border flex items-center gap-2 ${
              activeTab === "calculator"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
          >
            Gematria
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border flex items-center gap-2 ${
              activeTab === "calendar"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("lifepath")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider btn-hover-subtle border flex items-center gap-2 ${
              activeTab === "lifepath"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400"
            }`}
          >
            Life Path
          </button>
          <button
            onClick={resetCurrentPage}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-[#0B0B0B] px-4 py-2 text-white btn-hover-subtle"
            title={`Reset ${activeTab === "calculator" ? "Gematria" : activeTab === "calendar" ? "Calendar" : "Life Path"}`}
            aria-label={`Reset ${activeTab === "calculator" ? "Gematria" : activeTab === "calendar" ? "Calendar" : "Life Path"}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Great for naming brands &amp; decision making based on energetic alignment</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const items = ["flowcreators.org", "Balanced Beings", "flowcreators", "gumroad.com/flowcreators"];
                    const currentIndex = items.indexOf(input);
                    const nextIndex = (currentIndex + 1) % items.length;
                    const nextItem = items[nextIndex];
                    setInput(nextItem);
                    calculatePythagoreanNumber(nextItem);
                    
                    // Trigger merkabah animation
                    const btn = document.getElementById('merkabah-btn');
                    if (btn) {
                      btn.classList.remove('merkabah-animate');
                      void btn.offsetWidth; // trigger reflow
                      btn.classList.add('merkabah-animate');
                    }
                  }}
                  id="merkabah-btn"
                  className="rounded-md border border-[#8D7F62] p-2 bg-[#0B0B0B] text-white btn-hover-subtle group"
                  title="Cycle Brand Names"
                >
                  <svg className="h-6 w-6 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {/* Perfect Merkabah / Star of David geometry */}
                    <path d="M12 3L19.7942 16.5H4.20577L12 3Z" />
                    <path d="M12 21L4.20577 7.5H19.7942L12 21Z" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <input
                  type="text"
                  id="name"
                  value={input}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setInput(nextValue);
                    if (!nextValue.trim()) {
                      setResult(null);
                      setCalculations([]);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && calculatePythagoreanNumber(input)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] outline-none focus:border-green-400/40 focus:shadow-[0_0_8px_rgba(0,255,0,0.20)] transition-all font-light placeholder:font-normal"
                  placeholder="Type a name, word, or multiple names to compare"
                />
                <button
                  onClick={() => calculatePythagoreanNumber(input)}
                  className="btn-accent min-w-10 rounded-md px-3 py-2 font-medium transition-colors flex items-center justify-center"
                  title="Calculate"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="8" y1="18" x2="16" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="6.01" />
                    <line x1="12" y1="6" x2="12" y2="6.01" />
                    <line x1="8" y1="6" x2="8" y2="6.01" />
                    <line x1="16" y1="10" x2="16" y2="10.01" />
                    <line x1="12" y1="10" x2="12" y2="10.01" />
                    <line x1="8" y1="10" x2="8" y2="10.01" />
                    <line x1="16" y1="14" x2="16" y2="14.01" />
                    <line x1="12" y1="14" x2="12" y2="14.01" />
                    <line x1="8" y1="14" x2="8" y2="14.01" />
                  </svg>
                </button>
              </div>
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
            {result !== null && input.trim().length > 0 && (
              <div className="mt-6">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                  <div className="text-center order-1 md:order-2">
                    <h2 className="text-xl font-semibold mb-2">Your Number</h2>
                    <div className="text-5xl font-extrabold text-white mystical-title py-2">
                      {result}
                    </div>

                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
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
                    <div className="p-4 bg-gray-50 dark:bg-[#0B0B0B] rounded-lg text-left order-2 md:order-1">
                      <h3 className="font-medium mb-2 text-sm">Calculation Details</h3>
                      {calculations.map((calc, index) => {
                        const isLabel = calc.startsWith('Reduced:') || calc.startsWith('Total:') || calc.includes('→');
                        const isLetterLine = /^[A-Z] = \d+$/.test(calc);
                        const isWordTotal = !isLabel && !isLetterLine && calc.includes(' = ');
                        return isLabel ? (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-300">{calc}</div>
                        ) : isWordTotal ? (
                          <div key={index} className="text-sm font-semibold text-white mystical-title" style={{fontFamily: 'var(--font-space-grotesk)'}}>{calc}</div>
                        ) : (
                          <div key={index} className="text-sm text-gray-400" style={{fontFamily: 'var(--font-space-grotesk)'}}>{calc}</div>
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
          <LifePath prefilledBirthdate={lifePathPrefillBirthdate} resetSignal={lifePathResetSignal} />
        </section>
      </main>
    </div>
  );
}
