"use client";

import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const MASTER = new Set([11, 22, 33]);

const reduceToSingleDigit = (n: number): number => {
  if (MASTER.has(n)) return n;
  if (n < 10) return n;
  const s = String(n).split("").reduce((a, d) => a + parseInt(d), 0);
  if (MASTER.has(s)) return s;
  return s > 9 ? reduceToSingleDigit(s) : s;
};

/** Return all individual digit characters for a zero-padded string. */
const digitsOf = (n: number, pad: number) =>
  String(n).padStart(pad, "0").split("").map(Number);

/* ------------------------------------------------------------------ */
/*  Life Path descriptions                                            */
/* ------------------------------------------------------------------ */

const DESCRIPTIONS: Record<number, { title: string; body: string }> = {
  1: {
    title: "The Leader",
    body: "You are a natural-born pioneer — independent, ambitious, and built to forge your own trail. Your greatest gift is the courage to stand alone and initiate what others only imagine.",
  },
  2: {
    title: "The Diplomat",
    body: "Cooperation is your superpower. You bring balance, sensitivity, and grace to every relationship. You thrive when building bridges and helping others find common ground.",
  },
  3: {
    title: "The Communicator",
    body: "Creative, expressive, and magnetic — you were born to inspire. Your words, art, or presence light up every room. Joy is both your gift to the world and your greatest teacher.",
  },
  4: {
    title: "The Builder",
    body: "You are the architect of lasting things. Through discipline, integrity, and tireless effort you construct what others only dream about. Stability is your foundation and your legacy.",
  },
  5: {
    title: "The Freedom Seeker",
    body: "Change is your oxygen. Versatile, daring, and magnetic, you are here to explore every dimension of human experience — and to show others that life is meant to be lived fully.",
  },
  6: {
    title: "The Nurturer",
    body: "Your heart is your compass. Devoted, compassionate, and deeply responsible, you create love and safety wherever you go. Family, community, and service are the pillars of your purpose.",
  },
  7: {
    title: "The Seeker",
    body: "You are wired for depth. Introspective, analytical, and spiritually tuned, you search beneath the surface of everything. Your path leads inward — and that inner knowing is your greatest gift.",
  },
  8: {
    title: "The Achiever",
    body: "Power and purpose are your birthright. You have an extraordinary capacity to build wealth, authority, and influence — and your highest calling is to use that power with wisdom and integrity.",
  },
  9: {
    title: "The Humanitarian",
    body: "You are here to give. Compassionate, idealistic, and globally minded, you carry a deep calling to uplift humanity. Your greatest fulfilment comes through selfless service and unconditional love.",
  },
  11: {
    title: "The Intuitive — Master Number 11",
    body: "You are a spiritual messenger. Highly sensitive and intuitively gifted, you arrived with a rare ability to tune into higher frequencies. Your path is to channel that vision and illuminate others.",
  },
  22: {
    title: "The Master Builder — Master Number 22",
    body: "You hold the most powerful life path of all. You have the vision of an 11 and the grounded mastery of a 4 — the unique capacity to turn the most ambitious dreams into lasting, real-world reality.",
  },
  33: {
    title: "The Master Teacher — Master Number 33",
    body: "The rarest and most spiritually elevated path. You are a beacon of healing, compassion, and unconditional love. Your purpose is to raise the consciousness of those around you through pure example.",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function LifePath() {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [showModal, setShowModal] = useState(false);

  const result = useMemo(() => {
    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    if (
      !month || !day || !year ||
      isNaN(m) || isNaN(d) || isNaN(y) ||
      year.length !== 4 ||
      m < 1 || m > 12 ||
      d < 1 || d > 31
    ) return null;

    // Flatten all digits: e.g. 10/06/1997 → [1,0,0,6,1,9,9,7]
    const digits = [
      ...digitsOf(m, 2),
      ...digitsOf(d, 2),
      ...digitsOf(y, 4),
    ];

    const sum = digits.reduce((a, v) => a + v, 0);
    const lifePathNumber = reduceToSingleDigit(sum);
    const isMaster = MASTER.has(lifePathNumber);

    return { digits, sum, lifePathNumber, isMaster };
  }, [month, day, year]);

  const handleMonthChange = (v: string) => {
    if (/^\d{0,2}$/.test(v)) setMonth(v);
  };
  const handleDayChange = (v: string) => {
    if (/^\d{0,2}$/.test(v)) setDay(v);
  };
  const handleYearChange = (v: string) => {
    if (/^\d{0,4}$/.test(v)) setYear(v);
  };

  const desc = result ? DESCRIPTIONS[result.lifePathNumber] : null;

  const inputClass =
    "w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B0B0B] text-gray-900 dark:text-gray-100 outline-none focus:border-green-400/40 focus:shadow-[0_0_8px_rgba(0,255,0,0.20)] transition-all text-center text-lg font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enter your birthdate:
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Let&apos;s uncover your natural gifts.</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD"
            maxLength={2}
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="YYYY"
            maxLength={4}
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className={inputClass}
          />
        </div>

        {result && (
          <div className="bg-gray-50 dark:bg-[#0B0B0B] rounded-lg p-5 space-y-3 text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              Your Birthdate:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {month.padStart(2, "0")}/{day.padStart(2, "0")}/{year}
              </span>
            </p>

            <p className="text-gray-500 dark:text-gray-400">
              Breakdown:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {result.digits.join(" + ")}
              </span>
            </p>

            <p className="text-gray-500 dark:text-gray-400">
              Sum:{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {result.sum}
              </span>
            </p>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <p className="text-gray-500 dark:text-gray-400">
                Final Step:{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {result.lifePathNumber}
                  {result.isMaster && (
                    <>
                      {" "}
                      <span className="text-yellow-500">(Master Number)</span>
                      <span
                        className="inline-block ml-1 w-4 h-4 rounded-full bg-yellow-400 text-black text-[10px] font-bold text-center leading-4 cursor-help align-middle"
                        title="Master numbers (11, 22, 33) are never reduced further — they carry heightened spiritual vibration."
                      >
                        i
                      </span>
                    </>
                  )}
                </span>
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <p className="text-base font-semibold text-[#8D7F62] dark:text-[#8D7F62]">
                Your Life Path Number is {result.lifePathNumber}
                {result.isMaster && (
                  <span
                    className="inline-block ml-1.5 w-4 h-4 rounded-full bg-yellow-400 text-black text-[10px] font-bold text-center leading-4 cursor-help align-middle"
                    title="Master Number — a powerful numerological vibration"
                  >
                    !
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {result && desc && (
        <div className="bg-white dark:bg-[#171717] rounded-lg shadow-lg p-6 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Your Life Path number is the most significant number in your numerology chart. Derived from your full birth date, it reveals your core purpose, innate talents, and the unique path your soul chose for this lifetime. It&apos;s not who you will become — it&apos;s who you already are.
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

      {/* ---- Modal ------------------------------------------------- */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-[#171717] rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Deeper Guidance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coming soon — personalised readings and guidance will be available here.
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
