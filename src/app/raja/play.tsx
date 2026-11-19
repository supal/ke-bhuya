import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CardChip, FootNote, HoldButton, RevealCard, sharedStyles, TopBar, useQuitGuard } from '@/components/game';
import { Icon } from '@/components/Icon';
import { RoleBadge, ROLE_STYLE } from '@/components/roles';
import { Button, Screen, T } from '@/components/ui';
import { useGame } from '@/game/GameContext';
import { ranking, roleIndex, suspects, type RajaState } from '@/game/raja/engine';
import { useRaja } from '@/game/raja/RajaContext';
import { num, type Lang } from '@/i18n/strings';
import type { RajaStrings } from '@/i18n/raja';
import { colors, radius } from '@/theme';

type PhaseProps = { game: RajaState; r: RajaStrings; lang: Lang; onQuit: () => void };

export default function RajaPlay() {
  useKeepAwake();
  const router = useRouter();
  const { lang } = useGame();
  const { game, r, end } = useRaja();
  const { quit, goHome } = useQuitGuard(end);

  const hadGameOnMount = useRef(!!game);
  useEffect(() => {
    if (!hadGameOnMount.current) router.replace('/raja/setup');
  }, [router]);

  if (!game) return null;
  const common = { game, r, lang, onQuit: quit };

  switch (game.phase) {
    case 'deal':
      return <DealPhase key={`deal-${game.round.number}-${game.revealIndex}`} {...common} />;
    case 'showdown':
      return <ShowdownPhase key={`show-${game.round.number}`} {...common} />;
    case 'result':
      return <ResultPhase key={`result-${game.round.number}`} {...common} />;
    case 'final':
      return <FinalPhase {...common} onHome={goHome} />;
  }
}

/* Deal: each player secretly reads their slip ----------------------- */

function DealPhase({ game, r, lang, onQuit }: PhaseProps) {
  const { t } = useGame();
  const { dispatch } = useRaja();
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);

  const index = game.revealIndex;
  const name = game.players[index];
  const role = game.round.roles[index];
  const style = ROLE_STYLE[role];
  const isLast = index === game.players.length - 1;
  const tip =
    role === 'raja' ? r.tipRaja : role === 'chor' ? r.tipChor(game.catcher) : role === game.catcher ? r.tipCatcher : r.tipSafe;

  return (
    <Screen>
      <TopBar label={`${r.roundOf(game.round.number, game.totalRounds)} · ${r.slipOf(index + 1, game.players.length)}`} onQuit={onQuit} />
      <View style={styles.dots}>
        {game.players.map((p, i) => (
          <View
            key={p}
            style={[styles.dot, { backgroundColor: i < index ? colors.mint : i === index ? colors.marigold : colors.line }]}
          />
        ))}
      </View>

      <View style={styles.top}>
        {holding ? (
          <RevealCard color={style.color} tilt={-2}>
            <T font="bodyBold" size={13} color={colors.ink} style={{ position: 'absolute', top: 18, left: 22, opacity: 0.7 }}>
              {r.slip}
            </T>
            <Icon name={style.icon} size={84} color={colors.ink} strokeWidth={1.6} />
            <T font="display" size={58} color={colors.ink} style={{ lineHeight: 70 }}>
              {r.role[role]}
            </T>
            <CardChip>{r.pointsLabel(game.points[role])}</CardChip>
            <T font="bodyMedium" size={15} color={colors.ink} style={sharedStyles.center}>
              {tip}
            </T>
          </RevealCard>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <T size={18} color={colors.textMuted}>
              {t.passTo}
            </T>
            <T font="display" size={60} color={colors.marigold} style={[sharedStyles.center, { lineHeight: 74 }]} numberOfLines={1} adjustsFontSizeToFit>
              {name}
            </T>
            <T size={16} color={colors.textSoft} style={sharedStyles.center}>
              {t.passToSuffix}
            </T>
          </View>
        )}
      </View>

      <View style={{ alignItems: 'center', gap: 16 }}>
        <HoldButton
          label={t.hold}
          sub={r.toRead}
          holding={holding}
          onPressIn={() => {
            setHolding(true);
            setSeen(true);
          }}
          onPressOut={() => setHolding(false)}
        />
        {seen && !holding ? (
          <Button
            label={isLast ? r.seenStart : r.seenPass}
            icon="arrow"
            variant="outline"
            onPress={() => dispatch({ type: 'nextReveal' })}
            style={{ alignSelf: 'stretch' }}
          />
        ) : (
          <FootNote text={r.releaseHides} />
        )}
      </View>
    </Screen>
  );
}

/* Showdown: Raja and the catcher are revealed, the catcher picks ---- */

