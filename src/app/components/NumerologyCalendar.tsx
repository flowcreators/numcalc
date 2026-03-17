"use client";

import { useState, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Reduce a number to a single digit, preserving master numbers 11 / 22 / 33. */
const reduceToSingleDigit = (num: number): number => {
  if (num === 11 || num === 22 || num === 33) return num;
  if (num < 10) return num;
  const sum = String(num)
    .split("")
    .reduce((a, d) => a + parseInt(d), 0);
  if (sum === 11 || sum === 22 || sum === 33) return sum;
  return sum > 9 ? reduceToSingleDigit(sum) : sum;
};

/** Sum of individual digits of a number. */
const digitSum = (num: number): number =>
  String(num)
    .split("")
    .reduce((a, d) => a + parseInt(d), 0);

/* ---------- Date Energy ------------------------------------------ */

interface DateEnergy {
  fullSumEnergy: number;   // Flat digit total, reduced (Full Sum mode)
  standardEnergy: number; // monthReduced + dayReduced + yearReduced (Simplified Standard)
  hiddenEnergy: number | null; // Master number found via variations
  hiddenCalculation: string | null; // The calculation string that led to the hidden energy
  secondaryEnergy: number;
  monthReduced: number;
  dayReduced: number;
  yearReduced: number;
  yearDigitSum: number;
  dayDigitSum: number;
  flatSum: number;
  flatDigits: number[];
  isFullSumMaster: boolean;
  isStandardMaster: boolean;
  isHiddenMaster: boolean;
}

const MASTERS = new Set([11, 22, 33]);

/**
 * Three parallel energy calculations:
 *
 * Full Sum  — sum all individual digits of MM/DD/YYYY, preserve masters.
 * Standard  — monthReduced + dayReduced + yearReduced (Fully simplified), preserve masters.
 * Hidden    — variations that avoid early reduction to find master numbers.
 *
 * Secondary energy = the day's own master-preserved value.
 */
const calculateDateEnergy = (date: Date): DateEnergy => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // 1. Full Sum: Every digit summed flat
  const flatDigits = [
    ...String(month).padStart(2, '0').split('').map(Number),
    ...String(day).padStart(2, '0').split('').map(Number),
    ...String(year).split('').map(Number),
  ];
  const flatSum = flatDigits.reduce((a, d) => a + d, 0);
  const fullSumEnergy = reduceToSingleDigit(flatSum);

  // 2. Standard (Simplified): Reduce components first
  const monthReduced = reduceToSingleDigit(month);
  const dayReduced = MASTERS.has(day) ? day : reduceToSingleDigit(digitSum(day));
  const yearDigitSum = digitSum(year);
  const yearReduced = reduceToSingleDigit(yearDigitSum);

  const standardRaw = monthReduced + dayReduced + yearReduced;
  const standardEnergy = reduceToSingleDigit(standardRaw);

  // 3. Hidden Master Search:
  // Check variations (e.g., raw day or raw year digit sum) to see if a master number appears
  const variations = [
    { calc: `${monthReduced} + ${day} + ${yearDigitSum}`, val: monthReduced + day + yearDigitSum },
    { calc: `${month} + ${day} + ${year}`, val: month + day + year },
    { calc: `${monthReduced} + ${day} + ${yearReduced}`, val: monthReduced + day + yearReduced },
    { calc: `${month} + ${dayReduced} + ${yearReduced}`, val: month + dayReduced + yearReduced },
  ];

  let hiddenEnergy: number | null = null;
  let hiddenCalculation: string | null = null;
  for (const v of variations) {
    const reduced = reduceToSingleDigit(v.val);
    if (MASTERS.has(reduced)) {
      hiddenEnergy = reduced;
      hiddenCalculation = `${v.calc} = ${v.val}`;
      break;
    }
  }

  return {
    fullSumEnergy,
    standardEnergy,
    hiddenEnergy,
    hiddenCalculation,
    secondaryEnergy: dayReduced,
    monthReduced,
    dayReduced,
    yearReduced,
    yearDigitSum,
    dayDigitSum: digitSum(day),
    flatSum,
    flatDigits,
    isFullSumMaster: MASTERS.has(fullSumEnergy),
    isStandardMaster: MASTERS.has(standardEnergy),
    isHiddenMaster: hiddenEnergy !== null,
  };
};

