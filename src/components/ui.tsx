import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/theme';
import { Icon, type IconName } from './Icon';

type Font = keyof typeof fonts;

/** Text with the app's Bangla-friendly fonts. Use `font`, never `fontWeight`. */
export function T({
  font = 'body',
  size = 16,
  color = colors.text,
  style,
  ...rest
}: TextProps & { font?: Font; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts[font], fontSize: size, color, lineHeight: Math.round(size * 1.4) }, style]}
    />
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.screen, style]}>{children}</View>
    </SafeAreaView>
  );
}

type ButtonVariant = 'primary' | 'danger' | 'outline' | 'outlineDanger' | 'ghost';

const variantStyles: Record<ButtonVariant, { box: ViewStyle; text: string }> = {
  primary: { box: { backgroundColor: colors.marigold }, text: colors.ink },
  danger: { box: { backgroundColor: colors.coral }, text: colors.ink },
  outline: { box: { borderWidth: 2, borderColor: colors.marigold }, text: colors.marigold },
  outlineDanger: { box: { borderWidth: 2, borderColor: colors.coral }, text: colors.coralText },
  ghost: { box: { borderWidth: 1, borderColor: colors.lineStrong }, text: colors.text },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  height = 60,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const v = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { height },
        v.box,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <T font={variant === 'ghost' ? 'bodySemi' : 'display'} size={variant === 'ghost' ? 16 : 20} color={v.text}>
        {label}
      </T>
      {icon ? <Icon name={icon} size={20} color={v.text} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }, style]}
    >
      <Icon name={icon} size={22} color={color} strokeWidth={2.2} />
    </Pressable>
  );
}

/** A selectable pill/tile used for counts and categories. */
export function Choice({
  label,
  selected,
  onPress,
  tone = 'marigold',
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: 'marigold' | 'coral';
  style?: StyleProp<ViewStyle>;
}) {
  const selectedBox: ViewStyle =
    tone === 'marigold'
      ? { backgroundColor: colors.marigold, borderColor: colors.marigold }
      : { backgroundColor: 'rgba(255,107,107,0.14)', borderColor: colors.coral, borderWidth: 2 };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && selectedBox, pressed && { opacity: 0.8 }, style]}
    >
      <T
        font={selected ? 'bodyBold' : 'bodySemi'}
        size={16}
        color={selected && tone === 'marigold' ? colors.ink : selected ? colors.text : colors.textSoft}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </T>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <T font="bodySemi" size={15} color={colors.textMuted} accessibilityRole="header">
      {children}
    </T>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  button: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  choice: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
