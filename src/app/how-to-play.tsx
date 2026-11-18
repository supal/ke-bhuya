import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { useGame } from '@/game/GameContext';
import { num } from '@/i18n/strings';
import { colors, radius } from '@/theme';

export default function HowToPlay() {
  const router = useRouter();
  const { t, lang } = useGame();

  return (
    <Screen>
      <T font="display" size={32} color={colors.marigold} style={{ lineHeight: 44, marginBottom: 12 }} accessibilityRole="header">
        {t.rulesTitle}
      </T>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        {t.rules.map((rule, i) => (
          <View key={rule} style={styles.step}>
            <View style={styles.stepNum}>
              <T font="display" size={18} color={colors.ink} style={{ lineHeight: 24 }}>
                {num(i + 1, lang)}
              </T>
            </View>
            <T size={16} style={{ flex: 1 }}>
              {rule}
            </T>
          </View>
        ))}
        <T font="bodySemi" size={15} color={colors.textSoft} style={{ marginTop: 4 }}>
          {t.rulesScoring}
        </T>
      </ScrollView>
      <Button label={t.gotIt} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