/* ---------- Full Moon (approximate) ------------------------------ */

const isFullMoon = (date: Date): boolean => {
  // Reference full moon: 6 Jan 2000 ~18:14 UTC
  const refMs = Date.UTC(2000, 0, 6, 18, 14);
  const dateMs = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
  );
  const daysDiff = (dateMs - refMs) / 86_400_000;
  const cycles = daysDiff / 29.53059;
  const phase = cycles - Math.floor(cycles);
  return phase < 0.017 || phase > 0.983; // within ≈ 0.5 day
};

/* ---------- Number meaning (same table used by the calculator) ---- */

const numberMeaning: Record<number, string> = {
  1: "Unity and beginnings — leadership & independence",
  2: "Harmony and balance — cooperation & diplomacy",
  3: "Creativity and expression — joy & artistic abilities",
  4: "Stability and foundation — hard work & reliability",
  5: "Freedom and adventure — change & versatility",
  6: "Love and harmony — responsibility & care",
  7: "Wisdom and spirituality — analysis & understanding",
  8: "Power and abundance — material success",
  9: "Completion and humanitarianism — compassion",
  11: "Master Number 11 — intuition & spiritual insight",
  22: "Master Number 22 — master builder & manifestation",
  33: "Master Number 33 — master teacher & spiritual guidance",
};

