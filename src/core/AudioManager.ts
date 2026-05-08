const BASE = import.meta.env.BASE_URL;

type SfxName =
  | 'page_turn'
  | 'book_select'
  | 'book_use'
  | 'move_node'
  | 'success'
  | 'super_match'
  | 'fail'
  | 'hp_loss'
  | 'gain_book'
  | 'ui_click';

type BgmName = 'menu' | 'explore' | 'tension' | 'ending';

const SFX_FILES: Record<SfxName, string> = {
  page_turn: 'sfx/page_turn.mp3',
  book_select: 'sfx/book_select.mp3',
  book_use: 'sfx/book_use.mp3',
  move_node: 'sfx/move_node.mp3',
  success: 'sfx/success.mp3',
  super_match: 'sfx/super_match.mp3',
  fail: 'sfx/fail.mp3',
  hp_loss: 'sfx/hp_loss.mp3',
  gain_book: 'sfx/gain_book.mp3',
  ui_click: 'sfx/ui_click.mp3',
};

const BGM_FILES: Record<BgmName, string> = {
  menu: 'bgm/menu.mp3',
  explore: 'bgm/explore.mp3',
  tension: 'bgm/tension.mp3',
  ending: 'bgm/ending.mp3',
};

const sfxCache = new Map<string, HTMLAudioElement>();
let currentBgm: HTMLAudioElement | null = null;
let currentBgmName: BgmName | null = null;
let masterVolume = 0.7;
let sfxVolume = 0.8;
let bgmVolume = 0.4;
let muted = false;

function audioPath(file: string): string {
  return `${BASE}audio/${file}`;
}

function getEffectiveVolume(base: number): number {
  return muted ? 0 : base * masterVolume;
}

export function playSfx(name: SfxName): void {
  const file = SFX_FILES[name];
  if (!file) return;

  let audio = sfxCache.get(name);
  if (!audio) {
    audio = new Audio(audioPath(file));
    audio.preload = 'auto';
    sfxCache.set(name, audio);
  }

  audio.volume = getEffectiveVolume(sfxVolume);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function playBgm(name: BgmName): void {
  if (currentBgmName === name && currentBgm && !currentBgm.paused) return;

  stopBgm();

  const file = BGM_FILES[name];
  if (!file) return;

  const audio = new Audio(audioPath(file));
  audio.loop = name !== 'ending';
  audio.volume = getEffectiveVolume(bgmVolume);
  audio.play().catch(() => {});

  currentBgm = audio;
  currentBgmName = name;
}

export function stopBgm(): void {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = null;
    currentBgmName = null;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
  if (currentBgm) {
    currentBgm.volume = getEffectiveVolume(bgmVolume);
  }
  localStorage.setItem('bookgame_muted', value ? '1' : '0');
}

export function isMuted(): boolean {
  return muted;
}

export function initAudioPreference(): void {
  const saved = localStorage.getItem('bookgame_muted');
  if (saved === '1') muted = true;
}

export type { SfxName, BgmName };
