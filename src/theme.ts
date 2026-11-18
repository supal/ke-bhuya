export const colors = {
  bg: '#15132B',
  surface: '#1C1A35',
  surfaceRaised: '#221F3D',
  surfaceMuted: '#2A2650',
  line: '#34305A',
  lineStrong: '#3A3563',
  text: '#F5F3FF',
  textSoft: '#D6D2F0',
  textMuted: '#B8B3D9',
  marigold: '#FFB627',
  coral: '#FF6B6B',
  coralText: '#FF8A8A',
  mint: '#3DDC97',
  ink: '#15132B',
  avatars: ['#7C9CFF', '#3DDC97', '#FFB627', '#FF6B6B', '#E59CFF', '#5FD6E8'],
} as const;

/**
 * Android does not synthesize weights for custom fonts, so each weight is
 * its own family. Never combine these with `fontWeight`.
 */
export const fonts = {
  display: 'BalooDa2_800ExtraBold',
  displayBold: 'BalooDa2_700Bold',
  body: 'HindSiliguri_400Regular',
  bodyMedium: 'HindSiliguri_500Medium',
  bodySemi: 'HindSiliguri_600SemiBold',
  bodyBold: 'HindSiliguri_700Bold',
} as const;

export const radius = { sm: 14, md: 18, lg: 20, xl: 32, pill: 999 } as const;
