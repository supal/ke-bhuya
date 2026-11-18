import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Choice, IconButton, Screen, SectionTitle, T } from '@/components/ui';
import { CATEGORIES, MAX_PLAYERS, validateSettings } from '@/game/engine';
import { useGame } from '@/game/GameContext';
import { num } from '@/i18n/strings';
import { colors, fonts, radius } from '@/theme';

const TIMER_OPTIONS = [20, 30, 45, 60];

export default function Setup() {
  const router = useRouter();
  const { t, lang, settings, updateSettings, dispatch } = useGame();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { players, imposterCount, categoryIds, showHint, timerOn, timerSeconds } = settings;

  function addPlayer() {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;
    if (players.length >= MAX_PLAYERS) return setError(t.errMaxPlayers);
    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return setError(t.errDuplicate);
    updateSettings({ players: [...players, trimmed] });
    setName('');
    setError(null);
  }

  function removePlayer(index: number) {
    const next = players.filter((_, i) => i !== index);
    updateSettings({ players: next, imposterCount: next.length < 5 ? 1 : imposterCount });
    setError(null);
  }

  function toggleCategory(id: string) {
    const next = categoryIds.includes(id) ? categoryIds.filter((c) => c !== id) : [...categoryIds, id];
    updateSettings({ categoryIds: next });
    setError(null);
  }

  function start() {
    const problem = validateSettings(settings);
    if (problem) return setError(t[problem]);
    dispatch({ type: 'start', settings });
    router.push('/play');
  }

  return (
    <Screen style={{ paddingBottom: 12 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton icon="back" label={t.back} onPress={() => router.back()} />
          <T font="displayBold" size={26} accessibilityRole="header">
            {t.newGame}
          </T>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionTitle>{t.players(players.length)}</SectionTitle>
            {players.length > 0 && (
              <View style={styles.chips}>
                {players.map((p, i) => (
                  <View key={p} style={styles.playerChip}>
                    <T font="bodyMedium" size={16}>
                      {p}
                    </T>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.removePlayer(p)}
                      onPress={() => removePlayer(i)}
                      hitSlop={6}
                      style={styles.chipRemove}
                    >
                      <Icon name="close" size={16} color={colors.textMuted} strokeWidth={2.4} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.addRow}>
              <TextInput
                value={name}
                onChangeText={setName}
                onSubmitEditing={addPlayer}
                placeholder={t.addPlaceholder}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t.newPlayerLabel}
                returnKeyType="done"
                submitBehavior="submit"
                maxLength={20}
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.addPlayer}
                onPress={addPlayer}
                style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
              >
                <Icon name="plus" size={22} color={colors.ink} strokeWidth={2.6} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{t.imposterCount}</SectionTitle>
            <View style={styles.grid2}>
              {([1, 2] as const).map((n) => (
                <Choice
                  key={n}
                  label={t.countOption(n)}
                  selected={imposterCount === n}
                  tone="coral"
                  onPress={() => {
                    if (n === 2 && players.length < 5) return setError(t.errTwoImposters);
                    updateSettings({ imposterCount: n });
                    setError(null);
                  }}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{t.chooseCategories}</SectionTitle>
            <View style={styles.grid3}>
              {CATEGORIES.map((c) => (
                <Choice
                  key={c.id}
                  label={c.name[lang]}
                  selected={categoryIds.includes(c.id)}
                  onPress={() => toggleCategory(c.id)}
                  style={styles.grid3Item}
                />
              ))}
            </View>
          </View>

          <View style={styles.toggles}>
            <ToggleRow
              title={t.hintTitle}
              subtitle={t.hintSub}
              value={showHint}
              onChange={(v) => updateSettings({ showHint: v })}
              divider
            />
            <ToggleRow
              title={t.timerTitle}
              subtitle={timerOn ? t.timerSub(timerSeconds) : t.timerOff}
              value={timerOn}
              onChange={(v) => updateSettings({ timerOn: v })}
            />
            {timerOn && (
              <View style={styles.timerOptions}>
                {TIMER_OPTIONS.map((s) => (
                  <Choice
                    key={s}
                    label={num(s, lang)}
                    selected={timerSeconds === s}
                    onPress={() => updateSettings({ timerSeconds: s })}
                    style={{ flex: 1, height: 44 }}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {error && (
          <T font="bodySemi" size={15} color={colors.coralText} style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </T>
        )}
        <Button label={t.start} icon="play" onPress={start} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  divider,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  divider?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, divider && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <View style={{ flex: 1 }}>
        <T font="bodySemi" size={16}>
          {title}
        </T>
        <T size={13} color={colors.textMuted}>
          {subtitle}
        </T>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ false: colors.surfaceMuted, true: colors.mint }}
        thumbColor={value ? colors.ink : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scroll: { gap: 20, paddingBottom: 16 },
  section: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  chipRemove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid2: { flexDirection: 'row', gap: 8 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid3Item: { width: '31.5%', flexGrow: 1 },
  toggles: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16 },
  timerOptions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  error: { textAlign: 'center', marginBottom: 8 },
});
