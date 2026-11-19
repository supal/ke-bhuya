import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Screen, SectionTitle, T } from '@/components/ui';
import { ROLE_STYLE } from '@/components/roles';
import { useGame } from '@/game/GameContext';
import { charadesStrings } from '@/i18n/charades';
import { rajaStrings } from '@/i18n/raja';
import type { Lang } from '@/i18n/strings';
import { colors, radius } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { t, lang, updateSettings } = useGame();
  const r = rajaStrings[lang];
  const c = charadesStrings[lang];

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

          <GameCard
            icon="person"
            color={colors.marigold}
            title={t.imposterTitle}
            desc={t.imposterDesc}
            meta={t.playersRange}
            onPress={() => router.push('/imposter/setup')}
          />
          <GameCard
            icon="crown"
            color={ROLE_STYLE.police.color}
            title={r.title}
            desc={r.desc}
            meta={r.playersMeta}
            onPress={() => router.push('/raja/setup')}
          />
          <GameCard
            icon="hand"
            color="#7C9CFF"
            title={c.title}
            desc={c.desc}
            meta={c.meta}
            onPress={() => router.push('/charades/setup')}
          />
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

function GameCard({
  icon,
  color,
  title,
  desc,
  meta,
  onPress,
}: {
  icon: IconName;
  color: string;
  title: string;
  desc: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}`}
      onPress={onPress}
      style={({ pressed }) => [styles.gameCard, pressed && { opacity: 0.85, borderColor: color }]}
    >
      <View style={[styles.gameIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={30} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T font="displayBold" size={21} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </T>
        <T size={14} color={colors.textSoft}>
          {desc}
        </T>
        <T size={13} color={colors.textMuted}>
          {meta}
        </T>
      </View>
      <Icon name="chevron" size={26} color={color} strokeWidth={2.2} />
    </Pressable>
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
  gameIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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
