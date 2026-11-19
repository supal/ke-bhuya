import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  CardChip,
  FitText,
  RevealCard,
  sharedStyles,
  TimerRing,
  TopBar,
  useCountdown,
  useQuitGuard,
} from '@/components/game';
import { Icon } from '@/components/Icon';
import { Button, Screen, T } from '@/components/ui';
import {
  actorFor,
  categoryById,
  roundNumber,
  TEAM_COLORS,
  teamIndex,
  totalTurns,
  wordCount,
  type CharadesState,
} from '@/game/charades/engine';
import { useCharades } from '@/game/charades/CharadesContext';
import { useGame } from '@/game/GameContext';
import type { CharadesStrings } from '@/i18n/charades';
import { num, type Lang } from '@/i18n/strings';
import { colors, radius } from '@/theme';

type PhaseProps = { game: CharadesState; c: CharadesStrings; lang: Lang; onQuit: () => void };

export default function CharadesPlay() {
  useKeepAwake();
  const router = useRouter();
  const { lang } = useGame();
  const { game, c, end } = useCharades();
  const { quit, goHome } = useQuitGuard(end);

  const hadGameOnMount = useRef(!!game);
  useEffect(() => {
    if (!hadGameOnMount.current) router.replace('/charades/setup');
  }, [router]);

  if (!game) return null;
  const common = { game, c, lang, onQuit: quit };

  switch (game.phase) {
    case 'handover':
      return <HandoverPhase key={`hand-${game.turn}`} {...common} />;
    case 'card':
      return <CardPhase key={`card-${game.turn}`} {...common} />;
    case 'acting':
      return <ActingPhase key={`act-${game.turn}`} {...common} />;
    case 'turnResult':
      return <TurnResultPhase key={`res-${game.turn}`} {...common} />;
    case 'final':
      return <FinalPhase {...common} onHome={goHome} />;
  }
}

function turnInfo(game: CharadesState) {
  const ti = teamIndex(game);
  const round = roundNumber(game);
  const team = game.teams[ti];
  return { ti, round, team, color: TEAM_COLORS[ti], actor: actorFor(team, round) };
}

function hint(game: CharadesState, c: CharadesStrings, lang: Lang) {
  const cat = categoryById(game.prompt.categoryId)?.name[lang] ?? '';
  return { cat, words: c.words(wordCount(game.prompt.text[lang])) };
}

function TeamPill({ name, color, label }: { name: string; color: string; label?: string }) {
  return (
    <View style={[styles.teamPill, { borderColor: color, backgroundColor: `${color}24` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <T font="bodySemi" size={15}>
        {label ?? name}
      </T>
    </View>
  );
}

/* Hand the phone to this turn's actor -------------------------------- */

function HandoverPhase({ game, c, onQuit }: PhaseProps) {
  const { dispatch } = useCharades();
  const { round, team, color, actor } = turnInfo(game);
  return (
    <Screen>
      <TopBar label={c.roundOf(round, game.turnsPerTeam)} onQuit={onQuit} />
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <TeamPill name={team.name} color={color} label={c.roundTurn(round, team.name)} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="users" size={72} color={color} strokeWidth={1.6} />
        <T size={18} color={colors.textMuted}>
          {c.actor}
        </T>
        <T font="display" size={56} color={colors.marigold} style={[sharedStyles.center, { lineHeight: 70 }]} numberOfLines={1} adjustsFontSizeToFit>
          {actor ?? c.anyActor}
        </T>
        <T font="bodySemi" size={17} style={sharedStyles.center}>
          {c.giveTo(actor)}
        </T>
        <T size={15} color={colors.textSoft} style={sharedStyles.center}>
          {c.onlyYou}
        </T>
      </View>
      <Button label={c.showCard} icon="eye" onPress={() => dispatch({ type: 'showCard' })} />
    </Screen>
  );
}

/* The actor reads the prompt, may swap it, then starts -------------- */

function CardPhase({ game, c, lang, onQuit }: PhaseProps) {
  const { dispatch } = useCharades();
  const { round, team, color, actor } = turnInfo(game);
  const h = hint(game, c, lang);
  return (
    <Screen>
      <TopBar label={c.roundOf(round, game.turnsPerTeam)} onQuit={onQuit} />
      <View style={{ alignItems: 'center', gap: 4, marginTop: 4 }}>
        <TeamPill name={team.name} color={color} label={c.roundTurn(round, team.name)} />
        <T size={15} color={colors.textMuted} style={{ marginTop: 6 }}>
          {c.actor}
        </T>
        <T font="display" size={34} color={colors.marigold} style={{ lineHeight: 44 }} numberOfLines={1}>
          {actor ?? c.anyActor}
        </T>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 16 }}>
        <RevealCard color={colors.marigold}>
          <CardChip>{`${h.cat} · ${h.words}`}</CardChip>
          <FitText text={game.prompt.text[lang]} maxLines={3} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="mute" size={18} color={colors.ink} />
            <T font="bodySemi" size={15} color={colors.ink}>
              {c.noTalking}
            </T>
          </View>
        </RevealCard>
      </View>
      <View style={sharedStyles.row2}>
        <Button label={c.swap} icon="refresh" variant="ghost" height={56} onPress={() => dispatch({ type: 'swap' })} style={{ flex: 1 }} />
        <Button
          label={c.startActing}
          icon="play"
          height={56}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            dispatch({ type: 'startActing' });
          }}
          style={{ flex: 2 }}
        />
      </View>
    </Screen>
  );
}

