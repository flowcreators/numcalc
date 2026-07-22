"use client";

import { useState, useMemo, useRef, useEffect } from "react";

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

const reduceToCoreDigit = (num: number): number => {
  let value = num;
  while (value > 9) {
    value = digitSum(value);
  }
  return value;
};

/* ---------- Date Energy ------------------------------------------ */

interface DateEnergy {
  fullSumEnergy: number;   // Flat digit total, reduced (Full Sum mode)
  fullSumCompound: string;
  cypherReductionLine: string;
  standardEnergy: number; // monthReduced + dayReduced + yearReduced (Simplified Standard)
  standardRaw: number;
  standardCompound: string;
  secondaryEnergy: number;
  dayCompound: string;
  monthCompound: string;
  yearCompound: string;
  ordinalEnergy: number;
  ordinalRaw: number;
  ordinalCalculation: string;
  monthReduced: number;
  dayReduced: number;
  yearReduced: number;
  yearDigitSum: number;
  dayDigitSum: number;
  flatSum: number;
  flatDigits: number[];
  isFullSumMaster: boolean;
  isStandardMaster: boolean;
  isOrdinalMaster: boolean;
}

const MASTERS = new Set([11, 22, 33]);

/**
 * Three parallel energy calculations:
 *
 * Full Sum  — sum all individual digits of MM/DD/YYYY, preserve masters.
 * Primary   — LP-style: monthReduced + dayReduced + yearReduced.
 * Ordinal   — keeps day non-reduced: monthReduced + day + yearReduced.
 *
 * Secondary energy = the day's own master-preserved value (Day).
 */
