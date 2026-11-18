import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Screen, SectionTitle, T } from '@/components/ui';
import { useGame } from '@/game/GameContext';
import type { Lang } from '@/i18n/strings';
import { colors, radius } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { t, lang, updateSettings } = useGame();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <LangToggle lang={lang} onChange={(l) => updateSettings({ lang: l })} />
        </View>

        <View style={styles.hero}>
          <Icon name="mask" size={72} color={colors.marigold} strokeWidth={1.6} />
          <T font="display" size={58} color={colors.marigold} style={{ lineHeight: 70 }} accessibilityRole="header">
            {t.appName}
          </T>
          <T size={16} color={colors.textMuted}>
            {t.tagline}
          </T>
        </View>

        <View style={{ gap: 12 }}>
          <SectionTitle>{t.chooseGame}</SectionTitle>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.imposterTitle}. ${t.imposterDesc}`}
            onPress={() => router.push('/setup')}
            style={({ pressed }) => [styles.gameCard, styles.gameCardActive, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.gameIcon, { backgroundColor: colors.marigold }]}>
              <Icon name="person" size={32} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <T font="displayBold" size={24}>
                {t.imposterTitle}
              </T>
              <T size={15} color={colors.textSoft}>
                {t.imposterDesc}
              </T>
              <T size={13} color={colors.textMuted}>
                {t.playersRange}
              </T>
            </View>
            <Icon name="chevron" size={28} color={colors.marigold} strokeWidth={2.2} />
          </Pressable>

          <ComingSoonCard icon="crown" title={t.rajaMantri} badge={t.comingSoon} />
          <ComingSoonCard icon="hand" title={t.charades} badge={t.comingSoon} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/how-to-play')}
          style={({ pressed }) => [styles.helpButton, pressed && { opacity: 0.75 }]}
        >
          <Icon name="help" size={20} color={colors.text} />
          <T font="bodySemi" size={16}>
            {t.howToPlay}
          </T>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function ComingSoonCard({ icon, title, badge }: { icon: IconName; title: string; badge: string }) {
  return (
    <View style={styles.gameCard} accessible accessibilityLabel={`${title}. ${badge}`}>
      <View style={[styles.gameIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={icon} size={30} color={colors.textMuted} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <T font="displayBold" size={20} color={colors.textSoft}>
          {title}
        </T>
        <View style={styles.badge}>
          <T font="bodySemi" size={13} color={colors.textMuted}>
            {badge}
          </T>
        </View>
      </View>
    </View>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const options: { id: Lang; label: string }[] = [
    { id: 'bn', label: 'বাংলা' },
    { id: 'en', label: 'EN' },
  ];
  return (
    <View style={styles.langGroup} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.id === lang;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={[styles.langOption, on && { backgroundColor: colors.marigold }]}
          >
            <T font={on ? 'bodyBold' : 'bodySemi'} size={15} color={on ? colors.ink : colors.textMuted}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, gap: 24, paddingBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  hero: { alignItems: 'center', gap: 2, paddingTop: 4 },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  gameCardActive: { backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.marigold },
  gameIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  helpButton: {
    marginTop: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  langGroup: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  langOption: {
    height: 36,
    minWidth: 56,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
