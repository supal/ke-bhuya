import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { Button, IconButton, Screen, T } from '@/components/ui';
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
    if (!hadGameOnMount.current) router.replace('/setup');
  }, [router]);

  const quit = useCallback(() => {
    Alert.alert(t.exitTitle, t.exitBody, [
      { text: t.exitCancel, style: 'cancel' },
      {
        text: t.exitConfirm,
        style: 'destructive',
        onPress: () => {
          router.back();
          // End after the screen has left, so it never renders without a game.
          setTimeout(endGame, 400);
        },
      },
    ]);
  }, [t, router, endGame]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      quit();
      return true;
    });
    return () => sub.remove();
  }, [quit]);

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
          onEnd={() => {
            router.back();
            setTimeout(endGame, 400);
          }}
        />
      );
  }
}

type PhaseProps = { game: GameState; t: Strings; lang: Lang; onQuit: () => void };

function TopBar({ label, t, onQuit, right }: { label: string; t: Strings; onQuit: () => void; right?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <T font="bodySemi" size={15} color={colors.textMuted} style={{ flex: 1 }}>
        {label}
      </T>
      {right}
      <IconButton icon="close" label={t.exitTitle} onPress={onQuit} color={colors.textMuted} />
    </View>
  );
}

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
      <TopBar label={t.playerOf(index + 1, game.players.length)} t={t} onQuit={onQuit} />
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
              <SecretWord text={game.round.word[lang]} />
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.hold}, ${t.toSee}`}
          onPressIn={() => {
            setHolding(true);
            setSeen(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }}
          onPressOut={() => setHolding(false)}
          style={[styles.holdButton, holding && { backgroundColor: 'rgba(255,182,39,0.28)' }]}
        >
          <Icon name="fingerprint" size={52} color={colors.marigold} strokeWidth={1.6} />
          <T font="displayBold" size={19}>
            {t.hold}
          </T>
          <T size={13} color={colors.textSoft}>
            {t.toSee}
          </T>
        </Pressable>

        {seen && !holding ? (
          <Button
            label={isLast ? t.seenStart : t.seenPass}
            icon="arrow"
            variant="outline"
            onPress={() => dispatch({ type: 'nextReveal' })}
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          <View style={styles.footNote}>
            <Icon name="eyeOff" size={18} color={colors.textMuted} />
            <T size={15} color={colors.textMuted}>
              {t.releaseHides}
            </T>
          </View>
        )}
      </View>
    </Screen>
  );
}

/**
 * The secret word, as large as it fits. A single word stays on one line so it
 * never breaks in the middle (চিড়িয়াখা / না); phrases may use two lines.
 */
function SecretWord({ text }: { text: string }) {
  const length = Array.from(text).length;
  const size = length <= 6 ? 68 : length <= 9 ? 54 : length <= 13 ? 44 : 36;
  const singleWord = !text.includes(' ');
  return (
    <T
      font="display"
      size={size}
      color={colors.ink}
      style={[styles.center, { lineHeight: Math.round(size * 1.25), alignSelf: 'stretch' }]}
      numberOfLines={singleWord ? 1 : 2}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
    >
      {text}
    </T>
  );
}

/* ------------------------------------------------------------------ */
/* Clue round                                                          */
/* ------------------------------------------------------------------ */

const RING_R = 70;
const RING_C = 2 * Math.PI * RING_R;

function CluesPhase({ game, t, lang, onQuit }: PhaseProps) {
  const { dispatch } = useGame();
  const total = game.timerSeconds;
  const current = game.round.clueOrder[game.clueIndex];
  const isLast = game.clueIndex === game.players.length - 1;

  return (
    <Screen>
      <TopBar
        label={t.roundClues(game.round.number)}
        t={t}
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
  const [left, setLeft] = useState(total);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.ring} accessible accessibilityLabel={left > 0 ? t.secondsLeft(left) : t.timeUp}>
      <Svg width={168} height={168} viewBox="0 0 168 168">
        <Circle cx={84} cy={84} r={RING_R} fill="none" stroke={colors.surfaceMuted} strokeWidth={12} />
        <Circle
          cx={84}
          cy={84}
          r={RING_R}
          fill="none"
          stroke={left > 5 ? colors.mint : colors.coral}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - left / total)}
          transform="rotate(-90 84 84)"
        />
      </Svg>
      <View style={styles.ringLabel}>
        {left > 0 ? (
          <>
            <T font="display" size={50} style={{ lineHeight: 56 }}>
              {num(left, lang)}
            </T>
            <T size={14} color={colors.textMuted}>
              {t.seconds}
            </T>
          </>
        ) : (
          <T font="displayBold" size={24} color={colors.coralText}>
            {t.timeUp}
          </T>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Vote                                                                */
/* ------------------------------------------------------------------ */

// Bengali vowel signs, nasal marks and nukta attach to the letter before them;
// a hasanta (্) joins the next consonant into a conjunct (e.g. শ্রা).
const BN_MARK = /[\u0981-\u0983\u09BC\u09BE-\u09CC\u09D7]/;
const BN_HASANTA = '\u09CD';

/** First letter of a name, keeping Bangla conjuncts and vowel signs whole. */
function initials(name: string) {
  const chars = Array.from(name.trim());
  if (chars.length === 0) return '?';
  let out = chars[0];
  for (let i = 1; i < chars.length; i++) {
    const c = chars[i];
    const prev = chars[i - 1];
    if (BN_MARK.test(c) || c === BN_HASANTA || prev === BN_HASANTA || c === '\u200D') out += c;
    else break;
  }
  return out.toLocaleUpperCase();
}

function VotePhase({ game, t, onQuit }: PhaseProps) {
  const { dispatch } = useGame();
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <Screen>
      <TopBar label="" t={t} onQuit={onQuit} />
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
      <TopBar label={t.roundLabel(game.round.number)} t={t} onQuit={onQuit} />
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
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
  holdButton: {
    width: 180,
    height: 180,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.marigold,
    backgroundColor: 'rgba(255,182,39,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  footNote: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 60 },
  topicChip: { backgroundColor: colors.marigold, paddingHorizontal: 12, paddingVertical: 2, borderRadius: radius.pill },
  ring: { width: 168, height: 168 },
  ringLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
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
