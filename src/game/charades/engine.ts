import charadesData from '@/data/charades.json';
import { CATEGORIES as IMPOSTER_CATEGORIES, type Category, type LocalText } from '@/game/engine';

/** Charades topics: its own (proverbs, actions, animals) plus some Imposter word lists. */
export const CHARADES_CATEGORIES: Category[] = [
  ...charadesData.categories,
  ...charadesData.sharedFromImposter
    .map((id) => IMPOSTER_CATEGORIES.find((c) => c.id === id))
    .filter((c): c is Category => !!c),
];

export const TEAM_COLORS = ['#FFB627', '#7C9CFF', '#3DDC97', '#E59CFF'];
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 4;
export const SECONDS_OPTIONS = [60, 90, 120];
export const TURN_OPTIONS = [3, 5, 7];

export type Team = { name: string; members: string[] };

export type CharadesSettings = {
  teams: Team[];
  categoryIds: string[];
  seconds: number;
  /** Turns each team gets. */
  turnsPerTeam: number;
};

export type Prompt = { key: string; categoryId: string; text: LocalText };
export type TurnOutcome = 'got' | 'pass' | 'timeout';

export type CharadesPhase = 'handover' | 'card' | 'acting' | 'turnResult' | 'final';

export type CharadesState = {
  teams: Team[];
  scores: number[];
  seconds: number;
  turnsPerTeam: number;
  categoryIds: string[];
  used: string[];
  /** 0-based count of turns played so far; the team is turn % teams. */
  turn: number;
  prompt: Prompt;
  phase: CharadesPhase;
  outcome: TurnOutcome | null;
  /** Seconds the team needed when they got it. */
  timeTaken: number | null;
};

export type CharadesAction =
  | { type: 'start'; settings: CharadesSettings }
  | { type: 'showCard' }
  | { type: 'swap' }
  | { type: 'startActing' }
  | { type: 'finish'; outcome: TurnOutcome; timeTaken?: number }
  | { type: 'nextTurn' };

export function categoryById(id: string) {
  return CHARADES_CATEGORIES.find((c) => c.id === id);
}

function pickPrompt(categoryIds: string[], used: string[]): { prompt: Prompt; used: string[] } {
  const pool = categoryIds.flatMap((cid) => {
    const cat = categoryById(cid);
    return cat ? cat.words.map((text, i) => ({ key: `${cid}:${i}`, categoryId: cid, text })) : [];
  });
  if (pool.length === 0) throw new Error('No prompts in the selected topics');
  const fresh = pool.filter((p) => !used.includes(p.key));
  const source = fresh.length > 0 ? fresh : pool;
  const prompt = source[Math.floor(Math.random() * source.length)];
  return { prompt, used: fresh.length > 0 ? [...used, prompt.key] : [prompt.key] };
}

export function teamIndex(state: Pick<CharadesState, 'turn' | 'teams'>) {
  return state.turn % state.teams.length;
}

/** 1-based round: every team acts once per round. */
export function roundNumber(state: Pick<CharadesState, 'turn' | 'teams'>) {
  return Math.floor(state.turn / state.teams.length) + 1;
}

/** Team members take turns acting; null when the team has no named members. */
export function actorFor(team: Team, round: number): string | null {
  const members = team.members.filter((m) => m.trim());
  return members.length ? members[(round - 1) % members.length] : null;
}

export function totalTurns(state: Pick<CharadesState, 'teams' | 'turnsPerTeam'>) {
  return state.teams.length * state.turnsPerTeam;
}

/** Words in a prompt, for the "3 words" hint. Hyphenated words count once. */
export function wordCount(text: string) {
  return text.replace(/[,;!?।]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

export function startCharades(settings: CharadesSettings): CharadesState {
  const teams = settings.teams.map((t) => ({ name: t.name.trim(), members: t.members.map((m) => m.trim()).filter(Boolean) }));
  const { prompt, used } = pickPrompt(settings.categoryIds, []);
  return {
    teams,
    scores: teams.map(() => 0),
    seconds: settings.seconds,
    turnsPerTeam: settings.turnsPerTeam,
    categoryIds: settings.categoryIds,
    used,
    turn: 0,
    prompt,
    phase: 'handover',
    outcome: null,
    timeTaken: null,
  };
}

export function charadesReducer(state: CharadesState | null, action: CharadesAction): CharadesState | null {
  if (action.type === 'start') return startCharades(action.settings);
  if (!state) return state;

  switch (action.type) {
    case 'showCard':
      return { ...state, phase: 'card' };

    case 'swap': {
      if (state.phase !== 'card') return state;
      const { prompt, used } = pickPrompt(state.categoryIds, state.used);
      return { ...state, prompt, used };
    }

    case 'startActing':
      return { ...state, phase: 'acting' };

    case 'finish': {
      if (state.phase !== 'acting') return state;
      const team = teamIndex(state);
      const scores = action.outcome === 'got' ? state.scores.map((s, i) => (i === team ? s + 1 : s)) : state.scores;
      return { ...state, phase: 'turnResult', outcome: action.outcome, timeTaken: action.timeTaken ?? null, scores };
    }

    case 'nextTurn': {
      const turn = state.turn + 1;
      if (turn >= totalTurns(state)) return { ...state, phase: 'final' };
      const { prompt, used } = pickPrompt(state.categoryIds, state.used);
      return { ...state, turn, prompt, used, phase: 'handover', outcome: null, timeTaken: null };
    }
  }
}

export function validateCharades(s: CharadesSettings): 'errTeams' | 'errTeamName' | 'errDuplicateTeam' | 'errNoCategory' | null {
  if (s.teams.length < MIN_TEAMS || s.teams.length > MAX_TEAMS) return 'errTeams';
  const names = s.teams.map((t) => t.name.trim());
  if (names.some((n) => !n)) return 'errTeamName';
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return 'errDuplicateTeam';
  if (s.categoryIds.length === 0) return 'errNoCategory';
  return null;
}
