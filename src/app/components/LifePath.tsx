"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

type ProfileResult = {
  normalizedName: string;
  displayName: string;
  formattedBirthdate: string;
  birthdate: ParsedDate;
  hasName: boolean;
  lifePath: LifePathValue;
  personalYear: { raw: number; final: number; referenceYear: number };
  lunarLifePath: LifePathValue & {
    lunarMonth: number;
    lunarDay: number;
    lunarYear: number;
  };
  expression: { raw: number; final: number };
  soulUrge: { raw: number; final: number };
  personality: { raw: number; final: number };
  birthDay: { raw: number; final: number };
  maturity: { raw: number; final: number };
  dayOfYear: { raw: number; final: number };
  yearEnergy: { raw: number; final: number };
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

type SavedProfileRecord = {
  displayName: string;
  normalizedName: string;
  birthdate: string;
  firstEnteredAt: string;
  lastEnteredAt: string;
};

const PROFILE_STORAGE_KEY = "numcalc-saved-profiles";
const LIFE_PATH_FORM_STORAGE_KEY = "numcalc-life-path-form";
const LIFE_PATH_FORM_COOKIE_NAME = "numcalc-life-path-form";

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
      fullName?: string;
      committedName?: string;
    };

    return {
      birthdateInput: typeof parsed.birthdateInput === "string" ? parsed.birthdateInput : "",
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      committedName: typeof parsed.committedName === "string" ? parsed.committedName : "",
    };
  } catch {
    return null;
  }
};

