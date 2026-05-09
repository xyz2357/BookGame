const STORAGE_KEY = 'bookgame_debug_flags';

export interface DebugFlags {
  portraitOverlay: boolean;
}

const defaults: DebugFlags = {
  portraitOverlay: false,
};

let flags: DebugFlags = { ...defaults };

export function loadDebugFlags(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      flags = { ...defaults, ...saved };
    }
  } catch {
    flags = { ...defaults };
  }
}

export function getDebugFlags(): DebugFlags {
  return flags;
}

export function setDebugFlag<K extends keyof DebugFlags>(key: K, value: DebugFlags[K]): void {
  flags = { ...flags, [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {}
}

export function resetDebugFlags(): void {
  flags = { ...defaults };
  localStorage.removeItem(STORAGE_KEY);
}

loadDebugFlags();
