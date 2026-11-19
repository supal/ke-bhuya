import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  FitText,
  FootNote,
  HoldButton,
  TimerRing,
  TopBar,
  initials,
  useCountdown,
  useQuitGuard,
} from '@/components/game';
import { Icon } from '@/components/Icon';
import { Button, Screen, T } from '@/components/ui';
import { categoryById, type GameState } from '@/game/engine';
import { useGame } from '@/game/GameContext';
import { num, type Lang, type Strings } from '@/i18n/strings';
import { colors, radius } from '@/theme';

export default function Play() {
  useKeepAwake();
  const router = useRouter();
  const { game, t, lang, endGame } = useGame();

  // Opened without a running game (e.g. after the app was restarted): go to setup.
  const hadGameOnMount = useRef(!!game);
  useEffect(() => {
    if (!hadGameOnMount.current) router.replace('/imposter/setup');
  }, [router]);

  const { quit, leave } = useQuitGuard(endGame);

  if (!game) return null;

  const common = { game, t, lang, onQuit: quit };
  switch (game.phase) {
    case 'pass':
      return <PassPhase key={`pass-${game.round.number}-${game.revealIndex}`} {...common} />;
    case 'clues':
      return <CluesPhase key={`clues-${game.round.number}`} {...common} />;
    case 'vote':
      return <VotePhase key={`vote-${game.round.number}`} {...common} />;
    case 'result':
      return (
        <ResultPhase
          key={`result-${game.round.number}`}
          {...common}
          onEnd={leave}
        />
      );
  }
}

type PhaseProps = { game: GameState; t: Strings; lang: Lang; onQuit: () => void };

function categoryName(game: GameState, lang: Lang) {
  return categoryById(game.round.categoryId)?.name[lang] ?? '';
}

/* ------------------------------------------------------------------ */
/* Pass the phone + hold to reveal                                     */
/* ------------------------------------------------------------------ */

