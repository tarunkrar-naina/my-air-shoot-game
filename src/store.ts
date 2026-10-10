import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  // Auth
  isLoggedIn: boolean;
  userEmail: string | null;
  userPhone: string | null;
  login: (email: string | null, phone: string | null) => void;
  logout: () => void;

  // Progress
  coins: number;
  currentLevel: number; // The level currently being played or selected
  maxUnlockedLevel: number; // Up to 100
  spinsAvailable: number;
  totalLevelsCompletedCount: number;
  addCoins: (amount: number) => void;
  completeLevel: (level: number) => void;
  buyLevel: (level: number, cost: number) => boolean;
  addSpin: () => void;
  useSpin: () => void;

  // Settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;

  // Controls (Mock, as requested)
  controlSensitivity: number;
  setControlSensitivity: (val: number) => void;

  // Weapons and Customization
  selectedGun: string;
  unlockedGuns: string[];
  selectedSkin: string;
  unlockedSkins: string[];
  selectGun: (gunId: string) => void;
  unlockGun: (gunId: string, cost: number) => boolean;
  addUnlockedGun: (gunId: string) => void;
  selectSkin: (skinId: string) => void;
  unlockSkin: (skinId: string, cost: number) => boolean;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userEmail: null,
      userPhone: null,
      login: (email, phone) => set({ isLoggedIn: true, userEmail: email, userPhone: phone }),
      logout: () => set({ isLoggedIn: false, userEmail: null, userPhone: null }),

      coins: 0,
      currentLevel: 1,
      maxUnlockedLevel: 1,
      spinsAvailable: 0,
      totalLevelsCompletedCount: 0,
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      completeLevel: (level) => set((state) => {
        const nextLevel = level + 1;
        const nextTotalCompleted = state.totalLevelsCompletedCount + 1;
        let nextSpins = state.spinsAvailable;
        if (nextTotalCompleted > 0 && nextTotalCompleted % 10 === 0) {
          nextSpins += 1;
        }
        return {
          maxUnlockedLevel: Math.max(state.maxUnlockedLevel, nextLevel),
          totalLevelsCompletedCount: nextTotalCompleted,
          spinsAvailable: nextSpins
        };
      }),
      buyLevel: (level, cost) => {
        const state = get();
        if (state.coins >= cost && level === state.maxUnlockedLevel + 1) {
          set({ coins: state.coins - cost, maxUnlockedLevel: level });
          return true;
        }
        return false;
      },
      addSpin: () => set((state) => ({ spinsAvailable: state.spinsAvailable + 1 })),
      useSpin: () => set((state) => ({ spinsAvailable: Math.max(0, state.spinsAvailable - 1) })),

      soundEnabled: true,
      musicEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

      controlSensitivity: 50,
      setControlSensitivity: (val) => set({ controlSensitivity: val }),

      // Weapons initial states
      selectedGun: 'ak47',
      unlockedGuns: ['ak47'],
      selectedSkin: 'classic',
      unlockedSkins: ['classic'],

      selectGun: (gunId) => set({ selectedGun: gunId }),
      unlockGun: (gunId, cost) => {
        const state = get();
        if (state.coins >= cost && !state.unlockedGuns.includes(gunId)) {
          set({
            coins: state.coins - cost,
            unlockedGuns: [...state.unlockedGuns, gunId],
            selectedGun: gunId
          });
          return true;
        }
        return false;
      },
      addUnlockedGun: (gunId) => set((state) => {
        if (!state.unlockedGuns.includes(gunId)) {
          return { unlockedGuns: [...state.unlockedGuns, gunId] };
        }
        return {};
      }),
      selectSkin: (skinId) => set({ selectedSkin: skinId }),
      unlockSkin: (skinId, cost) => {
        const state = get();
        if (state.coins >= cost && !state.unlockedSkins.includes(skinId)) {
          set({
            coins: state.coins - cost,
            unlockedSkins: [...state.unlockedSkins, skinId],
            selectedSkin: skinId
          });
          return true;
        }
        return false;
      }
    }),
    {
      name: 'forest-hunter-storage',
    }
  )
);