const writeLifePathFormState = (value: { birthdateInput: string; fullName: string; committedName: string }) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!value.birthdateInput && !value.fullName && !value.committedName) {
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
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
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

const buildReductionDetail = (raw: number, final: number) =>
  raw === final ? `Final: ${final}` : `Reduced: ${raw} -> ${final}`;

const buildCompoundValue = (raw: number, final: number) =>
  raw === final ? `${final}` : `${raw}/${final}`;

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

const getProfileTitle = (value: number) => PROFILE_TITLES[value] ?? "Numerology Insight";

const readSavedProfiles = (): Record<string, SavedProfileRecord> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, SavedProfileRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeSavedProfiles = (profiles: Record<string, SavedProfileRecord>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

type LifePathProps = {
  prefilledBirthdate?: string;
  resetSignal?: number;
};

export default function LifePath({ prefilledBirthdate = "", resetSignal = 0 }: LifePathProps) {
  const [fullName, setFullName] = useState("");
  const [committedName, setCommittedName] = useState("");
  const [birthdateInput, setBirthdateInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const lastAppliedPrefilledBirthdate = useRef("");
  const hasLoadedSavedFormState = useRef(false);

  useEffect(() => {
    const savedState = readLifePathFormState();
    if (savedState) {
      setBirthdateInput(savedState.birthdateInput);
      setFullName(savedState.fullName);
      setCommittedName(savedState.committedName);
    }

    hasLoadedSavedFormState.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedFormState.current) {
      return;
    }

    writeLifePathFormState({ birthdateInput, fullName, committedName });
  }, [birthdateInput, committedName, fullName]);

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }

    lastAppliedPrefilledBirthdate.current = "";
    setBirthdateInput("");
    setFullName("");
    setCommittedName("");
    setSaveMessage(null);
    setShowModal(false);
    writeLifePathFormState({ birthdateInput: "", fullName: "", committedName: "" });
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

  const result = useMemo<ProfileResult | null>(() => {
    const normalizedName = cleanName(committedName);
    const birthdate = parseBirthdate(birthdateInput);

    if (!birthdate) {
      return null;
    }

    const hasName = normalizedName.length > 0;

    const expressionRaw = hasName ? sumLetters(normalizedName, () => true) : 0;
    const soulUrgeRaw = hasName ? sumLetters(normalizedName, (character) => VOWELS.has(character)) : 0;
    const personalityRaw = hasName ? sumLetters(normalizedName, (character) => !VOWELS.has(character)) : 0;
    const birthDayRaw = birthdate.day;
    const dayOfYearRaw = getDayOfYear(birthdate.date);
    const yearEnergyRaw = birthdate.year;
    const referenceYear = new Date().getFullYear();
    const personalYearRaw = birthdate.month + birthdate.day + digitSum(referenceYear);

    const expressionFinal = hasName ? reduceToSingleDigit(expressionRaw) : 0;
    const lifePath = buildLifePathValue(birthdate.month, birthdate.day, birthdate.year);
    const maturityRaw = hasName ? expressionFinal + lifePath.final : 0;
    const lunarDate = getLunarDateParts(birthdate.date);

    if (!lunarDate) {
      return null;
    }

    return {
      normalizedName,
      displayName: committedName.trim(),
      formattedBirthdate: birthdateInput,
      birthdate,
      hasName,
      lifePath,
      personalYear: {
        raw: personalYearRaw,
        final: reduceToCoreDigit(personalYearRaw),
        referenceYear,
      },
      lunarLifePath: {
        ...buildLifePathValue(lunarDate.month, lunarDate.day, lunarDate.year),
        lunarMonth: lunarDate.month,
        lunarDay: lunarDate.day,
        lunarYear: lunarDate.year,
      },
      expression: { raw: expressionRaw, final: expressionFinal },
      soulUrge: { raw: soulUrgeRaw, final: hasName ? reduceToSingleDigit(soulUrgeRaw) : 0 },
      personality: { raw: personalityRaw, final: hasName ? reduceToSingleDigit(personalityRaw) : 0 },
      birthDay: { raw: birthDayRaw, final: reduceToCoreDigit(birthDayRaw) },
      maturity: { raw: maturityRaw, final: hasName ? reduceToSingleDigit(maturityRaw) : 0 },
      dayOfYear: { raw: dayOfYearRaw, final: reduceToCoreDigit(dayOfYearRaw) },
      yearEnergy: { raw: digitSum(yearEnergyRaw), final: reduceToCoreDigit(digitSum(yearEnergyRaw)) },
    };
  }, [birthdateInput, committedName]);

  const desc = result ? DESCRIPTIONS[result.lifePath.final] : null;

  const cards: CardData[] = result
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
                key: "personal-year",
                label: "Personal Year",
                value: buildCompoundValue(result.personalYear.raw, result.personalYear.final),
                title: getProfileTitle(result.personalYear.final),
                detail: `${result.birthdate.month}+${result.birthdate.day}+${digitSum(result.personalYear.referenceYear)} = ${result.personalYear.raw} -> ${result.personalYear.final}`,
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
              {
                key: "maturity",
                label: "Maturity",
                value: result.maturity.final,
                title: getProfileTitle(result.maturity.final),
                detail: buildReductionDetail(result.maturity.raw, result.maturity.final),
              },
              {
                key: "lunar-life-path",
                label: "Lunar Life Path",
                value: result.lunarLifePath.display,
                title: getProfileTitle(result.lunarLifePath.final),
                detail: `Month: ${result.lunarLifePath.lunarMonth}, Day: ${result.lunarLifePath.lunarDay}, Year: ${result.lunarLifePath.lunarYear}`,
              },
            ]
          : []),
      ]
    : [];

  const handleSaveProfile = () => {
    const normalizedDraftName = cleanName(fullName);
    const birthdate = parseBirthdate(birthdateInput);

    if (!birthdate || !normalizedDraftName) {
      setSaveMessage("Add a full birth name and valid birth date before saving.");
      return;
    }

    setCommittedName(fullName.trim());

    const profiles = readSavedProfiles();
    const now = new Date().toISOString();
    const existing = profiles[normalizedDraftName];

    profiles[normalizedDraftName] = {
      displayName: fullName.trim(),
      normalizedName: normalizedDraftName,
      birthdate: birthdateInput,
      firstEnteredAt: existing?.firstEnteredAt ?? now,
      lastEnteredAt: now,
    };

    writeSavedProfiles(profiles);
    setSaveMessage(existing ? "Profile updated in saved records." : "Profile saved to local records.");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] text-gray-900 dark:text-gray-100 outline-none focus:border-green-400/40 focus:shadow-[0_0_8px_rgba(0,255,0,0.20)] transition-all text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Birth Date MM/DD/YYYY
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={birthdateInput}
              onChange={(event) => setBirthdateInput(formatBirthdateInput(event.target.value))}
              placeholder="MM/DD/YYYY"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Birth Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  if (saveMessage) {
                    setSaveMessage(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && parseBirthdate(birthdateInput) && cleanName(fullName)) {
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
                disabled={!parseBirthdate(birthdateInput) || !cleanName(fullName)}
                className="btn-accent min-w-20 rounded-md px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-[#111111] disabled:text-gray-500"
              >
                GO
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#8D7F62]/30 bg-gray-50 dark:bg-[#0B0B0B] p-4 text-sm text-gray-500 dark:text-gray-400">
          {result && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p>
                Birthdate:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{result.formattedBirthdate}</span>
              </p>
              {result.hasName && (
                <p>
                  Full Birth Name:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{result.displayName}</span>
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
              {result.hasName ? "Complete Numerology Profile" : "LIFE PATH ENERGIES"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-stretch justify-center">
            {cards.map((card) => (
              <div
                key={card.key}
                className="mx-auto flex h-full w-full max-w-sm flex-col rounded-lg border border-[#8D7F62]/40 bg-white dark:bg-[#0B0B0B] p-5 text-center shadow-lg"
              >
                {card.label && (
                  <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                    {card.label}
                  </p>
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