/* Acting: countdown for the team, peek for the actor ---------------- */

function ActingPhase({ game, c, lang, onQuit }: PhaseProps) {
  const { dispatch } = useCharades();
  const { team, color, actor } = turnInfo(game);
  const left = useCountdown(game.seconds);
  const [peeking, setPeeking] = useState(false);
  const h = hint(game, c, lang);

  useEffect(() => {
    if (left === 0) dispatch({ type: 'finish', outcome: 'timeout' });
  }, [left, dispatch]);

  return (
    <Screen>
      <TopBar
        label={c.teamActing(team.name)}
        onQuit={onQuit}
        right={
          <T size={14} color={colors.textMuted}>
            {game.scores.map((sc) => num(sc, lang)).join(' · ')}
          </T>
        }
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
        <View style={[styles.hintChip, { backgroundColor: color }]}>
          <T font="bodyBold" size={16} color={colors.ink}>
            {h.cat}
          </T>
        </View>
        <View style={[styles.hintChip, { backgroundColor: colors.surfaceMuted }]}>
          <T font="bodyBold" size={16}>
            {h.words}
          </T>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        {peeking ? (
          <RevealCard color={colors.marigold} style={{ alignSelf: 'stretch', maxHeight: 300 }}>
            <FitText text={game.prompt.text[lang]} maxLines={3} />
          </RevealCard>
        ) : (
          <>
            <TimerRing
              left={left}
              total={game.seconds}
              lang={lang}
              unit={c.secondsLeftUnit}
              timeUp={c.timeUp}
              a11yLabel={left > 0 ? c.secondsLeft(left) : c.timeUp}
              size={240}
            />
            <View style={{ alignItems: 'center' }}>
              <T font="displayBold" size={24} style={sharedStyles.center}>
                {c.guessFrom(actor)}
              </T>
              <T size={15} color={colors.textSoft} style={sharedStyles.center}>
                {c.gesturesOk}
              </T>
            </View>
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={c.peek}
          onPressIn={() => setPeeking(true)}
          onPressOut={() => setPeeking(false)}
          style={[styles.peek, peeking && { borderColor: colors.marigold }]}
        >
          <Icon name="eye" size={18} color={colors.textSoft} />
          <T font="bodySemi" size={15} color={colors.textSoft}>
            {c.peek}
          </T>
        </Pressable>
      </View>

      <View style={sharedStyles.row2}>
        <Button
          label={c.pass}
          variant="outlineDanger"
          height={64}
          onPress={() => dispatch({ type: 'finish', outcome: 'pass' })}
          style={{ flex: 1 }}
        />
        <Button
          label={c.got}
          icon="check"
          height={64}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            dispatch({ type: 'finish', outcome: 'got', timeTaken: game.seconds - left });
          }}
          style={[{ flex: 2 }, { backgroundColor: colors.mint }]}
        />
      </View>
    </Screen>
  );
}

/* After each turn: what happened, scores, who's next ---------------- */

