"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import MerkabahIcon3D from "./MerkabahIcon3D";
import { upsertSavedEntry } from "../savedEntries";

const MASTER = new Set([11, 22, 33]);
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const LETTER_VALUES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .reduce<Record<string, number>>((accumulator, letter, index) => {
    accumulator[letter] = (index % 9) + 1;
    return accumulator;
  }, {});

const PROFILE_TITLES: Record<number, string> = {
  1: "The Leader",
  2: "The Diplomat",
  3: "The Communicator",
  4: "The Builder",
  5: "The Adventurer",
  6: "The Nurturer",
  7: "The Seeker",
  8: "The Achiever",
  9: "The Warrior",
  11: "The Intuitive Master",
  22: "The Master Builder",
  33: "The Master Teacher",
};

const DESCRIPTIONS: Record<number, { title: string; body: string }> = {
  1: {
    title: "The Leader",
    body: "You are a natural-born pioneer - independent, ambitious, and built to forge your own trail. Your greatest gift is the courage to stand alone and initiate what others only imagine.",
  },
  2: {
    title: "The Diplomat",
    body: "Cooperation is your superpower. You bring balance, sensitivity, and grace to every relationship. You thrive when building bridges and helping others find common ground.",
  },
  3: {
    title: "The Communicator",
    body: "Creative, expressive, and magnetic, you were born to inspire. Your words, art, or presence light up every room. Joy is both your gift to the world and your greatest teacher.",
  },
  4: {
    title: "The Builder",
    body: "You are the architect of lasting things. Through discipline, integrity, and tireless effort you construct what others only dream about. Stability is your foundation and your legacy.",
  },
  5: {
    title: "The Adventurer",
    body: "Change is your oxygen. Versatile, daring, and magnetic, you are here to explore every dimension of human experience and to show others that life is meant to be lived fully.",
  },
  6: {
    title: "The Nurturer",
    body: "Your heart is your compass. Devoted, compassionate, and deeply responsible, you create love and safety wherever you go. Family, community, and service are the pillars of your purpose.",
  },
  7: {
    title: "The Seeker",
    body: "You are wired for depth. Introspective, analytical, and spiritually tuned, you search beneath the surface of everything. Your path leads inward, and that inner knowing is your greatest gift.",
  },
  8: {
    title: "The Achiever",
    body: "Power and purpose are your birthright. You have an extraordinary capacity to build wealth, authority, and influence, and your highest calling is to use that power with wisdom and integrity.",
  },
  9: {
    title: "The Warrior",
    body: "You are here to serve with courage, conviction, and heart. Compassion and completion shape your path, and your strength shows up most clearly when you fight for something larger than yourself.",
  },
  11: {
    title: "The Intuitive Master",
    body: "You are a spiritual messenger. Highly sensitive and intuitively gifted, you arrived with a rare ability to tune into higher frequencies. Your path is to channel that vision and illuminate others.",
  },
  22: {
    title: "The Master Builder",
    body: "You hold an unusually potent path. You combine vision with grounded execution - the unique capacity to turn ambitious dreams into lasting, real-world reality.",
  },
  33: {
    title: "The Master Teacher",
    body: "This is a rare path of healing, compassion, and responsibility. Your purpose is to raise the consciousness of those around you through service, example, and deep love.",
  },
};

type ParsedDate = {
  month: number;
  day: number;
  year: number;
  date: Date;
};

type LifePathValue = {
  ordinal: number;
  reducedTotal: number;
  final: number;
  display: string;
  breakdown: string;
  note: string;
};

type PinnacleValue = {
  ordinal: number;
  reducedTotal: number;
  final: number;
  label: string;
};

type ProfileResult = {
  normalizedName: string;
  displayName: string;
  formattedBirthdate: string;
  birthdate: ParsedDate | null;
  hasName: boolean;
  hasBirthdate: boolean;
  lifePath: LifePathValue | null;
  personalYear: { raw: number; final: number; referenceYear: number } | null;
  lunarLifePath: (LifePathValue & {
    lunarMonth: number;
    lunarDay: number;
    lunarYear: number;
  }) | null;
  expression: { raw: number; final: number };
  soulUrge: { raw: number; final: number };
  personality: { raw: number; final: number };
  birthDay: { raw: number; final: number } | null;
  maturity: { raw: number; final: number } | null;
  dayOfYear: { raw: number; final: number } | null;
  yearEnergy: { raw: number; final: number } | null;
  pinnacles: {
    first: PinnacleValue;
    second: PinnacleValue;
    third: PinnacleValue;
    fourth: PinnacleValue;
    firstSpan: string;
    secondSpan: string;
    thirdSpan: string;
    fourthSpan: string;
  } | null;
};

type CardData = {
  key: string;
  label?: string;
  value: ReactNode;
  title?: string;
  detail?: ReactNode;
  note?: string;
  valueClassName?: string;
};

const LIFE_PATH_FORM_STORAGE_KEY = "numcalc-life-path-form";
const LIFE_PATH_FORM_COOKIE_NAME = "numcalc-life-path-form";
const DHARMA_SAMPLE_NAMES = ["Nikola Milutinov Tesla", "Albert Einstein", "Marie Curie"];
const TESLA_SAMPLE_NAME = "NIKOLA MILUTINOV TESLA";
const SAMPLE_PROFILE_BIRTHDATES: Record<string, string> = {
  "Nikola Milutinov Tesla": "06/28/1856",
};

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const readLifePathFormState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LIFE_PATH_FORM_STORAGE_KEY) ?? getCookieValue(LIFE_PATH_FORM_COOKIE_NAME);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      birthdateInput?: string;
      committedBirthdateInput?: string;
      fullName?: string;
      committedName?: string;
    };

    return {
      birthdateInput: typeof parsed.birthdateInput === "string" ? parsed.birthdateInput : "",
      committedBirthdateInput:
        typeof parsed.committedBirthdateInput === "string"
          ? parsed.committedBirthdateInput
          : typeof parsed.birthdateInput === "string"
            ? parsed.birthdateInput
            : "",
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      committedName: typeof parsed.committedName === "string" ? parsed.committedName : "",
    };
  } catch {
    return null;
  }
};

