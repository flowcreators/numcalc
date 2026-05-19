export type SavedEntryKind = "calculator" | "dharma";

export type SavedEntryRecord = {
  id: string;
  kind: SavedEntryKind;
  displayName: string;
  normalizedName: string;
  birthdate: string;
  createdAt: string;
  updatedAt: string;
};

type LegacySavedProfileRecord = {
  displayName: string;
  normalizedName: string;
  birthdate: string;
  firstEnteredAt: string;
  lastEnteredAt: string;
};

export const SAVED_ENTRIES_STORAGE_KEY = "numcalc-saved-entries";
const LEGACY_PROFILE_STORAGE_KEY = "numcalc-saved-profiles";
const SAVED_ENTRIES_COOKIE_NAME = "numcalc-saved-entries";

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const writeCookieValue = (name: string, value: string) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

const buildEntryId = (kind: SavedEntryKind, normalizedName: string, birthdate: string) =>
  `${kind}:${normalizedName}:${birthdate || "-"}`;

const normalizeEntries = (value: unknown): SavedEntryRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is SavedEntryRecord => {
    return Boolean(
      entry &&
      typeof entry === "object" &&
      typeof (entry as SavedEntryRecord).id === "string" &&
      ((entry as SavedEntryRecord).kind === "calculator" || (entry as SavedEntryRecord).kind === "dharma") &&
      typeof (entry as SavedEntryRecord).displayName === "string" &&
      typeof (entry as SavedEntryRecord).normalizedName === "string" &&
      typeof (entry as SavedEntryRecord).birthdate === "string" &&
      typeof (entry as SavedEntryRecord).createdAt === "string" &&
      typeof (entry as SavedEntryRecord).updatedAt === "string"
    );
  });
};

const parseSavedEntries = (raw: string | null) => {
  if (!raw) {
    return [];
  }

  try {
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
};

const readLegacyEntries = (): SavedEntryRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Record<string, LegacySavedProfileRecord>;
    if (!parsed || typeof parsed !== "object") {
      return [];
    }

    return Object.values(parsed)
      .filter((entry) => entry && typeof entry.displayName === "string" && typeof entry.normalizedName === "string")
      .map((entry) => ({
        id: buildEntryId("dharma", entry.normalizedName, entry.birthdate || ""),
        kind: "dharma" as const,
        displayName: entry.displayName,
        normalizedName: entry.normalizedName,
        birthdate: entry.birthdate || "",
        createdAt: entry.firstEnteredAt || entry.lastEnteredAt || new Date().toISOString(),
        updatedAt: entry.lastEnteredAt || entry.firstEnteredAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
};

export const writeSavedEntries = (entries: SavedEntryRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(entries);
  window.localStorage.setItem(SAVED_ENTRIES_STORAGE_KEY, serialized);
  writeCookieValue(SAVED_ENTRIES_COOKIE_NAME, serialized);
};

export const readSavedEntries = (): SavedEntryRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const localEntries = parseSavedEntries(window.localStorage.getItem(SAVED_ENTRIES_STORAGE_KEY));
  const cookieEntries = parseSavedEntries(getCookieValue(SAVED_ENTRIES_COOKIE_NAME));
  const legacyEntries = readLegacyEntries();

  const merged = [...localEntries, ...cookieEntries, ...legacyEntries].reduce<Record<string, SavedEntryRecord>>((accumulator, entry) => {
    const existing = accumulator[entry.id];
    if (!existing || existing.updatedAt < entry.updatedAt) {
      accumulator[entry.id] = entry;
    }
    return accumulator;
  }, {});

  const sorted = Object.values(merged).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  if (sorted.length !== localEntries.length || sorted.some((entry, index) => localEntries[index]?.id !== entry.id)) {
    writeSavedEntries(sorted);
  }

  return sorted;
};

export const upsertSavedEntry = (kind: SavedEntryKind, displayName: string, normalizedName: string, birthdate = "") => {
  const trimmedDisplayName = displayName.trim();
  const trimmedNormalizedName = normalizedName.trim();
  const trimmedBirthdate = birthdate.trim();

  if (!trimmedDisplayName || !trimmedNormalizedName) {
    return [];
  }

  const now = new Date().toISOString();
  const nextEntry: SavedEntryRecord = {
    id: buildEntryId(kind, trimmedNormalizedName, trimmedBirthdate),
    kind,
    displayName: trimmedDisplayName,
    normalizedName: trimmedNormalizedName,
    birthdate: trimmedBirthdate,
    createdAt: now,
    updatedAt: now,
  };

  const currentEntries = readSavedEntries();
  const existingEntry = currentEntries.find((entry) => entry.id === nextEntry.id);
  const nextEntries = [
    {
      ...nextEntry,
      createdAt: existingEntry?.createdAt ?? now,
    },
    ...currentEntries.filter((entry) => entry.id !== nextEntry.id),
  ];

  writeSavedEntries(nextEntries);
  return nextEntries;
};
