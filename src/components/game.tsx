/**
 * Building blocks shared by every pass-and-play game: the top bar with a quit
 * button, the hold-to-reveal button, the countdown ring, big fitted text,
 * name initials and the quit guard for the Android back button.
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useGame } from '@/game/GameContext';
import { num, type Lang } from '@/i18n/strings';
import { colors, radius } from '@/theme';
import { Icon } from './Icon';
import { IconButton, T } from './ui';

export function TopBar({ label, onQuit, right }: { label: string; onQuit: () => void; right?: ReactNode }) {
  const { t } = useGame();
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

/**
 * Asks before leaving a running game, from the X button or Android's back
 * button. `end` runs after the screen has left, so it never renders without a game.
 */
export function useQuitGuard(end: () => void) {
  const router = useRouter();
  const { t } = useGame();

  const leave = useCallback(() => {
    router.back();
    setTimeout(end, 400);
  }, [router, end]);

  const goHome = useCallback(() => {
    router.dismissTo('/');
    setTimeout(end, 400);
  }, [router, end]);

  const quit = useCallback(() => {
    Alert.alert(t.exitTitle, t.exitBody, [
      { text: t.exitCancel, style: 'cancel' },
      { text: t.exitConfirm, style: 'destructive', onPress: leave },
    ]);
  }, [t, leave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      quit();
      return true;
    });
    return () => sub.remove();
  }, [quit]);

  return { quit, leave, goHome };
}

/** The big round "press and hold" button. */
export function HoldButton({
  label,
  sub,
  holding,
  onPressIn,
  onPressOut,
  size = 180,
}: {
  label: string;
  sub: string;
  holding: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sub}`}
      onPressIn={() => {
        onPressIn();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }}
      onPressOut={onPressOut}
      style={[
        styles.holdButton,
        { width: size, height: size },
        holding && { backgroundColor: 'rgba(255,182,39,0.28)' },
      ]}
    >
      <Icon name="fingerprint" size={Math.round(size * 0.29)} color={colors.marigold} strokeWidth={1.6} />
      <T font="displayBold" size={19}>
        {label}
      </T>
      <T size={13} color={colors.textSoft}>
        {sub}
      </T>
    </Pressable>
  );
}

export function FootNote({ icon = 'eyeOff', text }: { icon?: 'eyeOff' | 'eye'; text: string }) {
  return (
    <View style={styles.footNote}>
      <Icon name={icon} size={18} color={colors.textMuted} />
      <T size={15} color={colors.textMuted}>
        {text}
      </T>
    </View>
  );
}

/** A tilted, coloured card for secret words, roles and prompts. */
export function RevealCard({
  color,
  tilt = -2,
  children,
  style,
}: {
  color: string;
  tilt?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, { backgroundColor: color, transform: [{ rotate: `${tilt}deg` }] }, style]}>{children}</View>;
}

export function CardChip({ children }: { children: ReactNode }) {
  return (
    <View style={styles.cardChip}>
      <T font="bodyBold" size={16} color={colors.ink}>
        {children}
      </T>
    </View>
  );
}

/**
 * Text as large as it fits. A single word stays on one line so it never
 * breaks in the middle (চিড়িয়াখা / না); phrases may use up to `maxLines`.
 */
export function FitText({
  text,
  color = colors.ink,
  maxSize = 68,
  maxLines = 2,
}: {
  text: string;
  color?: string;
  maxSize?: number;
  maxLines?: number;
}) {
  const length = Array.from(text).length;
  const size = Math.min(maxSize, length <= 6 ? 68 : length <= 9 ? 54 : length <= 13 ? 44 : length <= 20 ? 38 : 32);
  const singleWord = !text.trim().includes(' ');
  return (
    <T
      font="display"
      size={size}
      color={color}
      style={{ textAlign: 'center', lineHeight: Math.round(size * 1.25), alignSelf: 'stretch' }}
      numberOfLines={singleWord ? 1 : maxLines}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
    >
      {text}
    </T>
  );
}

/**
 * Seconds left, counting down once a second from `total`. Mount it with a
 * `key` per turn so each turn starts fresh. Buzzes when time runs out.
 */
export function useCountdown(total: number, running = true) {
  const [left, setLeft] = useState(total);
  useEffect(() => {
    if (!running) return;
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
  }, [running]);
  return left;
}

export function TimerRing({
  left,
  total,
  lang,
  unit,
  timeUp,
  a11yLabel,
  size = 168,
}: {
  left: number;
  total: number;
  lang: Lang;
  unit: string;
  timeUp: string;
  a11yLabel: string;
  size?: number;
}) {
  const stroke = size >= 220 ? 16 : 12;
  const r = size / 2 - stroke - 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={a11yLabel}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={mid} cy={mid} r={r} fill="none" stroke={colors.surfaceMuted} strokeWidth={stroke} />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={left > 5 ? colors.mint : colors.coral}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left / total)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        {left > 0 ? (
          <>
            <T font="display" size={Math.round(size * 0.3)} style={{ lineHeight: Math.round(size * 0.34) }}>
              {num(left, lang)}
            </T>
            <T size={14} color={colors.textMuted}>
              {unit}
            </T>
          </>
        ) : (
          <T font="displayBold" size={24} color={colors.coralText}>
            {timeUp}
          </T>
        )}
      </View>
    </View>
  );
}

// Bengali vowel signs, nasal marks and nukta attach to the letter before them;
// a hasanta (্) joins the next consonant into a conjunct (e.g. শ্রা).
const BN_MARK = /[ঁ-ঃ়া-ৌৗ]/;
const BN_HASANTA = '্';

/** First letter of a name, keeping Bangla conjuncts and vowel signs whole. */
export function initials(name: string) {
  const chars = Array.from(name.trim());
  if (chars.length === 0) return '?';
  let out = chars[0];
  for (let i = 1; i < chars.length; i++) {
    const c = chars[i];
    const prev = chars[i - 1];
    if (BN_MARK.test(c) || c === BN_HASANTA || prev === BN_HASANTA || c === '‍') out += c;
    else break;
  }
  return out.toLocaleUpperCase();
}

/** Reads Bangla or Latin digits typed into a number field. */
export function parseDigits(text: string): number {
  const ascii = text.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/[^0-9]/g, '');
  return ascii ? Math.min(99999, parseInt(ascii, 10)) : 0;
}

export const sharedStyles = StyleSheet.create({
  list: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  row2: { flexDirection: 'row', gap: 10 },
  banner: { borderRadius: 24, padding: 18, alignItems: 'center', gap: 2 },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  center: { textAlign: 'center' },
});

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  holdButton: {
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.marigold,
    backgroundColor: 'rgba(255,182,39,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  footNote: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 60 },
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
  ringLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
