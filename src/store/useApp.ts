/**
 * Uygulama durumu: profiller, her profilin ilerlemesi ve ayarlar. Tarayıcıda (localStorage) saklanır;
 * hiçbir veri cihazdan çıkmaz.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bandOfAge, type Band } from '../tricks/types';
import { dayKey } from '../lib/util';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  band: Band;
  createdAt: number;
}

export interface TrickProgress {
  /** En iyi yıldız (0-3). */
  best: number;
  plays: number;
  /** Zorluk seviyesi (1-3); 3 yıldızla yükselir. */
  level: number;
}

export interface DayLog {
  solved: number;
  correct: number;
  quest?: boolean;
}

export interface ProfileData {
  stars: number;
  tricks: Record<string, TrickProgress>;
  days: Record<string, DayLog>;
  records: Record<string, number>;
  badges: string[];
  newBadges: string[];
  solved: number;
  words: number;
}

export interface Settings {
  sfx: boolean;
  narration: boolean;
  rate: number;
}

interface State {
  profiles: Profile[];
  activeId: string | null;
  data: Record<string, ProfileData>;
  settings: Settings;
  addProfile: (p: { name: string; avatar: string; age: number }) => void;
  setActive: (id: string) => void;
  updateProfile: (id: string, patch: Partial<Pick<Profile, 'name' | 'avatar' | 'age'>>) => void;
  removeProfile: (id: string) => void;
  setSettings: (s: Partial<Settings>) => void;
  /** Bir soru çözüldü (doğru ya da iskeleyle). */
  logSolve: (correct: boolean) => void;
  /** Ders bitti: yıldız kaydı, seviye ve cüzdan. */
  finishTrick: (id: string, stars: number) => { levelUp: boolean };
  addStars: (n: number) => void;
  setRecord: (game: string, v: number, lowerIsBetter?: boolean) => boolean;
  markQuest: () => void;
  markWord: () => void;
  consumeBadges: () => void;
}

export const emptyData = (): ProfileData => ({ stars: 0, tricks: {}, days: {}, records: {}, badges: [], newBadges: [], solved: 0, words: 0 });

/** Rozet koşulları (her güncellemede kontrol edilir). */
export const BADGES: { id: string; emoji: string; title: string; desc: string; test: (d: ProfileData) => boolean }[] = [
  { id: 'ilk-ders', emoji: '🌱', title: 'İlk Adım', desc: 'İlk püf noktasını bitir', test: (d) => Object.keys(d.tricks).length >= 1 },
  { id: 'uc-yildiz', emoji: '⭐', title: 'Üç Yıldız', desc: 'Bir dersten 3 yıldız al', test: (d) => Object.values(d.tricks).some((t) => t.best >= 3) },
  { id: 'bes-puf', emoji: '💡', title: 'Püf Avcısı', desc: '5 farklı püf noktası öğren', test: (d) => Object.keys(d.tricks).length >= 5 },
  { id: 'on-puf', emoji: '🧠', title: 'Zihin Ustası', desc: '10 farklı püf noktası öğren', test: (d) => Object.keys(d.tricks).length >= 10 },
  { id: 'elli-soru', emoji: '🎯', title: 'Elli Soru', desc: '50 soru çöz', test: (d) => d.solved >= 50 },
  { id: 'iki-yuz', emoji: '🚀', title: 'Roket', desc: '200 soru çöz', test: (d) => d.solved >= 200 },
  { id: 'problem-5', emoji: '🧩', title: 'Problem Çözücü', desc: '5 sözel problem çöz', test: (d) => d.words >= 5 },
  { id: 'problem-20', emoji: '🏗️', title: 'Çubuk Modeli Ustası', desc: '20 sözel problem çöz', test: (d) => d.words >= 20 },
  { id: 'seri-3', emoji: '🔥', title: '3 Gün Seri', desc: '3 gün üst üste çalış', test: (d) => streak(d.days) >= 3 },
  { id: 'seri-7', emoji: '🏆', title: 'Haftalık Kahraman', desc: '7 gün üst üste çalış', test: (d) => streak(d.days) >= 7 },
  { id: 'simsek', emoji: '⚡', title: 'Şimşek', desc: 'Şimşek Tur\'da 15 doğru', test: (d) => (d.records.simsek ?? 0) >= 15 },
  { id: 'yuz-yildiz', emoji: '🌟', title: 'Yıldız Toplayıcı', desc: '100 yıldız biriktir', test: (d) => d.stars >= 100 },
];