const writeLifePathFormState = (value: {
  birthdateInput: string;
  committedBirthdateInput: string;
  fullName: string;
  committedName: string;
}) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!value.birthdateInput && !value.committedBirthdateInput && !value.fullName && !value.committedName) {
    window.localStorage.removeItem(LIFE_PATH_FORM_STORAGE_KEY);
    document.cookie = `${LIFE_PATH_FORM_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    return;
  }

  const serialized = JSON.stringify(value);
  window.localStorage.setItem(LIFE_PATH_FORM_STORAGE_KEY, serialized);
  document.cookie = `${LIFE_PATH_FORM_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=31536000; samesite=lax`;
};

const reduceToSingleDigit = (value: number): number => {
  if (MASTER.has(value)) return value;
  if (value < 10) return value;

  const reduced = String(value)
    .split("")
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0);

  if (MASTER.has(reduced)) return reduced;
  return reduced > 9 ? reduceToSingleDigit(reduced) : reduced;
};

const reduceToCoreDigit = (value: number): number => {
  if (value < 10) return value;

  const reduced = String(value)
    .split("")
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0);

  return reduced > 9 ? reduceToCoreDigit(reduced) : reduced;
};

const digitSum = (value: number): number =>
  String(value)
    .split("")
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0);

const digitsOf = (value: number, pad: number) =>
  String(value).padStart(pad, "0").split("").map(Number);

const cleanName = (value: string) =>
  value.toUpperCase().replace(/[^A-Z\s]/g, " ").replace(/\s+/g, " ").trim();

const sumLetters = (value: string, predicate: (character: string) => boolean) =>
  value
    .split("")
    .filter((character) => /[A-Z]/.test(character) && predicate(character))
    .reduce((sum, character) => sum + LETTER_VALUES[character], 0);

const formatBirthdateInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const month = digits.slice(0, 2);
  const day = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return month;
  if (digits.length <= 4) return `${month}/${day}`;
  return `${month}/${day}/${year}`;
};

const formatTodayBirthdate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const year = String(today.getFullYear());
  return `${month}/${day}/${year}`;
};

const parseBirthdate = (value: string): ParsedDate | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, monthValue, dayValue, yearValue] = match;
  const month = parseInt(monthValue, 10);
  const day = parseInt(dayValue, 10);
  const year = parseInt(yearValue, 10);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(year) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { month, day, year, date };
};

const getDayOfYear = (date: Date) => {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcStart = Date.UTC(date.getFullYear(), 0, 0);
  return Math.floor((utcDate - utcStart) / 86_400_000);
};

const CHINESE_MONTH_MAP: Record<string, number> = {
  "正": 1,
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "七": 7,
  "八": 8,
  "九": 9,
  "十": 10,
  "十一": 11,
  "十二": 12,
  "冬": 11,
  "腊": 12,
};

const getLunarDateParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("zh-u-ca-chinese", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const relatedYear = parts.find((part) => (part.type as string) === "relatedYear")?.value;
  const monthPart = parts.find((part) => part.type === "month")?.value;
  const dayPart = parts.find((part) => part.type === "day")?.value;

  if (!relatedYear || !monthPart || !dayPart) {
    return null;
  }

  const normalizedMonth = monthPart.replace("闰", "").replace("月", "");
  const month = CHINESE_MONTH_MAP[normalizedMonth];
  const day = parseInt(dayPart, 10);
  const year = parseInt(relatedYear, 10);

  if (!month || Number.isNaN(day) || Number.isNaN(year)) {
    return null;
  }

  return { month, day, year };
};

const getMoonPhaseEmoji = (date: Date) => {
  const referenceMs = Date.UTC(2000, 0, 6, 18, 14);
  const targetMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0);
  const daysSinceReference = (targetMs - referenceMs) / 86_400_000;
  const phase = ((daysSinceReference % 29.53059) + 29.53059) % 29.53059;

  if (phase < 1.84566) return "New Moon 🌑";
  if (phase < 5.53699) return "Waxing Crescent 🌒";
  if (phase < 9.22831) return "First Quarter 🌓";
  if (phase < 12.91963) return "Waxing Gibbous 🌔";
  if (phase < 16.61096) return "Full Moon 🌕";
  if (phase < 20.30228) return "Waning Gibbous 🌖";
  if (phase < 23.99361) return "Last Quarter 🌗";
  if (phase < 27.68493) return "Waning Crescent 🌘";
  return "New Moon 🌑";
};

const buildLifePathValue = (month: number, day: number, year: number): LifePathValue => {
  const reducedDigits = [...digitsOf(month, 2), ...digitsOf(day, 2), ...digitsOf(year, 4)];
  const reducedTotal = reducedDigits.reduce((sum, digit) => sum + digit, 0);
  const ordinal = month + day + digitSum(year);
  const final = reduceToCoreDigit(reducedTotal);
  const display = ordinal === reducedTotal ? `${reducedTotal}/${final}` : `${ordinal}/${reducedTotal}/${final}`;
  const breakdown =
    ordinal === reducedTotal
      ? `${reducedDigits.join("+")} = ${reducedTotal} -> ${final}`
      : `${month} + ${day} + ${digitSum(year)} = ${ordinal} | ${reducedDigits.join("+")} = ${reducedTotal} -> ${final}`;

  return {
    ordinal,
    reducedTotal,
    final,
    display,
    breakdown,
    note: "Ordinal + Reduced",
  };
};

const buildPinnacles = (month: number, day: number, year: number, lifePathFinal: number) => {
  const monthCore = reduceToSingleDigit(month);
  const dayCore = reduceToSingleDigit(day);
  const yearCore = reduceToSingleDigit(digitSum(year));

  const firstOrdinal = month + day;
  const secondOrdinal = day + digitSum(year);
  const fourthOrdinal = month + digitSum(year);

  const firstReducedTotal = monthCore + dayCore;
  const secondReducedTotal = dayCore + yearCore;
  const thirdOrdinal = firstOrdinal + secondOrdinal;
  const thirdReducedTotal = firstReducedTotal + secondReducedTotal;
  const fourthReducedTotal = monthCore + yearCore;

  const firstEndAge = 36 - lifePathFinal;
  const secondEndAge = firstEndAge + 9;
  const thirdEndAge = secondEndAge + 9;

  return {
    first: { ordinal: firstOrdinal, reducedTotal: firstReducedTotal, final: reduceToSingleDigit(firstReducedTotal), label: "1st" },
    second: { ordinal: secondOrdinal, reducedTotal: secondReducedTotal, final: reduceToSingleDigit(secondReducedTotal), label: "2nd" },
    third: { ordinal: thirdOrdinal, reducedTotal: thirdReducedTotal, final: reduceToSingleDigit(thirdReducedTotal), label: "3rd" },
    fourth: { ordinal: fourthOrdinal, reducedTotal: fourthReducedTotal, final: reduceToSingleDigit(fourthReducedTotal), label: "4th" },
    firstSpan: `0-${firstEndAge}`,
    secondSpan: `${firstEndAge + 1}-${secondEndAge}`,
    thirdSpan: `${secondEndAge + 1}-${thirdEndAge}`,
    fourthSpan: `${thirdEndAge + 1}+`,
  };
};

const buildReductionDetail = (raw: number, final: number) =>
  raw === final ? `Final: ${final}` : `Reduced: ${raw} -> ${final}`;

const buildCompoundValue = (raw: number, final: number) =>
  raw === final ? `${final}` : `${raw}/${final}`;

const buildThreeStepValue = (ordinal: number, reducedTotal: number, final: number) => {
  if (ordinal === reducedTotal && reducedTotal === final) {
    return `${final}`;
  }

  if (ordinal === reducedTotal) {
    return `${reducedTotal}/${final}`;
  }

  if (reducedTotal === final) {
    return `${ordinal}/${final}`;
  }

  return `${ordinal}/${reducedTotal}/${final}`;
};

const getCompactProfileTitle = (value: number) => getProfileTitle(value).replace(/^The\s+/, "");

const buildLifePathDetail = (month: number, day: number, year: number, ordinal: number, reducedTotal: number, final: number) => {
  const ordinalLine = `Ordinal: ${month}+${day}+${digitSum(year)} = ${ordinal}`;
  const reducedLine = `${digitsOf(month, 2).join("+")}+${digitsOf(day, 2).join("+")}+${digitsOf(year, 4).join("+")} = ${reducedTotal} -> ${final}`;

  if (ordinal === reducedTotal) {
    return reducedLine;
  }

  return (
    <>
      <span className="block">{ordinalLine}</span>
      <span className="mt-1 block">{reducedLine}</span>
    </>
  );
};

const getProfileTitle = (value: number) => (PROFILE_TITLES[value] ?? "Numerology Insight").replace(/^The\s+/, "");

type LifePathProps = {
  prefilledName?: string;
  prefilledBirthdate?: string;
  resetSignal?: number;
  onSavedEntriesChange?: () => void;
  onOpenProfiles?: () => void;
};

export default function LifePath({ prefilledName = "", prefilledBirthdate = "", resetSignal = 0, onSavedEntriesChange, onOpenProfiles }: LifePathProps) {
  const [fullName, setFullName] = useState("");
  const [committedName, setCommittedName] = useState("");
  const [birthdateInput, setBirthdateInput] = useState("");
  const [committedBirthdateInput, setCommittedBirthdateInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [merkabahSpinKey, setMerkabahSpinKey] = useState(0);
  const [merkabahJoltKey, setMerkabahJoltKey] = useState(0);
  const [showNameGoState, setShowNameGoState] = useState(false);
  const [isUndoIconExiting, setIsUndoIconExiting] = useState(false);
  const [isAutoSampleResult, setIsAutoSampleResult] = useState(false);
  const [profileCardHeight, setProfileCardHeight] = useState<number | null>(null);
  const lastAppliedPrefilledBirthdate = useRef("");
  const lastAppliedPrefilledName = useRef("");
  const hasLoadedSavedFormState = useRef(false);
  const profileCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const birthdateInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const nameGoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedState = readLifePathFormState();
    if (savedState) {
      setBirthdateInput(savedState.birthdateInput);
      setCommittedBirthdateInput(savedState.committedBirthdateInput);
      setFullName(savedState.fullName);
      setCommittedName(savedState.committedName);
    }

    hasLoadedSavedFormState.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedFormState.current) {
      return;
    }

    writeLifePathFormState({ birthdateInput, committedBirthdateInput, fullName, committedName });
  }, [birthdateInput, committedBirthdateInput, committedName, fullName]);

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }

    if (nameGoTimerRef.current !== null) {
      window.clearTimeout(nameGoTimerRef.current);
      nameGoTimerRef.current = null;
    }

    lastAppliedPrefilledName.current = "";
    lastAppliedPrefilledBirthdate.current = "";
    setBirthdateInput("");
    setCommittedBirthdateInput("");
    setFullName("");
    setCommittedName("");
    setSaveMessage(null);
    setShowModal(false);
    setShowNameGoState(false);
    setIsUndoIconExiting(false);
    setIsAutoSampleResult(false);
    writeLifePathFormState({ birthdateInput: "", committedBirthdateInput: "", fullName: "", committedName: "" });
  }, [resetSignal]);

  useEffect(() => {
    if (
      !prefilledBirthdate ||
      prefilledBirthdate === lastAppliedPrefilledBirthdate.current
    ) {
      return;
    }

    lastAppliedPrefilledBirthdate.current = prefilledBirthdate;

    if (prefilledBirthdate !== birthdateInput) {
      setBirthdateInput(prefilledBirthdate);
    }
  }, [birthdateInput, prefilledBirthdate]);

  useEffect(() => {
    if (!prefilledName || prefilledName === lastAppliedPrefilledName.current) {
      return;
    }

    lastAppliedPrefilledName.current = prefilledName;
    setFullName(prefilledName);
    setCommittedName(prefilledName);

    if (prefilledBirthdate) {
      setBirthdateInput(prefilledBirthdate);
      setCommittedBirthdateInput(prefilledBirthdate);
      lastAppliedPrefilledBirthdate.current = prefilledBirthdate;
    }
  }, [prefilledBirthdate, prefilledName]);

  useEffect(() => {
    if (nameGoTimerRef.current !== null) {
      window.clearTimeout(nameGoTimerRef.current);
      nameGoTimerRef.current = null;
    }

    const trimmedName = fullName.trim();
    const nameMatchesCommitted = trimmedName.length > 0 && trimmedName === committedName.trim();

    if (!trimmedName || nameMatchesCommitted) {
      setShowNameGoState(false);
      return;
    }

    setShowNameGoState(false);
    nameGoTimerRef.current = window.setTimeout(() => {
      setShowNameGoState(true);
      nameGoTimerRef.current = null;
    }, 800);

    return () => {
      if (nameGoTimerRef.current !== null) {
        window.clearTimeout(nameGoTimerRef.current);
        nameGoTimerRef.current = null;
      }
    };
  }, [committedName, fullName]);

  const result = useMemo<ProfileResult | null>(() => {
    const normalizedName = cleanName(committedName);
    const birthdate = parseBirthdate(committedBirthdateInput);
    const hasName = normalizedName.length > 0;
    const hasBirthdate = Boolean(birthdate);

    if (!hasName && !hasBirthdate) {
      return null;
    }

    const expressionRaw = hasName ? sumLetters(normalizedName, () => true) : 0;
    const soulUrgeRaw = hasName ? sumLetters(normalizedName, (character) => VOWELS.has(character)) : 0;
    const personalityRaw = hasName ? sumLetters(normalizedName, (character) => !VOWELS.has(character)) : 0;
    const referenceYear = new Date().getFullYear();

    const expressionFinal = hasName ? reduceToSingleDigit(expressionRaw) : 0;
    const birthDayRaw = birthdate?.day ?? null;
    const dayOfYearRaw = birthdate ? getDayOfYear(birthdate.date) : null;
    const yearEnergyRaw = birthdate?.year ?? null;
    const personalYearRaw = birthdate ? birthdate.month + birthdate.day + digitSum(referenceYear) : null;
    const lifePath = birthdate ? buildLifePathValue(birthdate.month, birthdate.day, birthdate.year) : null;
    const maturityRaw = hasName && lifePath ? expressionFinal + lifePath.final : null;
    const lunarDate = birthdate ? getLunarDateParts(birthdate.date) : null;
    const pinnacles = birthdate && lifePath
      ? buildPinnacles(birthdate.month, birthdate.day, birthdate.year, lifePath.final)
      : null;

    return {
      normalizedName,
      displayName: committedName.trim(),
      formattedBirthdate: committedBirthdateInput,
      birthdate,
      hasName,
      hasBirthdate,
      lifePath,
      personalYear: personalYearRaw
        ? {
            raw: personalYearRaw,
            final: reduceToCoreDigit(personalYearRaw),
            referenceYear,
          }
        : null,
      lunarLifePath: lunarDate
        ? {
            ...buildLifePathValue(lunarDate.month, lunarDate.day, lunarDate.year),
            lunarMonth: lunarDate.month,
            lunarDay: lunarDate.day,
            lunarYear: lunarDate.year,
          }
        : null,
      expression: { raw: expressionRaw, final: expressionFinal },
      soulUrge: { raw: soulUrgeRaw, final: hasName ? reduceToSingleDigit(soulUrgeRaw) : 0 },
      personality: { raw: personalityRaw, final: hasName ? reduceToSingleDigit(personalityRaw) : 0 },
      birthDay: birthDayRaw ? { raw: birthDayRaw, final: reduceToCoreDigit(birthDayRaw) } : null,
      maturity: maturityRaw ? { raw: maturityRaw, final: reduceToSingleDigit(maturityRaw) } : null,
      dayOfYear: dayOfYearRaw ? { raw: dayOfYearRaw, final: reduceToCoreDigit(dayOfYearRaw) } : null,
      yearEnergy: yearEnergyRaw
        ? { raw: digitSum(yearEnergyRaw), final: reduceToCoreDigit(digitSum(yearEnergyRaw)) }
        : null,
      pinnacles,
    };
  }, [committedBirthdateInput, committedName]);

  const desc = result?.lifePath ? DESCRIPTIONS[result.lifePath.final] : null;

  const buildPinnaclesCard = (pinnacles: NonNullable<ProfileResult["pinnacles"]>): CardData => ({
    key: "pinnacles",
    label: "Life Pinnacles",
    valueClassName: "text-base font-normal h-full",
    value: (
      <div className="flex h-full flex-col justify-center py-2">
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-2 gap-y-3">
          {[
            { ...pinnacles.first, span: pinnacles.firstSpan },
            { ...pinnacles.second, span: pinnacles.secondSpan },
            { ...pinnacles.third, span: pinnacles.thirdSpan },
            { ...pinnacles.fourth, span: pinnacles.fourthSpan },
          ].map((pinnacle, idx) => (
            <div
              key={pinnacle.label}
              className={`grid justify-items-center ${idx % 2 === 0 ? "col-start-2" : "col-start-4"}`}
            >
              <div className="grid w-fit justify-items-center">
                <div className="mb-0.5 flex w-fit items-baseline gap-1 whitespace-nowrap leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8D7F62]/70">
                      {pinnacle.label}
                  </span>
                  <span className="text-[10px] font-medium tracking-[0.08em] text-gray-500/70">
                      {pinnacle.span}
                  </span>
                </div>
                <div className="inline-block w-fit text-center text-[22px] font-extrabold leading-none text-gray-900 dark:text-white mystical-title">
                  {buildThreeStepValue(pinnacle.ordinal, pinnacle.reducedTotal, pinnacle.final)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  const cards: CardData[] = result
    ? [
        ...(result.hasBirthdate && !result.hasName && result.lifePath && result.birthdate && result.birthDay && result.dayOfYear && result.yearEnergy && result.personalYear && result.lunarLifePath && result.pinnacles
          ? [
              {
                key: "full-life-path",
                label: "Full Life Path",
                value: result.lifePath.display,
                title: getProfileTitle(result.lifePath.final),
                detail: buildLifePathDetail(
                  result.birthdate.month,
                  result.birthdate.day,
                  result.birthdate.year,
                  result.lifePath.ordinal,
                  result.lifePath.reducedTotal,
                  result.lifePath.final,
                ),
              },
              {
                key: "birth-day-year-energy",
                label: undefined,
                valueClassName: "text-base font-normal",
                value: (
                  <div className="grid grid-cols-2 divide-x divide-[#8D7F62]/25 text-center">
                    <div className="px-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                        Day
                      </p>
                      <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white mystical-title leading-none">
                        {buildCompoundValue(result.birthDay.raw, result.birthDay.final)}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#8D7F62]">{getCompactProfileTitle(result.birthDay.final)}</p>
                      <p className="mt-3 text-sm text-gray-300">{result.birthDay.raw}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {result.birthDay.raw === result.birthDay.final
                          ? `Final: ${result.birthDay.final}`
                          : `${result.birthDay.raw} → ${result.birthDay.final}`}
                      </p>
                    </div>
                    <div className="px-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                        Year
                      </p>
                      <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white mystical-title leading-none">
                        {buildCompoundValue(result.yearEnergy.raw, result.yearEnergy.final)}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#8D7F62]">{getCompactProfileTitle(result.yearEnergy.final)}</p>
                      <p className="mt-3 text-sm text-gray-300">{result.birthdate.year}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {result.yearEnergy.raw}
                        {result.yearEnergy.raw === result.yearEnergy.final ? "" : ` → ${result.yearEnergy.final}`}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "day-of-year",
                label: "Day Of Year",
                value: buildCompoundValue(result.dayOfYear.raw, result.dayOfYear.final),
                title: getProfileTitle(result.dayOfYear.final),
                detail: (
                  <>
                    <span className="block">{buildReductionDetail(result.dayOfYear.raw, result.dayOfYear.final)}</span>
                    <span className="mt-1 block">{`Lunar Cycle: ${getMoonPhaseEmoji(result.birthdate.date)}`}</span>
                  </>
                ),
              },
              {
                key: "lunar-life-path",
                label: "Lunar Life Path",
                value: result.lunarLifePath.display,
                title: getProfileTitle(result.lunarLifePath.final),
                detail: `Month: ${result.lunarLifePath.lunarMonth}, Day: ${result.lunarLifePath.lunarDay}, Year: ${result.lunarLifePath.lunarYear}`,
              },
              {
                ...buildPinnaclesCard(result.pinnacles),
              },
              {
                key: "personal-year",
                label: "Personal Year",
                value: buildCompoundValue(result.personalYear.raw, result.personalYear.final),
                title: getProfileTitle(result.personalYear.final),
                detail: `${result.birthdate.month}+${result.birthdate.day}+${digitSum(result.personalYear.referenceYear)} = ${result.personalYear.raw} -> ${result.personalYear.final}`,
              },
            ]
          : result.hasBirthdate && result.lifePath && result.birthdate && result.birthDay && result.dayOfYear && result.yearEnergy
          ? [
              {
                key: "full-life-path",
                label: "Full Life Path",
                value: result.lifePath.display,
                title: getProfileTitle(result.lifePath.final),
                detail: buildLifePathDetail(
                  result.birthdate.month,
                  result.birthdate.day,
                  result.birthdate.year,
                  result.lifePath.ordinal,
                  result.lifePath.reducedTotal,
                  result.lifePath.final,
                ),
              },
              {
                key: "birth-day-year-energy",
                label: undefined,
                valueClassName: "text-base font-normal",
                value: (
                  <div className="grid grid-cols-2 divide-x divide-[#8D7F62]/25 text-center">
                    <div className="px-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                        Day
                      </p>
                      <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white mystical-title leading-none">
                        {buildCompoundValue(result.birthDay.raw, result.birthDay.final)}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#8D7F62]">{getCompactProfileTitle(result.birthDay.final)}</p>
                      <p className="mt-3 text-sm text-gray-300">{result.birthDay.raw}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {result.birthDay.raw === result.birthDay.final
                          ? `Final: ${result.birthDay.final}`
                          : `${result.birthDay.raw} → ${result.birthDay.final}`}
                      </p>
                    </div>
                    <div className="px-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                        Year
                      </p>
                      <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white mystical-title leading-none">
                        {buildCompoundValue(result.yearEnergy.raw, result.yearEnergy.final)}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-[#8D7F62]">{getCompactProfileTitle(result.yearEnergy.final)}</p>
                      <p className="mt-3 text-sm text-gray-300">{result.birthdate.year}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {result.yearEnergy.raw}
                        {result.yearEnergy.raw === result.yearEnergy.final ? "" : ` → ${result.yearEnergy.final}`}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "day-of-year",
                label: "Day Of Year",
                value: buildCompoundValue(result.dayOfYear.raw, result.dayOfYear.final),
                title: getProfileTitle(result.dayOfYear.final),
                detail: (
                  <>
                    <span className="block">{buildReductionDetail(result.dayOfYear.raw, result.dayOfYear.final)}</span>
                    <span className="mt-1 block">{`Lunar Cycle: ${getMoonPhaseEmoji(result.birthdate.date)}`}</span>
                  </>
                ),
              },
            ]
          : []),
        ...(result.hasName
          ? [
              {
                key: "expression",
                label: "Expression",
                value: result.expression.final,
                title: getProfileTitle(result.expression.final),
                detail: buildReductionDetail(result.expression.raw, result.expression.final),
              },
              {
                key: "soul-urge",
                label: "Soul Urge",
                value: result.soulUrge.final,
                title: getProfileTitle(result.soulUrge.final),
                detail: buildReductionDetail(result.soulUrge.raw, result.soulUrge.final),
              },
              {
                key: "personality",
                label: "Personality",
                value: result.personality.final,
                title: getProfileTitle(result.personality.final),
                detail: buildReductionDetail(result.personality.raw, result.personality.final),
              },
              ...(result.hasBirthdate && result.pinnacles && result.birthdate
                ? [
                    {
                      ...buildPinnaclesCard(result.pinnacles),
                    },
                  ]
                : []),
              ...(result.hasBirthdate && result.personalYear && result.birthdate
                ? [
                    {
                      key: "personal-year",
                      label: "Personal Year",
                      value: buildCompoundValue(result.personalYear.raw, result.personalYear.final),
                      title: getProfileTitle(result.personalYear.final),
                      detail: `${result.birthdate.month}+${result.birthdate.day}+${digitSum(result.personalYear.referenceYear)} = ${result.personalYear.raw} -> ${result.personalYear.final}`,
                    },
                  ]
                : []),
              ...(result.hasBirthdate && result.maturity
                ? [
                    {
                      key: "maturity",
                      label: "Maturity",
                      value: result.maturity.final,
                      title: getProfileTitle(result.maturity.final),
                      detail: buildReductionDetail(result.maturity.raw, result.maturity.final),
                    },
                  ]
                : []),
            ]
          : []),
      ]
    : [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncProfileCardHeight = () => {
      if (window.innerWidth < 768) {
        setProfileCardHeight(null);
        return;
      }

      const firstRowCards = profileCardRefs.current.slice(0, Math.min(3, cards.length)).filter(Boolean) as HTMLDivElement[];

      if (firstRowCards.length === 0) {
        setProfileCardHeight(null);
        return;
      }

      const nextHeight = Math.max(...firstRowCards.map((card) => card.getBoundingClientRect().height));
      setProfileCardHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight));
    };

    const animationFrame = window.requestAnimationFrame(syncProfileCardHeight);
    window.addEventListener("resize", syncProfileCardHeight);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", syncProfileCardHeight);
    };
  }, [cards]);

  const resetDharmaForm = (focusTarget: "birthdate" | "name" = "birthdate") => {
    lastAppliedPrefilledBirthdate.current = prefilledBirthdate;
    setBirthdateInput("");
    setCommittedBirthdateInput("");
    setFullName("");
    setCommittedName("");
    setSaveMessage(null);
    setShowModal(false);
    setShowNameGoState(false);
    setIsUndoIconExiting(false);
    writeLifePathFormState({ birthdateInput: "", committedBirthdateInput: "", fullName: "", committedName: "" });

    requestAnimationFrame(() => {
      if (focusTarget === "name") {
        fullNameInputRef.current?.focus();
        return;
      }

      birthdateInputRef.current?.focus();
    });
  };

  const commitBirthdateCalculation = (nextBirthdateInput: string) => {
    const parsedBirthdate = parseBirthdate(nextBirthdateInput);
    if (!parsedBirthdate) {
      setSaveMessage("Add a valid birth date before calculating this side.");
      birthdateInputRef.current?.focus();
      return;
    }

    setBirthdateInput(nextBirthdateInput);
    setCommittedBirthdateInput(nextBirthdateInput);
    setSaveMessage(null);
  };

  const handleBirthdateAction = () => {
    const trimmedBirthdate = birthdateInput.trim();
    const hasCommittedBirthdate = committedBirthdateInput.trim().length > 0;
    const hasDraftBirthdate = trimmedBirthdate.length > 0;
    const isValidDraftBirthdate = Boolean(parseBirthdate(trimmedBirthdate));
    const birthdateNeedsCommit = isValidDraftBirthdate && trimmedBirthdate !== committedBirthdateInput.trim();

    if (!hasDraftBirthdate) {
      const todayBirthdate = formatTodayBirthdate();
      commitBirthdateCalculation(todayBirthdate);

      requestAnimationFrame(() => {
        fullNameInputRef.current?.focus();
      });
      return;
    }

    if (birthdateNeedsCommit) {
      commitBirthdateCalculation(trimmedBirthdate);
      return;
    }

    // Only reset when the draft hasn't changed from the committed value (or there
    // is no draft). If the user has edited the field to an invalid/incomplete
    // date we do nothing — they are still typing and a reset would be destructive.
    const isDraftUnchangedFromCommitted = trimmedBirthdate === committedBirthdateInput.trim();
    if (!hasDraftBirthdate || isDraftUnchangedFromCommitted) {
      if (hasCommittedBirthdate || hasDraftBirthdate) {
        resetDharmaForm();
      }
    }
  };

  const handleBirthdateEnter = () => {
    const trimmedBirthdate = birthdateInput.trim();
    const hasValidBirthdate = Boolean(parseBirthdate(trimmedBirthdate));

    if (hasValidBirthdate && cleanName(fullName)) {
      setCommittedBirthdateInput(trimmedBirthdate);
      setCommittedName(fullName.trim());
      setIsAutoSampleResult(false);
      setShowNameGoState(false);
      setSaveMessage(null);
      setMerkabahSpinKey((currentValue) => currentValue + 1);
      return;
    }

    handleBirthdateAction();
  };

  const resetNameCalculation = () => {
    setFullName("");
    setCommittedName("");
    setSaveMessage(null);
    setShowNameGoState(false);
    setIsUndoIconExiting(false);
    setIsAutoSampleResult(false);

    requestAnimationFrame(() => {
      fullNameInputRef.current?.focus();
    });
  };

  const handleSaveProfile = () => {
    if (hasCommittedBirthdateDetails && hasCommittedNameDetails) {
      resetDharmaForm();
      return;
    }

    if (
      !isAutoSampleResult &&
      committedName.trim() &&
      committedName.trim() === fullName.trim() &&
      committedBirthdateInput.trim() === birthdateInput.trim()
    ) {
      resetNameCalculation();
      return;
    }

    const normalizedDraftName = cleanName(fullName);
    const birthdate = parseBirthdate(birthdateInput);
    const trimmedFullName = fullName.trim();
    const trimmedBirthdate = birthdateInput.trim();

    if (!normalizedDraftName) {
      const currentIndex = DHARMA_SAMPLE_NAMES.indexOf(fullName.trim());
      const nextName = DHARMA_SAMPLE_NAMES[(currentIndex + 1) % DHARMA_SAMPLE_NAMES.length];
      const sampleBirthdate = SAMPLE_PROFILE_BIRTHDATES[nextName] ?? "";

      setFullName(nextName);
      setBirthdateInput(sampleBirthdate);
      setCommittedBirthdateInput(sampleBirthdate);
      setCommittedName(nextName);
      setIsAutoSampleResult(true);
      setShowNameGoState(false);
      setSaveMessage(null);
      setMerkabahSpinKey((currentValue) => currentValue + 1);
      return;
    }

    setCommittedBirthdateInput(birthdate ? trimmedBirthdate : "");
    setCommittedName(trimmedFullName);
    setIsAutoSampleResult(false);
    setShowNameGoState(false);
    setIsUndoIconExiting(true);
    window.setTimeout(() => {
      setIsUndoIconExiting(false);
    }, 220);
    if (birthdate) {
      upsertSavedEntry("dharma", trimmedFullName, normalizedDraftName, trimmedBirthdate);
      onSavedEntriesChange?.();
      setSaveMessage("Saved to your Profiles.");
    } else {
      setSaveMessage(null);
    }
    setMerkabahSpinKey((currentValue) => currentValue + 1);
  };

  const inputClass =
    "accent-focus-input w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] text-gray-900 dark:text-gray-100 outline-none transition-all text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500";

  const trimmedBirthdateInput = birthdateInput.trim();
  const hasCommittedBirthdateDetails = committedBirthdateInput.trim().length > 0;
  const birthdateNeedsCommit =
    trimmedBirthdateInput.length > 0 &&
    Boolean(parseBirthdate(trimmedBirthdateInput)) &&
    trimmedBirthdateInput !== committedBirthdateInput.trim();

  const hasCommittedNameDetails =
    !isAutoSampleResult &&
    committedName.trim().length > 0 &&
    committedName.trim() === fullName.trim() &&
    committedBirthdateInput.trim() === birthdateInput.trim();
  const showNameHistoryState = hasCommittedBirthdateDetails && hasCommittedNameDetails;
  const todayBirthdate = formatTodayBirthdate();
  const showDefaultTodaySummary = Boolean(
    result &&
      !result.hasName &&
      result.hasBirthdate &&
      result.formattedBirthdate === todayBirthdate &&
      prefilledBirthdate === todayBirthdate
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Birth Date MM/DD/YYYY
            </label>
            <div className="flex gap-3">
              <input
                ref={birthdateInputRef}
                type="text"
                inputMode="numeric"
                value={birthdateInput}
                onChange={(event) => setBirthdateInput(formatBirthdateInput(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleBirthdateEnter();
                  }
                }}
                placeholder="MM/DD/YYYY"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleBirthdateAction}
                className="ui-square-button relative overflow-hidden rounded-md border border-[#8D7F62] bg-[#0B0B0B] text-white btn-hover-subtle"
                title={birthdateNeedsCommit ? "Calculate Birth Date Details" : hasCommittedBirthdateDetails || trimmedBirthdateInput ? "Reset Dharma Form" : "Use Today\'s Date"}
                aria-label={birthdateNeedsCommit ? "Calculate Birth Date Details" : hasCommittedBirthdateDetails || trimmedBirthdateInput ? "Reset Dharma Form" : "Use Today\'s Date"}
              >
                <span className="relative mx-auto flex h-5 w-5 items-center justify-center">
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${!birthdateNeedsCommit && !hasCommittedBirthdateDetails && !trimmedBirthdateInput ? "opacity-100" : "opacity-0 scale-75"}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                      <circle cx="12" cy="11" r="2.5" />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${birthdateNeedsCommit ? "refresh-icon-enter opacity-100" : "refresh-icon-exit"}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 6 6 6-6 6" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${!birthdateNeedsCommit && (hasCommittedBirthdateDetails || trimmedBirthdateInput) && !showNameHistoryState ? "opacity-100" : "opacity-0 scale-75"}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 10v6" />
                      <path d="M14 10v6" />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${showNameHistoryState ? "opacity-100" : "opacity-0 scale-75"}`}
                  >
                    <MerkabahIcon3D spinKey={0} joltKey={0} className="h-5 w-5" />
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Birth Name
            </label>
            <div className="flex gap-3">
              <input
                ref={fullNameInputRef}
                type="text"
                value={fullName}
                onChange={(event) => {
                  setIsAutoSampleResult(false);

                  if (event.target.value.length > fullName.length) {
                    setMerkabahJoltKey((currentValue) => currentValue + 1);
                  }

                  setFullName(event.target.value);
                  if (saveMessage) {
                    setSaveMessage(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && cleanName(fullName)) {
                    event.preventDefault();
                    handleSaveProfile();
                  }
                }}
                placeholder="Enter your full birth name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                className="ui-square-button relative overflow-hidden rounded-md border border-[#8D7F62] bg-[#0B0B0B] text-white btn-hover-subtle"
                title={showNameHistoryState ? "Open Saved Profiles" : hasCommittedNameDetails ? "Reset Birth Name Calculation" : showNameGoState ? "Move Forward" : "Prepare Dharma Chart"}
                aria-label={showNameHistoryState ? "Open Saved Profiles" : hasCommittedNameDetails ? "Reset Birth Name Calculation" : showNameGoState ? "Move Forward" : "Prepare Dharma Chart"}
              >
                <span className="relative flex h-6 w-10 items-center justify-center">
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${!hasCommittedNameDetails && !showNameGoState ? "opacity-100" : "opacity-0 scale-75"}`}
                  >
                    <MerkabahIcon3D spinKey={merkabahSpinKey} joltKey={merkabahJoltKey} className="h-6 w-6" />
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${showNameGoState ? "refresh-icon-enter opacity-100" : hasCommittedNameDetails ? "opacity-0 scale-75" : "refresh-icon-exit"}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 6 6 6-6 6" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${hasCommittedNameDetails ? `opacity-100 ${isUndoIconExiting ? "refresh-icon-enter" : ""}` : showNameGoState ? "opacity-0 scale-75" : "refresh-icon-exit"}`}
                  >
                    {showNameHistoryState ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 10v6" />
                        <path d="M14 10v6" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 7 4 12l5 5" />
                        <path d="M5 12h8a6 6 0 0 1 6 6" />
                      </svg>
                    )}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#8D7F62]/30 bg-gray-50 dark:bg-[#0B0B0B] p-4 text-sm text-gray-500 dark:text-gray-400">
          {result && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                {result.hasBirthdate && (
                  <p>
                  {showDefaultTodaySummary ? "Today's Date:" : "Birthdate:"}{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{result.formattedBirthdate}</span>
                  </p>
                )}
                {(result.hasName || showDefaultTodaySummary) && (
                  <p>
                  {showDefaultTodaySummary ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = "#calendar";
                      }}
                      className="group transition-colors hover:text-[#8D7F62]"
                    >
                      <span>Calendar Page:</span>{" "}
                      <span className="font-semibold text-gray-900 group-hover:text-[#8D7F62] dark:text-white">
                        Explore More Dates <span className="text-[#8D7F62] group-hover:text-[#8D7F62]">&gt;&gt;</span>
                      </span>
                    </button>
                  ) : (
                    <>
                    Full Birth Name:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">{result.displayName}</span>
                    </>
                  )}
                  </p>
                )}
              </div>
              {result.normalizedName === TESLA_SAMPLE_NAME && (
                <p className="text-xs leading-relaxed text-[#8D7F62]">
                  Historical note: Tesla is often listed as July 10, 1856 because that is the Gregorian conversion, but his recorded birth date was June 28, 1856 on the Julian calendar. This sample uses his full birth name, Nikola Milutinov Tesla, with the original Julian-calendar date.
                </p>
              )}
            </div>
          )}
          <p className={result ? "mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 leading-relaxed" : "leading-relaxed"}>
            Use your complete birth name for an accurate Complete Numerology Profile (destiny / expression, soul urge, and personality number). You can just add your birthday if you only want to see your full Life Path calculation.
          </p>
          {saveMessage && (
            <p className="mt-3 text-xs text-[#8D7F62]">
              {saveMessage}
            </p>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs tracking-[0.35em] uppercase text-gray-500 dark:text-gray-400">
              {result.hasName && result.hasBirthdate
                ? "Complete Numerology Profile"
                : result.hasName
                  ? "Birth Name Energies"
                  : "LIFE PATH ENERGIES"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-stretch justify-center">
            {cards.map((card, index) => (
              <div
                key={card.key}
                ref={(element) => {
                  profileCardRefs.current[index] = element;
                }}
                style={profileCardHeight ? { height: `${profileCardHeight}px` } : undefined}
                className="mx-auto flex h-full w-full max-w-sm flex-col rounded-lg border border-[#8D7F62]/40 bg-white dark:bg-[#0B0B0B] p-5 text-center shadow-lg"
              >
                {card.label && (
                  <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
                )}
                <div className="flex flex-1 flex-col justify-center w-full">
                  {card.label && (
                    <div className="sr-only">{card.label}</div>
                  )}
                  <div className={card.valueClassName ?? "mt-4 text-4xl font-extrabold text-gray-900 dark:text-white mystical-title leading-none"}>
                    {card.value}
                  </div>
                  {card.title && <p className="mt-4 text-sm font-semibold text-[#8D7F62]">{card.title}</p>}
                  {card.detail && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.detail}</div>}
                  {card.note && (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
                      {card.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && desc && (
        <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Your Life Path number is the anchor of this calculation. It comes from your birth date and shows the core direction, gifts, and lessons that repeat across the rest of your chart.
          </p>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
              {desc.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {desc.body}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full mt-2 btn-accent font-medium py-3 px-4 rounded-md transition-colors text-sm"
          >
            I&apos;d like to get Deeper Guidance →
          </button>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-[#171717] rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Deeper Guidance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon - personalised readings and guidance will be available here.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="btn-accent px-6 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
