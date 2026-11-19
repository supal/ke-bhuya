import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { parseDigits } from '@/components/game';
import { RoleBadge, ROLE_STYLE } from '@/components/roles';
import { Button, Choice, IconButton, Screen, SectionTitle, T } from '@/components/ui';
import { useGame } from '@/game/GameContext';
import { ROLES, ROUND_OPTIONS, validateRaja } from '@/game/raja/engine';
import { useRaja } from '@/game/raja/RajaContext';
import { num } from '@/i18n/strings';
import { colors, fonts, radius } from '@/theme';

export default function RajaSetup() {
  const router = useRouter();
  const { t, lang, settings: shared } = useGame();
  const { r, settings, updateSettings, dispatch } = useRaja();
  const [error, setError] = useState<string | null>(null);
  const { players, points, catcher, rounds } = settings;

  // First visit: borrow the first four names from the Imposter player list.
  useEffect(() => {
    if (players.every((p) => !p) && shared.players.length > 0) {
      updateSettings({ players: [0, 1, 2, 3].map((i) => shared.players[i] ?? '') });
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPlayer(i: number, name: string) {
    updateSettings({ players: players.map((p, j) => (j === i ? name : p)) });
    setError(null);
  }

  function start() {
    const problem = validateRaja(settings);
    if (problem) return setError(r[problem]);
    dispatch({ type: 'start', settings });
    router.push('/raja/play');
  }

  return (
    <Screen style={{ paddingBottom: 12 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton icon="back" label={t.back} onPress={() => router.back()} />
          <T font="displayBold" size={22} accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1} adjustsFontSizeToFit>
            {r.title}
          </T>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <SectionTitle>{r.players}</SectionTitle>
            <View style={styles.grid2}>
              {players.map((p, i) => (
                <View key={i} style={styles.nameField}>
                  <T size={13} color={colors.textMuted}>
                    {num(i + 1, lang)}
                  </T>
                  <TextInput
                    value={p}
                    onChangeText={(v) => setPlayer(i, v)}
                    placeholder={r.playerN(i + 1)}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={r.playerN(i + 1)}
                    maxLength={20}
                    style={styles.nameInput}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{r.pointsTitle}</SectionTitle>
            <View style={styles.grid2}>
              {ROLES.map((role) => (
                <View key={role} style={styles.pointTile}>
                  <RoleBadge role={role} />
                  <View style={{ flex: 1 }}>
                    <T font="bodySemi" size={14}>
                      {r.role[role]}
                    </T>
                    <TextInput
                      value={num(points[role], lang)}
                      onChangeText={(v) => updateSettings({ points: { ...points, [role]: parseDigits(v) } })}
                      keyboardType="number-pad"
                      accessibilityLabel={r.pointsOf(role)}
                      maxLength={5}
                      style={[styles.pointInput, { color: ROLE_STYLE[role].text }]}
                    />
                  </View>
                </View>
              ))}
            </View>
            <T size={13} color={colors.textMuted}>
              {r.wrongRule}
            </T>
          </View>

          <View style={styles.section}>
            <SectionTitle>{r.whoCatches}</SectionTitle>
            <View style={styles.grid2}>
              {(['police', 'mantri'] as const).map((c) => (
                <Choice
                  key={c}
                  label={r.role[c]}
                  selected={catcher === c}
                  onPress={() => updateSettings({ catcher: c })}
                  style={[{ flex: 1 }, catcher === c && { backgroundColor: ROLE_STYLE[c].color, borderColor: ROLE_STYLE[c].color }]}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{r.rounds}</SectionTitle>
            <View style={styles.grid2}>
              {ROUND_OPTIONS.map((n) => (
                <Choice key={n} label={num(n, lang)} selected={rounds === n} onPress={() => updateSettings({ rounds: n })} style={{ flex: 1 }} />
              ))}
            </View>
          </View>
        </ScrollView>

        {error && (
          <T font="bodySemi" size={15} color={colors.coralText} style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </T>
        )}
        <Button label={r.start} icon="play" onPress={start} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scroll: { gap: 20, paddingBottom: 16 },
  section: { gap: 10 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nameField: {
    width: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  nameInput: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingVertical: 0 },
  pointTile: {
    width: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pointInput: { fontFamily: fonts.displayBold, fontSize: 20, paddingVertical: 0, height: 30 },
  error: { textAlign: 'center', marginBottom: 8 },
});