function TeamScores({ game, lang }: { game: CharadesState; lang: Lang }) {
  const max = Math.max(1, ...game.scores);
  return (
    <View style={[sharedStyles.panel, { gap: 14 }]}>
      {game.teams.map((tm, i) => (
        <View key={tm.name} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dot, { width: 12, height: 12, backgroundColor: TEAM_COLORS[i] }]} />
              <T font="bodySemi" size={17}>
                {tm.name}
              </T>
            </View>
            <T font="display" size={24} color={TEAM_COLORS[i]} style={{ lineHeight: 30 }}>
              {num(game.scores[i], lang)}
            </T>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { width: `${(game.scores[i] / max) * 100}%`, backgroundColor: TEAM_COLORS[i] }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function TurnResultPhase({ game, c, lang, onQuit }: PhaseProps) {
  const { dispatch } = useCharades();
  const { round, team } = turnInfo(game);
  const got = game.outcome === 'got';
  const last = game.turn + 1 >= totalTurns(game);
  const nextTi = (game.turn + 1) % game.teams.length;
  const nextRound = Math.floor((game.turn + 1) / game.teams.length) + 1;
  const nextTeam = game.teams[nextTi];
  const nextActor = actorFor(nextTeam, nextRound);

  return (
    <Screen>
      <TopBar label={c.roundOf(round, game.turnsPerTeam)} onQuit={onQuit} />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[sharedStyles.banner, { backgroundColor: got ? colors.mint : colors.coral }]}>
          <T font="display" size={36} color={colors.ink} style={{ lineHeight: 46 }} accessibilityRole="header">
            {got ? c.gotTitle : game.outcome === 'pass' ? c.passTitle : c.timeoutTitle}
          </T>
          <T font="bodySemi" size={16} color={colors.ink} style={sharedStyles.center}>
            {got ? c.gotSub(team.name, game.timeTaken ?? 0) : c.noPoint(team.name)}
          </T>
        </View>

        <View style={styles.answer}>
          <T size={14} color={colors.textMuted}>
            {c.answerWas}
          </T>
          <T font="displayBold" size={24} style={sharedStyles.center}>
            {game.prompt.text[lang]}
          </T>
        </View>

        <View style={{ gap: 8 }}>
          <T font="bodySemi" size={15} color={colors.textMuted} accessibilityRole="header">
            {c.teamScores}
          </T>
          <TeamScores game={game} lang={lang} />
        </View>

        {!last && (
          <View style={[styles.nextUp, { borderColor: TEAM_COLORS[nextTi], backgroundColor: `${TEAM_COLORS[nextTi]}1F` }]}>
            <Icon name="person" size={28} color={TEAM_COLORS[nextTi]} />
            <View style={{ flex: 1 }}>
              <T size={14} color={colors.textSoft}>
                {c.nextUp(nextTeam.name)}
              </T>
              <T font="bodyBold" size={18}>
                {c.actorIs(nextActor)}
              </T>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={sharedStyles.row2}>
        <Button label={c.endGame} variant="ghost" height={56} onPress={onQuit} style={{ flex: 1 }} />
        <Button
          label={last ? c.seeWinner : c.giveNext(nextActor)}
          icon="arrow"
          height={56}
          onPress={() => dispatch({ type: 'nextTurn' })}
          style={{ flex: 2 }}
        />
      </View>
    </Screen>
  );
}

/* Final -------------------------------------------------------------- */

function FinalPhase({ game, c, lang, onHome }: PhaseProps & { onHome: () => void }) {
  const { dispatch, settings } = useCharades();
  const best = Math.max(...game.scores);
  const winners = game.teams.filter((_, i) => game.scores[i] === best);
  const winnerColor = TEAM_COLORS[game.scores.indexOf(best)];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <Screen style={{ gap: 14, paddingTop: 28 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <T font="bodySemi" size={15} color={colors.textMuted}>
          {c.gamesDone}
        </T>
        <Icon name="crown" size={88} color={winners.length > 1 ? colors.marigold : winnerColor} strokeWidth={1.5} />
        <T font="display" size={42} color={colors.marigold} style={[sharedStyles.center, { lineHeight: 54 }]} accessibilityRole="header">
          {winners.length > 1 ? c.tie : c.winner(winners[0].name)}
        </T>
        <T size={17} color={colors.textSoft} style={sharedStyles.center}>
          {winners.length > 1 ? c.tieSub(winners.map((w) => w.name).join(', ')) : c.points(best)}
        </T>
      </View>
      <TeamScores game={game} lang={lang} />
      <View style={[sharedStyles.row2, { marginTop: 'auto' }]}>
        <Button label={c.home} variant="ghost" height={56} onPress={onHome} style={{ flex: 1 }} />
        <Button label={c.again} height={56} onPress={() => dispatch({ type: 'start', settings })} style={{ flex: 2 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  hintChip: { paddingHorizontal: 14, paddingVertical: 3, borderRadius: radius.pill },
  peek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  answer: { alignItems: 'center', gap: 2, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceRaised },
  barTrack: { height: 12, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  bar: { height: 12, borderRadius: radius.pill },
  nextUp: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 2 },
});
