"use client";

import { useState } from "react";
import MatrixBackground from './components/MatrixBackground';
import NumerologyCalendar from './components/NumerologyCalendar';
import LifePath from './components/LifePath';

export default function Home() {
  const [activeTab, setActiveTab] = useState<"calculator" | "calendar" | "lifepath">("calendar");
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
      const words = text.split(/[\s.]+/).filter(word => word.length > 0);
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

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100">
      <MatrixBackground />
      <main className="relative max-w-4xl mx-auto px-4 py-8 z-10">
        <div className="mb-8">
          <div className="max-w-2xl mx-auto flex justify-end">
            <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white mystical-title">
              NUMCALC ㊥
            </h1>
          </div>
          <div className="max-w-2xl mx-auto flex justify-end">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A Numerology Resource by Dan Toruno
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-2xl mx-auto mb-6 flex justify-end gap-2">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-colors border flex items-center gap-2 ${
              activeTab === "calculator"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            Calculator
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2"/>
              <path d="M8 7h8M8 11h8M8 15h4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-colors border flex items-center gap-2 ${
              activeTab === "calendar"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            Calendar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setActiveTab("lifepath")}
            className={`inter-caps px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-colors border flex items-center gap-2 ${
              activeTab === "lifepath"
                ? "border-[#8D7F62] bg-[#0B0B0B] text-white"
                : "border-transparent bg-gray-200 dark:bg-[#0B0B0B] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            Life Path
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="9" width="18" height="12" rx="1" strokeWidth="2"/>
              <rect x="5" y="6" width="14" height="3" strokeWidth="2"/>
              <path d="M12 6V21M3 13h18" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 6c0-2 1.5-3 2.5-2S16 6 12 6z" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M12 6c0-2-1.5-3-2.5-2S8 6 12 6z" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {activeTab === "calculator" ? (
        <>
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
              <input
                type="text"
                id="name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && calculatePythagoreanNumber(input)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] outline-none focus:border-green-400/40 focus:shadow-[0_0_8px_rgba(0,255,0,0.20)] transition-all font-light placeholder:font-normal"
                placeholder="Type a name, word, or multiple names to compare"
              />
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

            <button
              onClick={() => calculatePythagoreanNumber(input)}
              className="w-full btn-accent font-medium py-2 px-4 rounded-md transition-colors"
            >
              Calculate
            </button>

            {result !== null && (
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {showDetails && calculations.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-[#0B0B0B] rounded-lg text-left order-1 md:order-none">
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
                  
                  <div className="text-center">
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
                className={`w-4 h-4 transition-transform duration-200 ${showAboutNumerology ? 'rotate-0' : '-rotate-90'}`}
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
                className={`w-4 h-4 transition-transform duration-200 ${showNumberEnergies ? 'rotate-0' : '-rotate-90'}`}
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
                className={`w-4 h-4 transition-transform duration-200 ${showAngelNumbers ? 'rotate-0' : '-rotate-90'}`}
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
        </>
        ) : activeTab === "calendar" ? (
          <NumerologyCalendar />
        ) : (
          <LifePath />
        )}
      </main>
    </div>
  );
}