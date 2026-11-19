import { View } from 'react-native';

import type { Role } from '@/game/raja/engine';
import { colors } from '@/theme';
import { Icon, type IconName } from './Icon';

/** Colour, softer text colour and icon for each Raja-Mantri-Chor-Police slip. */
export const ROLE_STYLE: Record<Role, { color: string; text: string; icon: IconName }> = {
  raja: { color: colors.marigold, text: '#FFD27A', icon: 'crown' },
  mantri: { color: '#7C9CFF', text: '#9DB4FF', icon: 'quill' },
  police: { color: colors.mint, text: '#8AF0C2', icon: 'shield' },
  chor: { color: colors.coral, text: colors.coralText, icon: 'mask' },
};

export function RoleBadge({ role, size = 36 }: { role: Role; size?: number }) {
  const s = ROLE_STYLE[role];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: s.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={s.icon} size={Math.round(size * 0.56)} color={colors.ink} />
    </View>
  );
}
