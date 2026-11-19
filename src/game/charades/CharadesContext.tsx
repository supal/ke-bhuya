import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { useGame } from '@/game/GameContext';
import { usePersistentState } from '@/game/usePersistentState';
import { charadesStrings, type CharadesStrings } from '@/i18n/charades';
import { charadesReducer, type CharadesAction, type CharadesSettings, type CharadesState } from './engine';

const DEFAULTS: CharadesSettings = {
  teams: [
    { name: 'দল বাঘ', members: [] },
    { name: 'দল ইলিশ', members: [] },
  ],
  categoryIds: ['proverbs', 'actions'],
  seconds: 90,
  turnsPerTeam: 5,
};

type Ctx = {
  settings: CharadesSettings;
  updateSettings: (patch: Partial<CharadesSettings>) => void;
  game: CharadesState | null;
  dispatch: (a: CharadesAction) => void;
  end: () => void;
  c: CharadesStrings;
};

const CharadesContext = createContext<Ctx | null>(null);

function reducer(state: CharadesState | null, action: CharadesAction | { type: 'end' }) {
  return action.type === 'end' ? null : charadesReducer(state, action);
}

export function CharadesProvider({ children }: { children: ReactNode }) {
  const { lang } = useGame();
  const [settings, updateSettings] = usePersistentState<CharadesSettings>('kebhuya.charades.v1', DEFAULTS);
  const [game, dispatchRaw] = useReducer(reducer, null);
  const dispatch = useCallback((a: CharadesAction) => dispatchRaw(a), []);
  const end = useCallback(() => dispatchRaw({ type: 'end' }), []);

  const value = useMemo(
    () => ({ settings, updateSettings, game, dispatch, end, c: charadesStrings[lang] }),
    [settings, updateSettings, game, dispatch, end, lang],
  );
  return <CharadesContext.Provider value={value}>{children}</CharadesContext.Provider>;
}

export function useCharades() {
  const ctx = useContext(CharadesContext);
  if (!ctx) throw new Error('useCharades must be used inside CharadesProvider');
  return ctx;
}