const masterTooltip: Record<number, string> = {
  11: "Master Number 11 is the Illuminator. This is a high-vibration day for spiritual insight, intuition, and receiving downloads. Align with: meditation, creative breakthroughs, listening to your inner voice, psychic/intuitive work, and inspired vision.",
  22: "Master Number 22 is the Master Builder. This is a rare day for turning big dreams into tangible reality. Align with: long-term planning, laying foundations, launching projects, strategic decisions, and disciplined focused action.",
  33: "Master Number 33 is the Master Teacher. A day of elevated compassion, healing, and divine guidance. Align with: teaching, uplifting others, service, artistic mastery, unconditional love, and spiritual leadership.",
};

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export default function NumerologyCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [tooltipMaster, setTooltipMaster] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  /* ----- derived -------------------------------------------------- */

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    // Monday-first: Sun(0)→6, Mon(1)→0, Tue(2)→1 … Sat(6)→5
    const pad = (first.getDay() + 6) % 7;
    const total = last.getDate();

    type DayItem = {
      date: Date;
      day: number;
      energy: DateEnergy;
      fullMoon: boolean;
      isAdjacentMonth: boolean;
    };

    const days: DayItem[] = [];

    // Prev-month bleed-in
    if (pad > 0) {
      const prevMonthLast = new Date(viewYear, viewMonth, 0);
      const pLastDay = prevMonthLast.getDate();
      const pMon = prevMonthLast.getMonth();
      const pYear = prevMonthLast.getFullYear();
      for (let i = pad - 1; i >= 0; i--) {
        const d = pLastDay - i;
        const date = new Date(pYear, pMon, d);
        days.push({ date, day: d, energy: calculateDateEnergy(date), fullMoon: isFullMoon(date), isAdjacentMonth: true });
      }
    }

    // Current month
    for (let d = 1; d <= total; d++) {
      const date = new Date(viewYear, viewMonth, d);
      days.push({ date, day: d, energy: calculateDateEnergy(date), fullMoon: isFullMoon(date), isAdjacentMonth: false });
    }

    // Next-month bleed-in to complete the last grid row
    const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      days.push({ date, day: d, energy: calculateDateEnergy(date), fullMoon: isFullMoon(date), isAdjacentMonth: true });
    }

    return days;
  }, [viewMonth, viewYear]);

  const selectedEnergy = useMemo(
    () => calculateDateEnergy(selectedDate),
    [selectedDate],
  );

  /* ----- helpers -------------------------------------------------- */

  const same = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setViewMonth(t.getMonth());
    setViewYear(t.getFullYear());
    setSelectedDate(t);
  };

  /* ----- breakdown lines ----------------------------------------- */

  const breakdownLines = useMemo(() => {
    const { flatDigits, flatSum, fullSumEnergy, isFullSumMaster, standardEnergy, isStandardMaster, monthReduced, dayReduced, yearReduced, isHiddenMaster, hiddenCalculation, hiddenEnergy } = selectedEnergy;
    const masterLabelFull = isFullSumMaster ? ' (Master Number)' : '';
    const masterLabelStd = isStandardMaster ? ' (Master Number)' : '';
    const masterLabelHidden = isHiddenMaster ? ' (Master Number)' : '';

    return {
      fullSum: [
        `Date Digits: ${flatDigits.join(' + ')}`,
        `Sum: ${flatSum}`,
        flatSum !== fullSumEnergy
          ? `Reduced: ${flatSum} → ${fullSumEnergy}${masterLabelFull}`
          : `Energy: ${fullSumEnergy}${masterLabelFull}`,
      ],
      standard: [
        `Month: ${monthReduced} + Day: ${dayReduced} + Year: ${yearReduced}`,
        `Sum: ${monthReduced + dayReduced + yearReduced}`,
        (monthReduced + dayReduced + yearReduced) !== standardEnergy
          ? `Reduced: ${monthReduced + dayReduced + yearReduced} → ${standardEnergy}${masterLabelStd}`
          : `Energy: ${standardEnergy}${masterLabelStd}`,
      ],
      hidden: isHiddenMaster ? [
        `Calculation: ${hiddenCalculation}`,
        `Energy: ${hiddenEnergy}${masterLabelHidden}`
      ] : []
    };
  }, [selectedEnergy]);

  const formatDate = (d: Date) =>
    `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  const handleMasterBadgeEnter = (e: React.MouseEvent, masterNum: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipMaster(masterNum);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ---------- Calendar Header --------------------------------- */}
      <div className="bg-white dark:bg-[#171717] rounded-lg p-4 shadow-lg">
        {/* weekday headers & navigation */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center mb-2 px-2">
          {/* Left Arrow */}
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-bold mr-2"
          >
            ‹
          </button>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 w-full">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-bold ml-2"
          >
            ›
          </button>
        </div>

        {/* day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((info, idx) => {
            const { date, day, energy, fullMoon, isAdjacentMonth } = info;
            const isT = same(date, today);
            const isSel = same(date, selectedDate);

            return (
              <button
                key={`day-${idx}`}
                onClick={() => setSelectedDate(new Date(date))}
                className={`
                  relative aspect-[2/1] rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${
                    isAdjacentMonth
                      ? "bg-transparent text-gray-400/30 dark:text-gray-600/40 border border-gray-200/50 dark:border-gray-800/50"
                      : isT
                        ? "ring-2 ring-green-600 ring-offset-2 ring-offset-[#171717] bg-[#0B0B0B] text-green-300"
                        : isSel
                          ? "ring-2 ring-[#8D7F62] bg-[#1a160e] text-[#8D7F62] font-bold"
                          : "bg-gray-100 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200"
                  }
                `}
              >
                <span>{day}</span>

                {/* Master-number badge */}
                {(energy.isFullSumMaster || energy.isStandardMaster) && (
                  <span
                    className="absolute top-0.5 right-0.5 text-[11px] font-black text-[#0056E1] leading-none bg-black/70 rounded-bl-md px-1.5 py-0.5 cursor-help z-10"
                    onMouseEnter={(e) => handleMasterBadgeEnter(e, energy.isStandardMaster ? energy.standardEnergy : energy.fullSumEnergy)}
                    onMouseLeave={() => setTooltipMaster(null)}
                  >
                    {energy.isStandardMaster ? energy.standardEnergy : energy.fullSumEnergy}
                  </span>
                )}

                {/* Hidden Master Star */}
                {energy.isHiddenMaster && (
                  <span
                    className="absolute top-1 left-1 text-[10px] font-bold text-yellow-300 leading-none bg-black/70 rounded-br-md px-1 py-0.5 cursor-help z-10"
                    onMouseEnter={(e) => handleMasterBadgeEnter(e, energy.hiddenEnergy || 0)}
                    onMouseLeave={() => setTooltipMaster(null)}
                  >
                    ✦
                  </span>
                )}

                {/* Full-moon indicator (Swapped to bottom right) */}
                {fullMoon && (
                  <span className="absolute bottom-1.5 right-1.5 text-[10px] leading-none pointer-events-none z-10">
                    🌕
                  </span>
                )}

                {/* Wealth day (28th) (Swapped to bottom left) */}
                {day === 28 && (
                  <span
                    className="absolute bottom-1.5 left-1.5 text-[10px] leading-none cursor-help z-10"
                    onMouseEnter={(e) => handleMasterBadgeEnter(e, -28)}
                    onMouseLeave={() => setTooltipMaster(null)}
                  >
                    💵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Selected-date detail panel ---------------------- */}
      <div className="bg-white dark:bg-[#171717] rounded-lg p-5 shadow-lg relative min-h-[140px]">
        {/* Header Section: Month (Left), Date (Middle), Back to Present (Right) */}
        <div className="flex items-center justify-between mb-6 h-10">
          {/* Left: Month and Year */}
          <div className="flex-1">
            <p className="inter-caps text-[24px] font-black text-black dark:text-white tracking-tight leading-none">
              {MONTH_NAMES[viewMonth].substring(0, 3).toUpperCase()} <span className="text-gray-400 dark:text-gray-500">{viewYear}</span>
            </p>
          </div>

          {/* Middle: Full Formatted Date */}
          <div className="flex-1 text-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none">
              {formatDate(selectedDate)}
            </h3>
          </div>

          {/* Right: Back to Present Button */}
          <div className="flex-1 flex justify-end">
            {(!same(selectedDate, today) || viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) ? (
              <button
                onClick={goToToday}
                className="px-6 py-2 rounded-xl bg-white hover:bg-gray-100 text-black text-xs font-bold transition-all flex items-center focus:outline-none leading-none shadow-sm border border-gray-300"
              >
                BACK TO THE PRESENT
              </button>
            ) : (
              <div className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-[#0B0B0B] text-gray-400 dark:text-gray-600 text-[10px] font-black inter-caps tracking-widest border border-gray-200 dark:border-gray-800 leading-none">
                THIS IS TODAY&apos;S DATE
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* --- Left: Calculation Breakdowns --- */}
          <div className="bg-gray-50 dark:bg-[#0B0B0B] rounded-lg p-4 space-y-4">
            {/* Full Sum */}
            <div>
              <h4 className="font-semibold text-black dark:text-white text-sm mb-0.5 inter-caps tracking-wide">Full Sum</h4>
              <p className="text-[10px] text-gray-500 mb-2">All digits summed flat</p>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {breakdownLines.fullSum.map((line, i) => (
                  <p key={i} className={i === breakdownLines.fullSum.length - 1 ? "font-medium border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-1" : ""}>{line}</p>
                ))}
              </div>
            </div>
            {/* Standard */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="font-semibold text-black dark:text-white text-sm mb-0.5 inter-caps tracking-wide">Standard</h4>
              <p className="text-[10px] text-gray-500 mb-2">Month + Day + Year sum</p>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {breakdownLines.standard.map((line, i) => (
                  <p key={i} className={i === breakdownLines.standard.length - 1 ? "font-medium border-t border-gray-200 dark:border-gray-600 pt-1.5 mt-1" : ""}>{line}</p>
                ))}
              </div>
            </div>
            {/* Hidden Master Calculation */}
            {breakdownLines.hidden.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="font-semibold text-black dark:text-white text-sm mb-0.5 inter-caps tracking-wide">Hidden Calculation</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {breakdownLines.hidden.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- Right: Energy Results --- */}
          <div className="bg-gray-50 dark:bg-[#0B0B0B] rounded-lg p-4 space-y-4">
            {/* Primary Energy */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Primary Energy</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-3xl text-black dark:text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                  {selectedEnergy.standardEnergy}
                </p>
                {selectedEnergy.isHiddenMaster && (
                  <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                    [{selectedEnergy.hiddenEnergy}]
                  </p>
                )}
                {selectedEnergy.isHiddenMaster && (
                  <span
                    className="text-yellow-400 text-xl font-bold cursor-help drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                    onMouseEnter={(e) => handleMasterBadgeEnter(e, selectedEnergy.hiddenEnergy || 0)}
                    onMouseLeave={() => setTooltipMaster(null)}
                  >
                    ✦
                  </span>
                )}
              </div>
              {numberMeaning[selectedEnergy.standardEnergy] && (
                <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{numberMeaning[selectedEnergy.standardEnergy]}</p>
              )}
            </div>
            {/* Hidden/Secondary Energy */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Secondary Energy</p>
              <p className="font-bold text-xl text-black dark:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {selectedEnergy.secondaryEnergy}
              </p>
              {numberMeaning[selectedEnergy.secondaryEnergy] && (
                <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{numberMeaning[selectedEnergy.secondaryEnergy]}</p>
              )}
            </div>
            {/* Hidden Highlight */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium">Hidden Energy</p>
              {selectedEnergy.isHiddenMaster ? (
                <p className="font-bold text-xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {selectedEnergy.hiddenEnergy}
                </p>
              ) : (
                <p className="text-sm text-gray-500">None Found</p>
              )}
              {selectedEnergy.isHiddenMaster && selectedEnergy.hiddenEnergy && numberMeaning[selectedEnergy.hiddenEnergy] && (
                <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{numberMeaning[selectedEnergy.hiddenEnergy]}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Legend ------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-green-600 bg-[#0B0B0B]" />
          Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-[#8D7F62] bg-[#1a160e]" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#0056E1] text-[12px] font-black bg-black/60 rounded px-1.5 leading-none py-0.5 group relative">
            ✦
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Look for Blue Numbers</span>
          </span>
          Master Number
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-yellow-400 text-[22px] font-bold bg-black/60 rounded px-1.5 leading-none py-0.5">✦</span>
          Hidden Energy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px]">🌕</span>
          Full Moon
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px]">💵</span>
          28 Day
        </span>
      </div>

      {/* ---------- Master number / 28-day tooltip (portal-style) -- */}
      {tooltipMaster !== null && (tooltipMaster === -28 || masterTooltip[tooltipMaster]) && (
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-xs bg-[#0d0d0d] border border-yellow-400/40 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
          style={{
            left: Math.min(tooltipPos.x, typeof window !== 'undefined' ? window.innerWidth - 320 : tooltipPos.x),
            top: tooltipPos.y - 140,
            transform: 'translateX(-50%)',
          }}
        >
          {tooltipMaster === -28 ? (
            <>
              <p className="font-bold text-yellow-300 mb-1">💵 The 28 Day — Wealth Energy</p>
              <p className="text-gray-300 leading-relaxed">The 28th is widely regarded as a powerful day for wealth-creation activities. Align with: launching offers, sending invoices, pitching clients, making investments, opening new income streams, and setting financial intentions.</p>
            </>
          ) : (
            <>
              <p className="font-bold text-yellow-300 mb-1">Master Number Day — {tooltipMaster}</p>
              <p className="text-gray-300 leading-relaxed">{masterTooltip[tooltipMaster]}</p>
              <div className="mt-2 text-yellow-400 font-bold text-sm text-center">#</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
