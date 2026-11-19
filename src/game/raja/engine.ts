import { shuffle } from '@/game/engine';

export type Role = 'raja' | 'mantri' | 'police' | 'chor';
export const ROLES: Role[] = ['raja', 'mantri', 'police', 'chor'];
export const PLAYER_COUNT = 4;
export const ROUND_OPTIONS = [5, 10, 15];

export type Catcher = 'police' | 'mantri';
export type Points = Record<Role, number>;

export const DEFAULT_POINTS: Points = { raja: 1000, mantri: 800, police: 500, chor: 0 };

export type RajaSettings = {
  players: string[];
  points: Points;
  /** Who must find the thief. Families play it both ways. */
  catcher: Catcher;
  rounds: number;
};

export type RajaRound = {
  number: number;
  /** roles[i] is player i's slip. */
  roles: Role[];
  accused: number | null;
  /** Points each player earned this round, once the catcher has guessed. */
  gained: number[] | null;
};

export type RajaPhase = 'deal' | 'showdown' | 'result' | 'final';

export type RajaState = {
  players: string[];
  points: Points;
  catcher: Catcher;
  totalRounds: number;
  scores: number[];
  round: RajaRound;
  phase: RajaPhase;
  revealIndex: number;
};

export type RajaAction =
  | { type: 'start'; settings: RajaSettings }
  | { type: 'nextReveal' }
  | { type: 'accuse'; index: number }
  | { type: 'next' };

function dealRound(number: number): RajaRound {
  return { number, roles: shuffle(ROLES), accused: null, gained: null };
}

export function roleIndex(round: RajaRound, role: Role) {
  return round.roles.indexOf(role);
}

/** The two players the catcher chooses between: everyone except the raja and the catcher. */
export function suspects(round: RajaRound, catcher: Catcher): number[] {
  return round.roles.map((r, i) => ({ r, i })).filter(({ r }) => r !== 'raja' && r !== catcher).map(({ i }) => i);
}

/**
 * Everyone scores their slip's points. If the catcher points at the wrong
 * person, the catcher scores nothing and the thief takes the catcher's points.
 */
export function scoreRound(roles: Role[], points: Points, catcher: Catcher, accused: number): number[] {
  const chor = roles.indexOf('chor');
  const catcherIdx = roles.indexOf(catcher);
  const gained = roles.map((r) => points[r]);
  if (accused !== chor) {
    gained[chor] = points.chor + points[catcher];
    gained[catcherIdx] = 0;
  }
  return gained;
}

export function startRaja(settings: RajaSettings): RajaState {
  return {
    players: settings.players.map((p) => p.trim()),
    points: settings.points,
    catcher: settings.catcher,
    totalRounds: settings.rounds,
    scores: settings.players.map(() => 0),
    round: dealRound(1),
    phase: 'deal',
    revealIndex: 0,
  };
}

export function rajaReducer(state: RajaState | null, action: RajaAction): RajaState | null {
  if (action.type === 'start') return startRaja(action.settings);
  if (!state) return state;

  switch (action.type) {
    case 'nextReveal':
      if (state.revealIndex + 1 < state.players.length) return { ...state, revealIndex: state.revealIndex + 1 };
      return { ...state, phase: 'showdown' };

    case 'accuse': {
      if (state.round.gained) return state;
      if (!suspects(state.round, state.catcher).includes(action.index)) return state;
      const gained = scoreRound(state.round.roles, state.points, state.catcher, action.index);
      return {
        ...state,
        phase: 'result',
        round: { ...state.round, accused: action.index, gained },
        scores: state.scores.map((s, i) => s + gained[i]),
      };
    }

    case 'next':
      if (state.round.number >= state.totalRounds) return { ...state, phase: 'final' };
      return { ...state, round: dealRound(state.round.number + 1), phase: 'deal', revealIndex: 0 };
  }
}

export function validateRaja(s: RajaSettings): 'errNames' | 'errDuplicate' | null {
  const names = s.players.map((p) => p.trim());
  if (names.length !== PLAYER_COUNT || names.some((n) => !n)) return 'errNames';
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return 'errDuplicate';
  return null;
}

/** Players ranked by score, ties keep seating order. */
export function ranking(players: string[], scores: number[]) {
  return players
    .map((name, i) => ({ name, score: scores[i], i }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
}