const calculateDateEnergy = (date: Date): DateEnergy => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const dateDigitsUnpadded = [
    ...String(month).split('').map(Number),
    ...String(day).split('').map(Number),
    ...String(year).split('').map(Number),
  ];

  // 1. Full Sum: Every digit summed flat
  const flatDigits = [
    ...String(month).padStart(2, '0').split('').map(Number),
    ...String(day).padStart(2, '0').split('').map(Number),
    ...String(year).split('').map(Number),
  ];
  const flatSum = flatDigits.reduce((a, d) => a + d, 0);
  const fullSumEnergy = reduceToSingleDigit(flatSum);
  const fullSumCompound = flatSum !== fullSumEnergy ? `${flatSum}/${fullSumEnergy}` : `${fullSumEnergy}`;

  // 2. Standard (Simplified): Reduce components first
  const monthReduced = reduceToSingleDigit(month);
  const dayReduced = MASTERS.has(day) ? day : reduceToSingleDigit(digitSum(day));
  const yearDigitSum = digitSum(year);
  const yearReduced = reduceToSingleDigit(yearDigitSum);
  const dayCompound = day !== dayReduced ? `${day}/${dayReduced}` : `${dayReduced}`;
  const monthCompound = month !== monthReduced ? `${month}/${monthReduced}` : `${monthReduced}`;
  const yearCompound = yearDigitSum !== yearReduced ? `${yearDigitSum}/${yearReduced}` : `${yearReduced}`;

  const standardRaw = monthReduced + dayReduced + yearReduced;
  const standardEnergy = reduceToSingleDigit(standardRaw);

  const ordinalRaw = monthReduced + day + yearReduced;
  const ordinalEnergy = reduceToSingleDigit(ordinalRaw);
  const ordinalCalculation = `${monthReduced} + ${day} + ${yearReduced} = ${ordinalRaw}${ordinalRaw !== ordinalEnergy ? ` -> ${ordinalEnergy}` : ""}`;

  return {
    fullSumEnergy,
    fullSumCompound,
    cypherReductionLine: `Reduced: ${dateDigitsUnpadded.join("+")} = ${fullSumCompound}`,
    standardEnergy,
    standardRaw,
    standardCompound: standardRaw !== standardEnergy ? `${standardRaw}/${standardEnergy}` : `${standardEnergy}`,
    secondaryEnergy: dayReduced,
    dayCompound,
    monthCompound,
    yearCompound,
    ordinalEnergy,
    ordinalRaw,
    ordinalCalculation,
    monthReduced,
    dayReduced,
    yearReduced,
    yearDigitSum,
    dayDigitSum: digitSum(day),
    flatSum,
    flatDigits,
    isFullSumMaster: MASTERS.has(fullSumEnergy),
    isStandardMaster: MASTERS.has(standardEnergy),
    isOrdinalMaster: MASTERS.has(ordinalEnergy),
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

function renderMeaning(text: string) {
  const parts = text.split(" — ");
  if (parts.length < 2) return <>{text}</>;
  const second = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  return <>{parts[0]}<br />{second}</>;
}

const masterTooltip: Record<number, string> = {
  11: "Master Number 11 is the Illuminator. This is a high-vibration day for spiritual insight, intuition, and receiving downloads. Align with: meditation, creative breakthroughs, listening to your inner voice, psychic/intuitive work, and inspired vision.",
  22: "Master Number 22 is the Master Builder. This is a rare day for turning big dreams into tangible reality. Align with: long-term planning, laying foundations, launching projects, strategic decisions, and disciplined focused action.",
  33: "Master Number 33 is the Master Teacher. A day of elevated compassion, healing, and divine guidance. Align with: teaching, uplifting others, service, artistic mastery, unconditional love, and spiritual leadership.",
};

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

type NumerologyCalendarProps = {
  onSendTodayToLifePath?: () => void;
};

type FamousBirthday = {
  year: number;
  name: string;
  description: string;
  url?: string;
};

export default function NumerologyCalendar({ onSendTodayToLifePath }: NumerologyCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [tooltipMaster, setTooltipMaster] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [famousBirthdays, setFamousBirthdays] = useState<FamousBirthday[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(false);
  const [birthdaysError, setBirthdaysError] = useState<string | null>(null);
  const [primarySlotValues, setPrimarySlotValues] = useState<[number, number, number]>([1, 1, 1]);
  const [primarySlotSpinClasses, setPrimarySlotSpinClasses] = useState<[string, string, string]>([""  , "", ""]);
  const [secondarySlotValues, setSecondarySlotValues] = useState<[number, number, number]>([1, 1, 1]);
  const [secondarySlotSpinClasses, setSecondarySlotSpinClasses] = useState<[string, string, string]>([""  , "", ""]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const primarySlotIntervalRefs = useRef<Array<ReturnType<typeof setInterval> | null>>([null, null, null]);
  const primarySlotValuesRef = useRef<[number, number, number]>([1, 1, 1]);
  const secondarySlotIntervalRefs = useRef<Array<ReturnType<typeof setInterval> | null>>([null, null, null]);
  const secondarySlotValuesRef = useRef<[number, number, number]>([1, 1, 1]);

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

  const targetPrimary = useMemo<[number, number, number]>(() => {
    return [selectedEnergy.ordinalRaw, selectedEnergy.flatSum, selectedEnergy.fullSumEnergy];
  }, [selectedEnergy]);

  const targetSecondary = useMemo<[number, number, number]>(() => {
    return [selectedEnergy.dayReduced, selectedEnergy.monthReduced, selectedEnergy.yearReduced];
  }, [selectedEnergy]);

  useEffect(() => { primarySlotValuesRef.current = primarySlotValues; }, [primarySlotValues]);
  useEffect(() => { secondarySlotValuesRef.current = secondarySlotValues; }, [secondarySlotValues]);

  useEffect(() => {
    const intervalRefs = primarySlotIntervalRefs.current;
    targetPrimary.forEach((target, index) => {
      if (intervalRefs[index]) clearInterval(intervalRefs[index] as ReturnType<typeof setInterval>);
      const direction = target >= primarySlotValuesRef.current[index] ? "up" : "down";
      setPrimarySlotSpinClasses((prev) => {
        const next: [string, string, string] = [...prev] as [string, string, string];
        next[index] = direction === "up" ? "spin-up" : "spin-down";
        return next;
      });
      let ticks = 0;
      intervalRefs[index] = setInterval(() => {
        ticks += 1;
        setPrimarySlotValues((prev) => {
          const next: [number, number, number] = [...prev] as [number, number, number];
          next[index] = direction === "up" ? (next[index] % 9) + 1 : ((next[index] + 7) % 9) + 1;
          primarySlotValuesRef.current = next;
          return next;
        });
        if (ticks >= 10) {
          clearInterval(intervalRefs[index] as ReturnType<typeof setInterval>);
          intervalRefs[index] = null;
          setPrimarySlotValues((prev) => {
            const next: [number, number, number] = [...prev] as [number, number, number];
            next[index] = target;
            primarySlotValuesRef.current = next;
            return next;
          });
          setPrimarySlotSpinClasses((prev) => {
            const next: [string, string, string] = [...prev] as [string, string, string];
            next[index] = "";
            return next;
          });
        }
      }, 55 + index * 12);
    });
    return () => { primarySlotIntervalRefs.current.forEach((iv) => { if (iv) clearInterval(iv); }); };
  }, [targetPrimary]);

  useEffect(() => {
    const intervalRefs = secondarySlotIntervalRefs.current;
    targetSecondary.forEach((target, index) => {
      if (intervalRefs[index]) clearInterval(intervalRefs[index] as ReturnType<typeof setInterval>);
      const direction = target >= secondarySlotValuesRef.current[index] ? "up" : "down";
      setSecondarySlotSpinClasses((prev) => {
        const next: [string, string, string] = [...prev] as [string, string, string];
        next[index] = direction === "up" ? "spin-up" : "spin-down";
        return next;
      });
      let ticks = 0;
      intervalRefs[index] = setInterval(() => {
        ticks += 1;
        setSecondarySlotValues((prev) => {
          const next: [number, number, number] = [...prev] as [number, number, number];
          next[index] = direction === "up" ? (next[index] % 9) + 1 : ((next[index] + 7) % 9) + 1;
          secondarySlotValuesRef.current = next;
          return next;
        });
        if (ticks >= 10) {
          clearInterval(intervalRefs[index] as ReturnType<typeof setInterval>);
          intervalRefs[index] = null;
          setSecondarySlotValues((prev) => {
            const next: [number, number, number] = [...prev] as [number, number, number];
            next[index] = target;
            secondarySlotValuesRef.current = next;
            return next;
          });
          setSecondarySlotSpinClasses((prev) => {
            const next: [string, string, string] = [...prev] as [string, string, string];
            next[index] = "";
            return next;
          });
        }
      }, 68 + index * 14);
    });
    return () => { secondarySlotIntervalRefs.current.forEach((iv) => { if (iv) clearInterval(iv); }); };
  }, [targetSecondary]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBirthdays = async () => {
      setBirthdaysLoading(true);
      setBirthdaysError(null);

      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");

      try {
        const response = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${month}/${day}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json() as {
          births?: Array<{
            year?: number;
            text?: string;
            pages?: Array<{
              title?: string;
              content_urls?: {
                desktop?: {
                  page?: string;
                };
              };
            }>;
          }>;
        };

        const normalized = (payload.births ?? [])
          .map((entry): FamousBirthday | null => {
            const text = (entry.text ?? "").trim();
            const primaryPage = entry.pages?.[0];
            const pageTitle = primaryPage?.title?.trim();
            const url = primaryPage?.content_urls?.desktop?.page;

            const derivedName = pageTitle || text.split(",")[0]?.trim();
            if (!derivedName || !entry.year) {
              return null;
            }

            return {
              year: entry.year,
              name: derivedName,
              description: text,
              url,
            };
          })
          .filter((entry): entry is FamousBirthday => entry !== null)
          .slice(0, 8);

        setFamousBirthdays(normalized);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setFamousBirthdays([]);
        setBirthdaysError("Unable to load famous birthdays right now.");
      } finally {
        setBirthdaysLoading(false);
      }
    };

    fetchBirthdays();

    return () => {
      controller.abort();
    };
  }, [selectedDate]);

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

  const formatDate = (d: Date) =>
    `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  const handleMasterBadgeEnter = (e: React.MouseEvent, masterNum: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipMaster(masterNum);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-0 md:px-4">
      {/* ---------- Calendar Header --------------------------------- */}
      <div className="bg-white dark:bg-[#171717] rounded-lg p-2 md:p-4 shadow-lg">
        {/* weekday headers & navigation */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center mb-2 px-1 md:px-2">
          {/* Left Arrow */}
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-bold mr-1 md:mr-2"
          >
            ‹
          </button>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 w-full">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-bold ml-1 md:ml-2"
          >
            ›
          </button>
        </div>

        {/* day cells */}
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
          {calendarDays.map((info, idx) => {
            const { date, day, energy, fullMoon, isAdjacentMonth } = info;
            const isT = same(date, today);
            const isSel = same(date, selectedDate);

            return (
              <button
                key={`day-${idx}`}
                onClick={() => setSelectedDate(new Date(date))}
                className={`
                  relative aspect-square md:aspect-[2/1] rounded-md md:rounded-lg flex items-center justify-center text-xs md:text-sm font-medium transition-all
                  ${
                    isAdjacentMonth
                      ? "bg-transparent text-gray-400/30 dark:text-gray-600/40 border border-gray-200/50 dark:border-gray-800/50"
                      : isT
                        ? "ring-1 md:ring-2 ring-offset-1 md:ring-offset-2 ring-offset-[#171717] bg-[#0B0B0B]"
                        : isSel
                          ? "ring-1 md:ring-2 ring-[#8D7F62] bg-[#1a160e] text-[#8D7F62] font-bold"
                          : "bg-gray-100 dark:bg-[#0B0B0B] text-gray-800 dark:text-gray-200"
                  }
                `}
                style={isT && !isAdjacentMonth ? ({
                  color: "var(--theme-accent)",
                  ["--tw-ring-color" as string]: "var(--theme-accent)",
                } as React.CSSProperties) : undefined}
              >
                <span>{day}</span>

                {/* Master-number badge */}
                {(energy.isFullSumMaster || energy.isStandardMaster || energy.isOrdinalMaster) && (
                  <span
                    className="absolute top-0 right-0 text-[8px] md:text-[11px] font-black text-[#0056E1] leading-none bg-black/70 rounded-bl-md px-1 md:px-1.5 py-0.5 cursor-help z-10"
                    onMouseEnter={(e) => handleMasterBadgeEnter(e, energy.isStandardMaster ? energy.standardEnergy : (energy.isOrdinalMaster ? energy.ordinalEnergy : energy.fullSumEnergy))}
                    onMouseLeave={() => setTooltipMaster(null)}
                  >
                    {energy.isStandardMaster ? energy.standardEnergy : (energy.isOrdinalMaster ? energy.ordinalEnergy : energy.fullSumEnergy)}
                  </span>
                )}

                {/* Full-moon indicator (Swapped to bottom right) */}
                {fullMoon && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] md:text-[10px] leading-none pointer-events-none z-10">
                    🌕
                  </span>
                )}

                {/* Wealth day (28th) (Swapped to bottom left) */}
                {day === 28 && (
                  <span
                    className="absolute bottom-0.5 left-0.5 text-[8px] md:text-[10px] leading-none cursor-help z-10"
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
              {MONTH_NAMES[viewMonth].substring(0, 3).toUpperCase()} <span className="text-white">{selectedDate.getDate()}</span> <span className="text-gray-400 dark:text-gray-500">{viewYear}</span>
            </p>
          </div>

          {/* Middle: Slots */}
          <div className="flex-1 text-center">
            <div className="mt-2 flex flex-col items-center gap-1">
              {/* Primary: Ordinal · Compound · Reduced */}
              <div className="inline-flex items-center gap-1">
                {(["", "", ""] as const).map((_label, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="h-[29px] w-9 overflow-hidden rounded-sm bg-[#0B0B0B]"
                      style={{ border: "1px solid var(--theme-accent)" }}
                    >
                      <div className={`tally-slot ${primarySlotSpinClasses[i]}`}>{primarySlotValues[i]}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Secondary: Day · Month · Year (40% smaller) */}
              <div className="inline-flex items-center gap-0.5">
                {(["D", "M", "Y"] as const).map((_label, i) => (
                  <div key={i}>
                    <div className="h-[23px] w-[28px] overflow-hidden rounded-sm border border-gray-500/30 bg-[#0B0B0B]">
                      <div className={`tally-slot ${secondarySlotSpinClasses[i]}`} style={{ fontSize: "0.82rem" }}>{secondarySlotValues[i]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Back to Present Button */}
          <div className="flex-1 flex justify-end gap-2">
            {(!same(selectedDate, today) || viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) ? (
              <button
                onClick={goToToday}
                className="btn-accent ui-square-button rounded-xl text-xs font-bold transition-all flex items-center justify-center focus:outline-none leading-none"
                title="Today"
                aria-label="Today"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
              </button>
            ) : (
              <div
                className="ui-square-button rounded-xl bg-gray-100 dark:bg-[#0B0B0B] leading-none flex items-center justify-center"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    color: "#ffffff",
                    filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--theme-accent) 52%, transparent))",
                  }}
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
                </svg>
              </div>
            )}
            <button
              onClick={onSendTodayToLifePath}
              className="ui-square-button relative overflow-hidden rounded-xl border border-[#8D7F62] bg-[#0B0B0B] text-white btn-hover-subtle transition-all flex items-center justify-center focus:outline-none"
              title="Open Destiny"
              aria-label="Open Destiny"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7 6 6 6-6 6" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* --- Left: Energy Results --- */}
          <div className="bg-gray-50 dark:bg-[#0B0B0B] rounded-lg p-4 space-y-4">
            {/* Ordinal / Compound / Reduced */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Ordinal / Compound / Reduced (Life Path)</p>
              <div className="flex items-end gap-3 mb-1">
                <div className="text-center">
                  <p className="font-bold text-3xl text-black dark:text-white">{selectedEnergy.ordinalRaw}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ordinal</p>
                </div>
                <span className="text-gray-600 text-xl mb-2">·</span>
                <div className="text-center">
                  <p className="font-bold text-3xl text-black dark:text-white">{selectedEnergy.flatSum}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Compound</p>
                </div>
                <span className="text-gray-600 text-xl mb-2">·</span>
                <div className="text-center">
                  <p className="font-bold text-3xl text-black dark:text-white">{selectedEnergy.fullSumEnergy}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Reduced</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selectedEnergy.ordinalCalculation}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedEnergy.cypherReductionLine}</p>
              <div className="space-y-1 mt-2">
                {numberMeaning[selectedEnergy.ordinalEnergy] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Ordinal:</span> {renderMeaning(numberMeaning[selectedEnergy.ordinalEnergy])}</p>
                )}
                {numberMeaning[selectedEnergy.fullSumEnergy] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Compound:</span> {renderMeaning(numberMeaning[selectedEnergy.fullSumEnergy])}</p>
                )}
                {numberMeaning[selectedEnergy.fullSumEnergy] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Reduced:</span> {renderMeaning(numberMeaning[selectedEnergy.fullSumEnergy])}</p>
                )}
              </div>
            </div>
            {/* Secondary Energy */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Secondary Energies (Day, Month, Year)</p>
              <p className="font-bold text-xl text-black dark:text-white">
                {selectedEnergy.dayCompound} • {selectedEnergy.monthCompound} • {selectedEnergy.yearCompound}
              </p>
              <div className="space-y-1 mt-1">
                {numberMeaning[selectedEnergy.dayReduced] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Day:</span> {renderMeaning(numberMeaning[selectedEnergy.dayReduced])}</p>
                )}
                {numberMeaning[selectedEnergy.monthReduced] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Month:</span> {renderMeaning(numberMeaning[selectedEnergy.monthReduced])}</p>
                )}
                {numberMeaning[selectedEnergy.yearReduced] && (
                  <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed"><span className="not-italic font-medium text-white">Year:</span> {renderMeaning(numberMeaning[selectedEnergy.yearReduced])}</p>
                )}
              </div>
            </div>
          </div>

          {/* --- Right: Famous Birthdays --- */}
          <div className="bg-gray-50 dark:bg-[#0B0B0B] rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-black dark:text-white text-sm mb-0.5 inter-caps tracking-wide">Famous Birthdays</h4>
              <p className="text-[10px] text-gray-500 mb-2">People born on {formatDate(selectedDate)} (public data source)</p>

              {birthdaysLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading birthdays...</p>
              )}

              {!birthdaysLoading && birthdaysError && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{birthdaysError}</p>
              )}

              {!birthdaysLoading && !birthdaysError && famousBirthdays.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No birthdays found for this date.</p>
              )}

              {!birthdaysLoading && !birthdaysError && famousBirthdays.length > 0 && (
                <div className="space-y-2">
                  {famousBirthdays.map((person, idx) => (
                    <div key={`${person.name}-${person.year}-${idx}`} className="border-t border-gray-200 dark:border-gray-700 pt-2 first:border-t-0 first:pt-0">
                      <p className="text-sm text-white font-medium">
                        {MONTH_NAMES[selectedDate.getMonth()].slice(0, 3).toUpperCase()} {selectedDate.getDate()}, {person.year} • {person.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{person.description}</p>
                      {person.url && (
                        <a href={person.url} target="_blank" rel="noreferrer" className="text-xs text-[#8D7F62] hover:underline">
                          Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Legend ------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 bg-[#0B0B0B]" style={{ ["--tw-ring-color" as string]: "var(--theme-accent)" } as React.CSSProperties} />
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

      <style jsx>{`
        .tally-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 800;
          font-family: var(--font-space-grotesk), monospace;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.28);
          transition: transform 120ms linear;
        }

        .spin-up {
          animation: tallySpinUp 180ms linear infinite;
        }

        .spin-down {
          animation: tallySpinDown 180ms linear infinite;
        }

        @keyframes tallySpinUp {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }

        @keyframes tallySpinDown {
          from { transform: translateY(0); }
          to { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}
