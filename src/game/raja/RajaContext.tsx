import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { useGame } from '@/game/GameContext';
import { usePersistentState } from '@/game/usePersistentState';
import { rajaStrings, type RajaStrings } from '@/i18n/raja';
import { DEFAULT_POINTS, rajaReducer, type RajaAction, type RajaSettings, type RajaState } from './engine';

const DEFAULTS: RajaSettings = { players: ['', '', '', ''], points: DEFAULT_POINTS, catcher: 'police', rounds: 10 };

type Ctx = {
  settings: RajaSettings;
  updateSettings: (patch: Partial<RajaSettings>) => void;
  game: RajaState | null;
  dispatch: (a: RajaAction) => void;
  end: () => void;
  r: RajaStrings;
};

const RajaContext = createContext<Ctx | null>(null);

function reducer(state: RajaState | null, action: RajaAction | { type: 'end' }) {
  return action.type === 'end' ? null : rajaReducer(state, action);
}

export function RajaProvider({ children }: { children: ReactNode }) {
  const { lang } = useGame();
  const [settings, updateSettings] = usePersistentState<RajaSettings>('kebhuya.raja.v1', DEFAULTS);
  const [game, dispatchRaw] = useReducer(reducer, null);
  const dispatch = useCallback((a: RajaAction) => dispatchRaw(a), []);
  const end = useCallback(() => dispatchRaw({ type: 'end' }), []);

  const value = useMemo(
    () => ({ settings, updateSettings, game, dispatch, end, r: rajaStrings[lang] }),
    [settings, updateSettings, game, dispatch, end, lang],
  );
  return <RajaContext.Provider value={value}>{children}</RajaContext.Provider>;
}

export function useRaja() {
  const ctx = useContext(RajaContext);
  if (!ctx) throw new Error('useRaja must be used inside RajaProvider');
  return ctx;
}
