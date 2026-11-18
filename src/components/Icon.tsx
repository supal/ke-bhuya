import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'back'
  | 'chevron'
  | 'plus'
  | 'close'
  | 'play'
  | 'check'
  | 'eye'
  | 'eyeOff'
  | 'fingerprint'
  | 'mask'
  | 'person'
  | 'crown'
  | 'hand'
  | 'help'
  | 'arrow';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

/** Stroke icons drawn from the design canvas. Decorative: hidden from screen readers. */
export function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      {name === 'back' && <Path d="M15 6l-6 6 6 6" {...stroke} />}
      {name === 'chevron' && <Path d="M9 6l6 6-6 6" {...stroke} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {name === 'play' && (
        <Path d="M8 5.5v13a1 1 0 001.5.9l10.4-6.5a1 1 0 000-1.8L9.5 4.6A1 1 0 008 5.5z" fill={color} />
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7" {...stroke} />}
      {name === 'eye' && (
        <>
          <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
        </>
      )}
      {name === 'eyeOff' && (
        <>
          <Path d="M3 3l18 18" {...stroke} />
          <Path
            d="M10.6 6.1A9.8 9.8 0 0112 6c5 0 9 4.5 10 6a17 17 0 01-3.2 3.6M6.3 6.3A17 17 0 002 12c1 1.5 5 6 10 6a9.6 9.6 0 004.2-1"
            {...stroke}
          />
        </>
      )}
      {name === 'fingerprint' && (
        <>
          <Path d="M12 11v3" {...stroke} />
          <Path d="M8.5 8.5a5 5 0 017 0" {...stroke} />
          <Path d="M6 12a6 6 0 0112 0v1.5a7 7 0 01-.8 3.2" {...stroke} />
          <Path d="M9 13.5v1a3 3 0 006 0" {...stroke} />
          <Path d="M6.4 17a9 9 0 01-.4-2.6" {...stroke} />
          <Path d="M4 9a9 9 0 0116 0" {...stroke} />
        </>
      )}
      {name === 'mask' && (
        <>
          <Path
            d="M3 9c0-2 2-3 4.5-3S12 7.5 12 7.5 14 6 16.5 6 21 7 21 9c0 4-2.5 7-5 7-1.8 0-2.6-1.4-4-1.4S9.8 16 8 16c-2.5 0-5-3-5-7z"
            {...stroke}
          />
          <Circle cx={8} cy={10.5} r={1.4} {...stroke} />
          <Circle cx={16} cy={10.5} r={1.4} {...stroke} />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" {...stroke} />
        </>
      )}
      {name === 'crown' && <Path d="M3 8l4.5 3L12 5l4.5 6L21 8l-2 10H5L3 8z" {...stroke} />}
      {name === 'hand' && (
        <>
          <Path d="M8 13V5.5a1.5 1.5 0 013 0V12" {...stroke} />
          <Path d="M11 11.5V4a1.5 1.5 0 013 0v7.5" {...stroke} />
          <Path d="M14 11.5V6a1.5 1.5 0 013 0v8a7 7 0 01-7 7h-.5A6.5 6.5 0 014 14.5V11a1.5 1.5 0 013 0v2" {...stroke} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2" {...stroke} />
          <Path d="M12 17h.01" {...stroke} />
        </>
      )}
      {name === 'arrow' && <Path d="M5 12h14M13 6l6 6-6 6" {...stroke} />}
    </Svg>
  );
}
