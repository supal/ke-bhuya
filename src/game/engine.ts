import wordData from '@/data/words.json';

export type LocalText = { bn: string; en: string };
export type Category = { id: string; name: LocalText; words: LocalText[] };

export const CATEGORIES: Category[] = wordData.categories;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
/** Points per round. */
export const IMPOSTER_WIN_POINTS = 2;
export const GROUP_WIN_POINTS = 1;

export type Settings = {
  players: string[];
  imposterCount: 1 | 2;
  categoryIds: string[];
  showHint: boolean;
  timerOn: boolean;
  timerSeconds: number;
};

export type Phase = 'pass' | 'clues' | 'vote' | 'result';
export type Outcome = 'imposter' | 'group';

export type Round = {
  number: number;
  categoryId: string;
  word: LocalText;
  /** Indexes into `players`. */
  imposters: number[];
  /** Player indexes in the order they give clues. */
  clueOrder: number[];
};

export type GameState = {
  players: string[];
  scores: number[];
  showHint: boolean;
  timerSeconds: number | null;
  imposterCount: 1 | 2;
  categoryIds: string[];
  usedWords: string[];
  round: Round;
  phase: Phase;
  revealIndex: number;
  clueIndex: number;
  votedIndex: number | null;
  /** null while the caught imposter's last chance is pending. */
  outcome: Outcome | null;
};

export type GameAction =
  | { type: 'start'; settings: Settings }
  | { type: 'nextReveal' }
  | { type: 'nextClue' }
  | { type: 'goVote' }
  | { type: 'vote'; index: number }
  | { type: 'lastChance'; guessedRight: boolean }
  | { type: 'nextRound' };

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Picks a word not used yet in this session; starts over once every word is used. */
function pickWord(categoryIds: string[], usedWords: string[]) {
  const pool = categoryIds.flatMap((cid) => {
    const cat = categoryById(cid);
    return cat ? cat.words.map((word, i) => ({ key: `${cid}:${i}`, categoryId: cid, word })) : [];
  });
  if (pool.length === 0) throw new Error('No words in the selected categories');
  const fresh = pool.filter((p) => !usedWords.includes(p.key));
  const source = fresh.length > 0 ? fresh : pool;
  const pick = source[Math.floor(Math.random() * source.length)];
  return { pick, usedWords: fresh.length > 0 ? [...usedWords, pick.key] : [pick.key] };
}

function newRound(
  number: number,
  playerCount: number,
  imposterCount: number,
  categoryIds: string[],
  usedWords: string[],
): { round: Round; usedWords: string[] } {
  const { pick, usedWords: nextUsed } = pickWord(categoryIds, usedWords);
  const indexes = Array.from({ length: playerCount }, (_, i) => i);
  const imposters = shuffle(indexes).slice(0, imposterCount).sort((a, b) => a - b);
  // Clues start from a random player and go around the circle.
  const first = Math.floor(Math.random() * playerCount);
  const clueOrder = indexes.map((i) => (first + i) % playerCount);
  return {
    round: { number, categoryId: pick.categoryId, word: pick.word, imposters, clueOrder },
    usedWords: nextUsed,
  };
}

function applyScores(state: GameState, outcome: Outcome): number[] {
  const { imposters } = state.round;
  return state.scores.map((s, i) => {
    const isImposter = imposters.includes(i);
    if (outcome === 'imposter') return isImposter ? s + IMPOSTER_WIN_POINTS : s;
    return isImposter ? s : s + GROUP_WIN_POINTS;
  });
}

export function startGame(settings: Settings): GameState {
  const { round, usedWords } = newRound(
    1,
    settings.players.length,
    settings.imposterCount,
    settings.categoryIds,
    [],
  );
  return {
    players: settings.players,
    scores: settings.players.map(() => 0),
    showHint: settings.showHint,
    timerSeconds: settings.timerOn ? settings.timerSeconds : null,
    imposterCount: settings.imposterCount,
    categoryIds: settings.categoryIds,
    usedWords,
    round,
    phase: 'pass',
    revealIndex: 0,
    clueIndex: 0,
    votedIndex: null,
    outcome: null,
  };
}

export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === 'start') return startGame(action.settings);
  if (!state) return state;

  switch (action.type) {
    case 'nextReveal':
      if (state.revealIndex + 1 < state.players.length) {
        return { ...state, revealIndex: state.revealIndex + 1 };
      }
      return { ...state, phase: 'clues', clueIndex: 0 };

    case 'nextClue':
      if (state.clueIndex + 1 < state.players.length) {
        return { ...state, clueIndex: state.clueIndex + 1 };
      }
      return { ...state, phase: 'vote' };

    case 'goVote':
      return { ...state, phase: 'vote' };

    case 'vote': {
      const caught = state.round.imposters.includes(action.index);
      if (caught) {
        return { ...state, phase: 'result', votedIndex: action.index, outcome: null };
      }
      return {
        ...state,
        phase: 'result',
        votedIndex: action.index,
        outcome: 'imposter',
        scores: applyScores(state, 'imposter'),
      };
    }

    case 'lastChance': {
      if (state.outcome !== null) return state;
      const outcome: Outcome = action.guessedRight ? 'imposter' : 'group';
      return { ...state, outcome, scores: applyScores(state, outcome) };
    }

    case 'nextRound': {
      const { round, usedWords } = newRound(
        state.round.number + 1,
        state.players.length,
        state.imposterCount,
        state.categoryIds,
        state.usedWords,
      );
      return {
        ...state,
        round,
        usedWords,
        phase: 'pass',
        revealIndex: 0,
        clueIndex: 0,
        votedIndex: null,
        outcome: null,
      };
    }
  }
}

/** Returns an error key from the strings table, or null when the settings can start a game. */
export function validateSettings(
  s: Settings,
): 'errMinPlayers' | 'errMaxPlayers' | 'errTwoImposters' | 'errNoCategory' | null {
  if (s.players.length < MIN_PLAYERS) return 'errMinPlayers';
  if (s.players.length > MAX_PLAYERS) return 'errMaxPlayers';
  if (s.imposterCount === 2 && s.players.length < 5) return 'errTwoImposters';
  if (s.categoryIds.length === 0) return 'errNoCategory';
  return null;
}