function ShowdownPhase({ game, r, onQuit }: PhaseProps) {
  const { dispatch } = useRaja();
  const [picked, setPicked] = useState<number | null>(null);

  const rajaIdx = roleIndex(game.round, 'raja');
  const catcherIdx = roleIndex(game.round, game.catcher);
  const other = game.catcher === 'police' ? 'mantri' : 'police';
  const catcherName = game.players[catcherIdx];
  const options = suspects(game.round, game.catcher);

  return (
    <Screen>
      <TopBar label={r.roundOf(game.round.number, game.totalRounds)} onQuit={onQuit} />
      <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={styles.revealedRow}>
          {[
            { idx: rajaIdx, role: 'raja' as const },
            { idx: catcherIdx, role: game.catcher },
          ].map(({ idx, role }) => (
            <View
              key={role}
              style={[styles.revealed, { borderColor: ROLE_STYLE[role].color, backgroundColor: `${ROLE_STYLE[role].color}1F` }]}
            >
              <RoleBadge role={role} size={40} />
              <View style={{ flex: 1 }}>
                <T size={13} color={ROLE_STYLE[role].text}>
                  {r.role[role]}
                </T>
                <T font="bodyBold" size={17} numberOfLines={1}>
                  {game.players[idx]}
                </T>
              </View>
            </View>
          ))}
        </View>

        <View style={{ alignItems: 'center', gap: 2, paddingTop: 4 }}>
          <T size={16} color={colors.textSoft}>
            {r.order}
          </T>
          <T
            font="display"
            size={40}
            color={ROLE_STYLE[game.catcher].color}
            style={[sharedStyles.center, { lineHeight: 50 }]}
            accessibilityRole="header"
          >
            {r.ask(catcherName)}
          </T>
          <T size={15} color={colors.textMuted} style={sharedStyles.center}>
            {r.hintTwo(other)}
          </T>
        </View>

        <View style={styles.suspects} accessibilityRole="radiogroup" accessibilityLabel={r.pickLabel}>
          {options.map((i) => {
            const on = picked === i;
            return (
              <Pressable
                key={i}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={game.players[i]}
                onPress={() => {
                  setPicked(i);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={[styles.suspect, on && styles.suspectOn]}
              >
                {on && (
                  <View style={styles.check}>
                    <Icon name="check" size={15} color={colors.ink} strokeWidth={3.2} />
                  </View>
                )}
                <View style={[styles.hiddenSlip, on && { borderColor: colors.coral }]}>
                  <T font="display" size={46} color={on ? colors.coralText : colors.textMuted} style={{ lineHeight: 56 }}>
                    ?
                  </T>
                </View>
                <T font={on ? 'bodyBold' : 'bodySemi'} size={19} numberOfLines={1}>
                  {game.players[i]}
                </T>
              </Pressable>
            );
          })}
        </View>

        <T size={14} color={colors.textMuted} style={sharedStyles.center}>
          {r.warning(catcherName, game.points[game.catcher])}
        </T>
      </ScrollView>

      <Button
        label={picked == null ? r.pickOne : r.catchBtn(game.players[picked])}
        variant="danger"
        disabled={picked == null}
        onPress={() => {
          if (picked == null) return;
          const right = game.round.roles[picked] === 'chor';
          Haptics.notificationAsync(
            right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
          dispatch({ type: 'accuse', index: picked });
        }}
      />
    </Screen>
  );
}

/* Round result + running totals ------------------------------------ */

function ResultPhase({ game, r, lang, onQuit }: PhaseProps) {
  const { dispatch } = useRaja();
  const { roles, accused, gained } = game.round;
  const chorIdx = roleIndex(game.round, 'chor');
  const catcherIdx = roleIndex(game.round, game.catcher);
  const right = accused === chorIdx;
  const isLast = game.round.number >= game.totalRounds;
  const order = (['raja', 'mantri', 'police', 'chor'] as const).map((role) => roles.indexOf(role));

  return (
    <Screen>
      <TopBar label={r.roundOf(game.round.number, game.totalRounds)} onQuit={onQuit} />
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[sharedStyles.banner, { backgroundColor: right ? colors.mint : colors.coral }]}>
          <T font="display" size={34} color={colors.ink} style={{ lineHeight: 44 }} accessibilityRole="header">
            {right ? r.caught : r.missed}
          </T>
          <T font="bodySemi" size={16} color={colors.ink} style={sharedStyles.center}>
            {right ? r.caughtSub(game.players[catcherIdx], game.players[chorIdx]) : r.missedSub(game.players[chorIdx])}
          </T>
        </View>

        <View style={{ gap: 8 }}>
          <T font="bodySemi" size={15} color={colors.textMuted} accessibilityRole="header">
            {r.thisRound}
          </T>
          <View style={sharedStyles.list}>
            {order.map((p, k) => {
              const role = roles[p];
              const note =
                p === catcherIdx ? (right ? r.noteRight : r.noteWrong) : role === 'chor' ? (right ? r.noteCaught : r.noteEscaped) : null;
              return (
                <View key={p} style={[sharedStyles.listRow, { minHeight: 54 }, k < 3 && sharedStyles.divider]}>
                  <RoleBadge role={role} size={32} />
                  <View style={{ flex: 1 }}>
                    <T font="bodySemi" size={16}>
                      {game.players[p]}
                    </T>
                    <T size={13} color={colors.textMuted}>
                      {note ? `${r.role[role]} · ${note}` : r.role[role]}
                    </T>
                  </View>
                  <T font="displayBold" size={20} color={ROLE_STYLE[role].text}>
                    +{num(gained?.[p] ?? 0, lang)}
                  </T>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <T font="bodySemi" size={15} color={colors.textMuted} accessibilityRole="header">
            {r.totalAfter(game.round.number)}
          </T>
          <Scoreboard game={game} lang={lang} />
        </View>
      </ScrollView>

      <Button label={isLast ? r.seeWinner : r.nextRound} icon="arrow" onPress={() => dispatch({ type: 'next' })} />
    </Screen>
  );
}

function Scoreboard({ game, lang }: { game: RajaState; lang: Lang }) {
  const rows = ranking(game.players, game.scores);
  return (
    <View style={sharedStyles.list}>
      {rows.map((row, k) => (
        <View key={row.name} style={[sharedStyles.listRow, k < rows.length - 1 && sharedStyles.divider]}>
          <T font="bodyBold" size={15} color={k === 0 ? colors.marigold : colors.textMuted} style={{ width: 20 }}>
            {num(k + 1, lang)}
          </T>
          <T font={k === 0 ? 'bodySemi' : 'body'} size={16} style={{ flex: 1 }}>
            {row.name}
          </T>
          <T font="display" size={19} color={k === 0 ? colors.marigold : colors.text}>
            {num(row.score, lang)}
          </T>
        </View>
      ))}
    </View>
  );
}

/* Final: podium ------------------------------------------------------ */

function FinalPhase({ game, r, lang, onHome }: PhaseProps & { onHome: () => void }) {
  const { dispatch, settings } = useRaja();
  const rows = ranking(game.players, game.scores);
  const top = rows[0];
  const tied = rows.filter((x) => x.score === top.score);
  const podium = [rows[1], rows[0], rows[2]];
  const heights = [120, 170, 90];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <Screen style={{ alignItems: 'center', gap: 10, paddingTop: 28 }}>
      <T font="bodySemi" size={15} color={colors.textMuted}>
        {r.roundsDone(game.totalRounds)}
      </T>
      <Icon name="crown" size={92} color={colors.marigold} strokeWidth={1.5} />
      <T font="display" size={44} color={colors.marigold} style={[sharedStyles.center, { lineHeight: 56 }]} accessibilityRole="header">
        {tied.length > 1 ? r.tie : r.winner(top.name)}
      </T>
      <T size={17} color={colors.textSoft} style={sharedStyles.center}>
        {tied.length > 1 ? r.tieSub(tied.map((x) => x.name).join(', ')) : r.winnerSub(top.score)}
      </T>

      <View style={styles.podium} accessibilityLabel={r.topThree}>
        {podium.map((row, k) => {
          const first = k === 1;
          return (
            <View key={row.name} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <T font={first ? 'bodyBold' : 'bodySemi'} size={first ? 17 : 16} color={first ? colors.marigold : colors.text} numberOfLines={1}>
                {row.name}
              </T>
              <T font="displayBold" size={first ? 20 : 18} color={first ? colors.marigold : colors.textSoft}>
                {num(row.score, lang)}
              </T>
              <View style={[styles.step, { height: heights[k] }, first ? { backgroundColor: colors.marigold, borderWidth: 0 } : null]}>
                <T font="display" size={first ? 36 : 30} color={first ? colors.ink : colors.textMuted} style={{ lineHeight: 44 }}>
                  {num(rows.indexOf(row) + 1, lang)}
                </T>
              </View>
            </View>
          );
        })}
      </View>
      <View style={[sharedStyles.listRow, styles.fourth]}>
        <T font="bodyBold" size={15} color={colors.textMuted} style={{ width: 20 }}>
          {num(4, lang)}
        </T>
        <T size={16} style={{ flex: 1 }}>
          {rows[3].name}
        </T>
        <T font="displayBold" size={19}>
          {num(rows[3].score, lang)}
        </T>
      </View>

      <View style={[sharedStyles.row2, { marginTop: 'auto', alignSelf: 'stretch' }]}>
        <Button label={r.home} variant="ghost" height={56} onPress={onHome} style={{ flex: 1 }} />
        <Button label={r.again} height={56} onPress={() => dispatch({ type: 'start', settings })} style={{ flex: 2 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 40, height: 6, borderRadius: radius.pill },
  top: { flex: 1, justifyContent: 'center', alignItems: 'stretch', paddingVertical: 16 },
  revealedRow: { flexDirection: 'row', gap: 10 },
  revealed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  suspects: { flexDirection: 'row', gap: 12 },
  suspect: {
    flex: 1,
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  suspectOn: { borderWidth: 3, borderColor: colors.coral, backgroundColor: 'rgba(255,107,107,0.14)' },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenSlip: {
    width: 84,
    height: 108,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, alignSelf: 'stretch', marginTop: 16 },
  step: {
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    paddingTop: 10,
  },
  fourth: {
    alignSelf: 'stretch',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