function streak(days: Record<string, unknown>) {
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function withBadges(d: ProfileData): ProfileData {
  const won = BADGES.filter((b) => !d.badges.includes(b.id) && b.test(d)).map((b) => b.id);
  if (!won.length) return d;
  return { ...d, badges: [...d.badges, ...won], newBadges: [...d.newBadges, ...won] };
}

export const useApp = create<State>()(
  persist(
    (set, get) => {
      /** Aktif profilin verisini değiştirir, rozetleri kontrol eder. */
      const mutate = (f: (d: ProfileData) => ProfileData) => {
        const id = get().activeId;
        if (!id) return;
        set((s) => ({ data: { ...s.data, [id]: withBadges(f(s.data[id] ?? emptyData())) } }));
      };
      const today = (d: ProfileData): DayLog => d.days[dayKey()] ?? { solved: 0, correct: 0 };
      return {
        profiles: [],
        activeId: null,
        data: {},
        settings: { sfx: true, narration: true, rate: 1 },
        addProfile: ({ name, avatar, age }) => {
          const id = Math.random().toString(36).slice(2, 10);
          const p: Profile = { id, name, avatar, age, band: bandOfAge(age), createdAt: Date.now() };
          set((s) => ({ profiles: [...s.profiles, p], activeId: id, data: { ...s.data, [id]: emptyData() } }));
        },
        setActive: (id) => set({ activeId: id }),
        updateProfile: (id, patch) =>
          set((s) => ({
            profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch, band: patch.age ? bandOfAge(patch.age) : p.band } : p)),
          })),
        removeProfile: (id) =>
          set((s) => {
            const profiles = s.profiles.filter((p) => p.id !== id);
            const data = { ...s.data };
            delete data[id];
            return { profiles, data, activeId: s.activeId === id ? profiles[0]?.id ?? null : s.activeId };
          }),
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        logSolve: (correct) =>
          mutate((d) => {
            const t = today(d);
            return { ...d, solved: d.solved + 1, days: { ...d.days, [dayKey()]: { ...t, solved: t.solved + 1, correct: t.correct + (correct ? 1 : 0) } } };
          }),
        finishTrick: (id, stars) => {
          let levelUp = false;
          mutate((d) => {
            const prev = d.tricks[id] ?? { best: 0, plays: 0, level: 1 };
            const level = stars >= 3 && prev.level < 3 ? prev.level + 1 : prev.level;
            levelUp = level > prev.level;
            const t = today(d);
            return {
              ...d,
              stars: d.stars + stars,
              tricks: { ...d.tricks, [id]: { best: Math.max(prev.best, stars), plays: prev.plays + 1, level } },
              days: { ...d.days, [dayKey()]: t },
            };
          });
          return { levelUp };
        },
        addStars: (n) => mutate((d) => ({ ...d, stars: d.stars + n })),
        setRecord: (game, v, lower = false) => {
          const id = get().activeId;
          const prev = id ? get().data[id]?.records[game] : undefined;
          const better = prev === undefined || (lower ? v < prev : v > prev);
          if (better) mutate((d) => ({ ...d, records: { ...d.records, [game]: v } }));
          return better && prev !== undefined;
        },
        markQuest: () => mutate((d) => ({ ...d, days: { ...d.days, [dayKey()]: { ...today(d), quest: true } } })),
        markWord: () => mutate((d) => ({ ...d, words: d.words + 1, days: { ...d.days, [dayKey()]: today(d) } })),
        consumeBadges: () => mutate((d) => ({ ...d, newBadges: [] })),
      };
    },
    { name: 'sayio-v1' },
  ),
);

export function useProfile(): Profile | undefined {
  return useApp((s) => s.profiles.find((p) => p.id === s.activeId));
}

const EMPTY = emptyData();
export function useProfileData(): ProfileData {
  return useApp((s) => (s.activeId ? s.data[s.activeId] : undefined)) ?? EMPTY;
}

/** Seviye: toplam yıldıza göre isim ve ilerleme. */
const LEVELS = [
  { at: 0, name: 'Sayı Filizi' },
  { at: 15, name: 'Sayı Kaşifi' },
  { at: 40, name: 'Hesap Çırağı' },
  { at: 80, name: 'Hesap Ustası' },
  { at: 140, name: 'Zihin Sihirbazı' },
  { at: 220, name: 'Matematik Dahisi' },
  { at: 320, name: 'Sayıların Efendisi' },
];

export function levelOf(stars: number) {
  let i = 0;
  while (i < LEVELS.length - 1 && stars >= LEVELS[i + 1].at) i++;
  const from = LEVELS[i].at;
  const to = LEVELS[i + 1]?.at ?? from + 150;
  return { n: i + 1, name: LEVELS[i].name, from, to, xp: stars };
}