function PassPhase({ game, t, lang, onQuit }: PhaseProps) {
  const { dispatch } = useGame();
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);

  const index = game.revealIndex;
  const name = game.players[index];
  const isImposter = game.round.imposters.includes(index);
  const isLast = index === game.players.length - 1;

  return (
    <Screen>
      <TopBar label={t.playerOf(index + 1, game.players.length)} onQuit={onQuit} />
      <View style={styles.dots} accessible={false}>
        {game.players.map((p, i) => (
          <View
            key={p}
            style={[
              styles.dot,
              { backgroundColor: i < index ? colors.mint : i === index ? colors.marigold : colors.line },
            ]}
          />
        ))}
      </View>

      <View style={styles.passTop}>
        {holding ? (
          isImposter ? (
            <View style={[styles.card, { backgroundColor: colors.coral, transform: [{ rotate: '2deg' }] }]}>
              <T font="bodySemi" size={15} color={colors.ink}>
                {t.yourCard(name)}
              </T>
              <Icon name="mask" size={76} color={colors.ink} strokeWidth={1.6} />
              <T font="display" size={42} color={colors.ink} style={styles.center}>
                {t.youAreImposter}
              </T>
              {game.showHint && (
                <View style={styles.cardChip}>
                  <T font="bodyBold" size={16} color={colors.ink}>
                    {t.categoryLabel(categoryName(game, lang))}
                  </T>
                </View>
              )}
              <T font="bodyMedium" size={15} color={colors.ink} style={styles.center}>
                {t.imposterTip}
              </T>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.marigold, transform: [{ rotate: '-2deg' }] }]}>
              <T font="bodySemi" size={15} color={colors.ink}>
                {t.yourWord(name)}
              </T>
              <View style={styles.cardChip}>
                <T font="bodyBold" size={16} color={colors.ink}>
                  {t.categoryLabel(categoryName(game, lang))}
                </T>
              </View>
              <FitText text={game.round.word[lang]} />
              <T font="bodyMedium" size={16} color={colors.ink} style={styles.center}>
                {t.dontTell}
              </T>
            </View>
          )
        ) : (
          <View style={{ alignItems: 'center' }}>
            <T size={18} color={colors.textMuted}>
              {t.passTo}
            </T>
            <T
              font="display"
              size={60}
              color={colors.marigold}
              style={[styles.center, { lineHeight: 74 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {name}
            </T>
            <T size={16} color={colors.textSoft} style={styles.center}>
              {t.passToSuffix}
            </T>
          </View>
        )}
      </View>

      <View style={{ alignItems: 'center', gap: 16 }}>
        <HoldButton
          label={t.hold}
          sub={t.toSee}
          holding={holding}
          onPressIn={() => {
            setHolding(true);
            setSeen(true);
          }}
          onPressOut={() => setHolding(false)}
        />

        {seen && !holding ? (
          <Button
            label={isLast ? t.seenStart : t.seenPass}
            icon="arrow"
            variant="outline"
            onPress={() => dispatch({ type: 'nextReveal' })}
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          <FootNote text={t.releaseHides} />
        )}
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Clue round                                                          */
/* ------------------------------------------------------------------ */

function CluesPhase({ game, t, lang, onQuit }: PhaseProps) {
  const { dispatch } = useGame();
  const total = game.timerSeconds;
  const current = game.round.clueOrder[game.clueIndex];
  const isLast = game.clueIndex === game.players.length - 1;

  return (
    <Screen>
      <TopBar
        label={t.roundClues(game.round.number)}
       
        onQuit={onQuit}
        right={
          <View style={styles.topicChip}>
            <T font="bodyBold" size={14} color={colors.ink}>
              {t.categoryLabel(categoryName(game, lang))}
            </T>
          </View>
        }
      />

      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
        {total != null && <ClueTimer key={game.clueIndex} total={total} t={t} lang={lang} />}
        <T size={16} color={colors.textMuted}>
          {t.nowGives}
        </T>
        <T font="display" size={46} color={colors.marigold} style={{ lineHeight: 58 }} numberOfLines={1} adjustsFontSizeToFit>
          {game.players[current]}
        </T>
        <T size={15} color={colors.textSoft}>
          {t.oneClue}
        </T>
      </View>

      <ScrollView style={styles.orderList} contentContainerStyle={{ paddingVertical: 2 }}>
        {game.round.clueOrder.map((p, i) => {
          const done = i < game.clueIndex;
          const now = i === game.clueIndex;
          return (
            <View
              key={p}
              style={[
                styles.orderRow,
                i < game.players.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
                now && { backgroundColor: 'rgba(255,182,39,0.12)' },
              ]}
              accessible
              accessibilityLabel={`${game.players[p]}${done ? `, ${t.done}` : now ? `, ${t.speaking}` : ''}`}
            >
              <View style={{ width: 22, alignItems: 'center' }}>
                {done ? (
                  <Icon name="check" size={20} color={colors.mint} strokeWidth={2.6} />
                ) : now ? (
                  <Icon name="play" size={20} color={colors.marigold} />
                ) : (
                  <T size={15} color={colors.textMuted}>
                    {num(i + 1, lang)}
                  </T>
                )}
              </View>
              <T
                font={now ? 'bodyBold' : 'body'}
                size={16}
                color={done ? colors.textMuted : now ? colors.text : colors.textSoft}
              >
                {game.players[p]}
              </T>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.row2}>
        <Button
          label={t.voteNow}
          variant="outlineDanger"
          height={56}
          onPress={() => dispatch({ type: 'goVote' })}
          style={{ flex: 1 }}
        />
        <Button
          label={isLast ? t.toVote : t.next}
          height={56}
          onPress={() => dispatch({ type: 'nextClue' })}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

/** Counts down one player's clue time. Keyed by the clue index, so it restarts for each player. */
function ClueTimer({ total, t, lang }: { total: number; t: Strings; lang: Lang }) {
  const left = useCountdown(total);
  return (
    <TimerRing
      left={left}
      total={total}
      lang={lang}
      unit={t.seconds}
      timeUp={t.timeUp}
      a11yLabel={left > 0 ? t.secondsLeft(left) : t.timeUp}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Vote                                                                */
/* ------------------------------------------------------------------ */

function VotePhase({ game, t, onQuit }: PhaseProps) {
  const { dispatch } = useGame();
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <Screen>
      <TopBar label="" onQuit={onQuit} />
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <T font="display" size={48} color={colors.coral} style={{ lineHeight: 60 }} accessibilityRole="header">
          {t.whoIs}
        </T>
        <T size={16} color={colors.textSoft} style={styles.center}>
          {t.voteSub}
        </T>
      </View>

      <ScrollView contentContainerStyle={styles.voteGrid} accessibilityRole="radiogroup">
        {game.players.map((p, i) => {
          const on = picked === i;
          const avatar = colors.avatars[i % colors.avatars.length];
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={p}
              onPress={() => {
                setPicked(i);
                Haptics.selectionAsync().catch(() => {});
              }}
              style={[styles.voteTile, on && styles.voteTileOn]}
            >
              {on && (
                <View style={styles.voteCheck}>
                  <Icon name="check" size={14} color={colors.ink} strokeWidth={3.2} />
                </View>
              )}
              <View style={[styles.avatar, { backgroundColor: on ? colors.coral : avatar }]}>
                <T font="display" size={20} color={colors.ink} style={{ lineHeight: 28 }}>
                  {initials(p)}
                </T>
              </View>
              <T font={on ? 'bodyBold' : 'bodySemi'} size={17} numberOfLines={1}>
                {p}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      <Button
        label={picked == null ? t.pickSomeone : t.expose(game.players[picked])}
        variant="danger"
        disabled={picked == null}
        onPress={() => {
          if (picked == null) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          dispatch({ type: 'vote', index: picked });
        }}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Result, last chance, scoreboard                                     */
/* ------------------------------------------------------------------ */

function ResultPhase({ game, t, lang, onQuit, onEnd }: PhaseProps & { onEnd: () => void }) {
  const { dispatch } = useGame();
  const [wordShown, setWordShown] = useState(false);

  const voted = game.votedIndex ?? 0;
  const caught = game.round.imposters.includes(voted);
  const imposterNames = game.round.imposters.map((i) => game.players[i]);
  const pending = game.outcome === null;

  const ranking = game.players
    .map((name, i) => ({ name, score: game.scores[i], i }))
    .sort((a, b) => b.score - a.score || a.i - b.i);

  return (
    <Screen>
      <TopBar label={t.roundLabel(game.round.number)} onQuit={onQuit} />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: caught ? colors.mint : colors.coral }]}>
          <T font="display" size={36} color={colors.ink} style={{ lineHeight: 46 }} accessibilityRole="header">
            {caught ? t.caught : t.wrongPerson}
          </T>
          {!caught && (
            <T font="bodySemi" size={16} color={colors.ink} style={styles.center}>
              {t.wasInnocent(game.players[voted])}
            </T>
          )}
          <T font="bodySemi" size={17} color={colors.ink} style={styles.center}>
            {t.wasImposter(imposterNames)}
          </T>
        </View>

        {pending ? (
          <View style={styles.panel}>
            <T font="displayBold" size={20} color={colors.marigold}>
              {t.lastChance}
            </T>
            <T size={15} color={colors.textSoft}>
              {t.lastChanceBody(imposterNames)}
            </T>
            {wordShown ? (
              <>
                <WordReveal game={game} t={t} lang={lang} />
                <View style={styles.row2}>
                  <Button
                    label={t.guessedRight}
                    variant="outlineDanger"
                    height={52}
                    onPress={() => dispatch({ type: 'lastChance', guessedRight: true })}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={t.guessedWrong}
                    height={52}
                    onPress={() => dispatch({ type: 'lastChance', guessedRight: false })}
                    style={[{ flex: 1 }, { backgroundColor: colors.mint }]}
                  />
                </View>
              </>
            ) : (
              <Button label={t.showWord} icon="eye" variant="outline" height={52} onPress={() => setWordShown(true)} />
            )}
          </View>
        ) : (
          <View style={styles.panel}>
            <T font="displayBold" size={22} color={game.outcome === 'imposter' ? colors.coralText : colors.mint}>
              {game.outcome === 'imposter' ? t.imposterWins : t.groupWins}
            </T>
            <WordReveal game={game} t={t} lang={lang} />
            <T size={13} color={colors.textMuted}>
              {t.scoringNote}
            </T>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T font="bodySemi" size={15} color={colors.textMuted} accessibilityRole="header">
            {t.scoreboard}
          </T>
          <View style={styles.orderList}>
            {ranking.map((r, rank) => (
              <View
                key={r.name}
                style={[
                  styles.orderRow,
                  rank < ranking.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
                ]}
              >
                <T font="bodyBold" size={15} color={rank === 0 ? colors.marigold : colors.textMuted} style={{ width: 22 }}>
                  {num(rank + 1, lang)}
                </T>
                <T font={rank === 0 ? 'bodySemi' : 'body'} size={16} style={{ flex: 1 }}>
                  {r.name}
                </T>
                <T font="display" size={20} color={rank === 0 ? colors.marigold : colors.text}>
                  {num(r.score, lang)}
                </T>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.row2}>
        <Button label={t.endGame} variant="ghost" height={56} onPress={onEnd} style={{ flex: 1 }} />
        <Button
          label={t.nextRound}
          icon="arrow"
          height={56}
          disabled={pending}
          onPress={() => dispatch({ type: 'nextRound' })}
          style={{ flex: 2 }}
        />
      </View>
    </Screen>
  );
}

function WordReveal({ game, t, lang }: { game: GameState; t: Strings; lang: Lang }) {
  return (
    <View style={styles.wordReveal}>
      <T size={14} color={colors.textMuted}>
        {t.wordWas}
      </T>
      <T font="display" size={30} color={colors.text} style={{ lineHeight: 40 }}>
        {game.round.word[lang]}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 22, height: 6, borderRadius: radius.pill },
  passTop: { flex: 1, justifyContent: 'center', alignItems: 'stretch', paddingVertical: 16 },
  card: {
    flex: 1,
    maxHeight: 420,
    marginHorizontal: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  cardChip: {
    backgroundColor: 'rgba(21,19,43,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  topicChip: { backgroundColor: colors.marigold, paddingHorizontal: 12, paddingVertical: 2, borderRadius: radius.pill },
  orderList: {
    flexGrow: 0,
    flexShrink: 1,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 16 },
  row2: { flexDirection: 'row', gap: 10 },
  voteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  voteTile: {
    width: '47.5%',
    flexGrow: 1,
    height: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  voteTileOn: { borderWidth: 3, borderColor: colors.coral, backgroundColor: 'rgba(255,107,107,0.14)' },
  voteCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  banner: { borderRadius: 24, padding: 20, alignItems: 'center', gap: 2 },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  wordReveal: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
});
