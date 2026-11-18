import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';

import { type Lang, strings, type Strings } from '@/i18n/strings';
import { gameReducer, type GameAction, type GameState, type Settings } from './engine';

const STORAGE_KEY = 'kebhuya.settings.v1';

export type StoredSettings = Settings & { lang: Lang };

const DEFAULT_SETTINGS: StoredSettings = {
  lang: 'bn',
  players: [],
  imposterCount: 1,
  categoryIds: ['food'],
  showHint: true,
  timerOn: true,
  timerSeconds: 30,
};

type GameContextValue = {
  ready: boolean;
  settings: StoredSettings;
  updateSettings: (patch: Partial<StoredSettings>) => void;
  lang: Lang;
  t: Strings;
  game: GameState | null;
  dispatch: Dispatch<GameAction>;
  endGame: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

type RootAction = GameAction | { type: 'end' };

function rootReducer(state: GameState | null, action: RootAction): GameState | null {
  if (action.type === 'end') return null;
  return gameReducer(state, action);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [game, dispatchRoot] = useReducer(rootReducer, null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      })
      .catch(() => {
        // Corrupt or unreadable settings: fall back to defaults.
      })
      .finally(() => setReady(true));
  }, []);

  const updateSettings = useCallback((patch: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const dispatch = useCallback((action: GameAction) => dispatchRoot(action), []);
  const endGame = useCallback(() => dispatchRoot({ type: 'end' }), []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      settings,
      updateSettings,
      lang: settings.lang,
      t: strings[settings.lang],
      game,
      dispatch,
      endGame,
    }),
    [ready, settings, updateSettings, game, dispatch, endGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
