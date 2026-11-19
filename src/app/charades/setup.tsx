import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Choice, IconButton, Screen, SectionTitle, T } from '@/components/ui';
import {
  CHARADES_CATEGORIES,
  MAX_TEAMS,
  MIN_TEAMS,
  SECONDS_OPTIONS,
  TEAM_COLORS,
  TURN_OPTIONS,
  validateCharades,
  type Team,
} from '@/game/charades/engine';
import { useCharades } from '@/game/charades/CharadesContext';
import { useGame } from '@/game/GameContext';
import { colors, fonts, radius } from '@/theme';

export default function CharadesSetup() {
  const router = useRouter();
  const { t, lang } = useGame();
  const { c, settings, updateSettings, dispatch } = useCharades();
  const [drafts, setDrafts] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const { teams, categoryIds, seconds, turnsPerTeam } = settings;

  function setTeams(next: Team[]) {
    updateSettings({ teams: next });
    setError(null);
  }

  function addMember(ti: number) {
    const name = drafts[ti].trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (!teams[ti].members.includes(name)) {
      setTeams(teams.map((tm, i) => (i === ti ? { ...tm, members: [...tm.members, name] } : tm)));
    }
    setDrafts((d) => d.map((v, i) => (i === ti ? '' : v)));
  }

  function addTeam() {
    if (teams.length >= MAX_TEAMS) return;
    const used = new Set(teams.map((tm) => tm.name));
    const name = c.defaultTeams.find((n) => !used.has(n)) ?? `${c.defaultTeams[0]} ${teams.length + 1}`;
    setTeams([...teams, { name, members: [] }]);
  }

  function removeTeam(ti: number) {
    setTeams(teams.filter((_, i) => i !== ti));
    setDrafts((d) => [...d.filter((_, i) => i !== ti), '']);
  }

  function toggleCategory(id: string) {
    updateSettings({ categoryIds: categoryIds.includes(id) ? categoryIds.filter((x) => x !== id) : [...categoryIds, id] });
    setError(null);
  }

  function start() {
    const problem = validateCharades(settings);
    if (problem) return setError(c[problem]);
    dispatch({ type: 'start', settings });
    router.push('/charades/play');
  }

  return (
    <Screen style={{ paddingBottom: 12 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton icon="back" label={t.back} onPress={() => router.back()} />
          <T font="displayBold" size={26} accessibilityRole="header">
            {c.title}
          </T>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <SectionTitle>{c.teams(teams.length)}</SectionTitle>
            {teams.map((team, ti) => (
              <View key={ti} style={styles.team}>
                <View style={styles.teamHead}>
                  <View style={[styles.teamDot, { backgroundColor: TEAM_COLORS[ti] }]} />
                  <TextInput
                    value={team.name}
                    onChangeText={(v) => setTeams(teams.map((tm, i) => (i === ti ? { ...tm, name: v } : tm)))}
                    accessibilityLabel={c.teamNameLabel(ti + 1)}
                    maxLength={20}
                    style={styles.teamName}
                  />
                  {teams.length > MIN_TEAMS && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={c.removeTeam(team.name)}
                      onPress={() => removeTeam(ti)}
                      hitSlop={6}
                      style={styles.smallBtn}
                    >
                      <Icon name="close" size={16} color={colors.textMuted} strokeWidth={2.4} />
                    </Pressable>
                  )}
                </View>
                {team.members.length > 0 && (
                  <View style={styles.chips}>
                    {team.members.map((m) => (
                      <View key={m} style={styles.member}>
                        <T size={14}>{m}</T>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={c.removeMember(m)}
                          onPress={() =>
                            setTeams(teams.map((tm, i) => (i === ti ? { ...tm, members: tm.members.filter((x) => x !== m) } : tm)))
                          }
                          hitSlop={8}
                        >
                          <Icon name="close" size={14} color={colors.textMuted} strokeWidth={2.4} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.addRow}>
                  <TextInput
                    value={drafts[ti]}
                    onChangeText={(v) => setDrafts((d) => d.map((x, i) => (i === ti ? v : x)))}
                    onSubmitEditing={() => addMember(ti)}
                    placeholder={c.memberPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={c.addMember(team.name)}
                    returnKeyType="done"
                    submitBehavior="submit"
                    maxLength={20}
                    style={styles.memberInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={c.addMember(team.name)}
                    onPress={() => addMember(ti)}
                    style={[styles.smallBtn, { borderColor: TEAM_COLORS[ti] }]}
                  >
                    <Icon name="plus" size={18} color={TEAM_COLORS[ti]} strokeWidth={2.6} />
                  </Pressable>
                </View>
              </View>
            ))}
            {teams.length < MAX_TEAMS && (
              <Pressable accessibilityRole="button" onPress={addTeam} style={({ pressed }) => [styles.addTeam, pressed && { opacity: 0.7 }]}>
                <Icon name="plus" size={18} color={colors.textSoft} strokeWidth={2.4} />
                <T font="bodySemi" size={15} color={colors.textSoft}>
                  {c.addTeam}
                </T>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle>{c.topics}</SectionTitle>
            <View style={styles.grid}>
              {CHARADES_CATEGORIES.map((cat) => (
                <Choice
                  key={cat.id}
                  label={cat.name[lang]}
                  selected={categoryIds.includes(cat.id)}
                  onPress={() => toggleCategory(cat.id)}
                  style={styles.grid3Item}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{c.time}</SectionTitle>
            <View style={styles.grid}>
              {SECONDS_OPTIONS.map((s) => (
                <Choice key={s} label={c.secondsShort(s)} selected={seconds === s} onPress={() => updateSettings({ seconds: s })} style={{ flex: 1 }} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle>{c.turns}</SectionTitle>
            <View style={styles.grid}>
              {TURN_OPTIONS.map((n) => (
                <Choice key={n} label={c.turnsOpt(n)} selected={turnsPerTeam === n} onPress={() => updateSettings({ turnsPerTeam: n })} style={{ flex: 1 }} />
              ))}
            </View>
          </View>
        </ScrollView>

        {error && (
          <T font="bodySemi" size={15} color={colors.coralText} style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </T>
        )}
        <Button label={c.start} icon="play" onPress={start} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scroll: { gap: 20, paddingBottom: 16 },
  section: { gap: 10 },
  team: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  teamHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamDot: { width: 14, height: 14, borderRadius: radius.pill },
  teamName: { flex: 1, color: colors.text, fontFamily: fonts.displayBold, fontSize: 19, paddingVertical: 2 },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  addRow: { flexDirection: 'row', gap: 8 },
  memberInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  addTeam: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid3Item: { width: '31.5%', flexGrow: 1 },
  error: { textAlign: 'center', marginBottom: 8 },
});
