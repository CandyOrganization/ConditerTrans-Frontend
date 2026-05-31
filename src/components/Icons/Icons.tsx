import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export function TruckIcon({ size = 24, color = colors.primary }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h11v9H3V6zm11 2h4l3 4v3h-7V8z" fill={color} />
      <Circle cx="7" cy="18" r="2" fill={color} />
      <Circle cx="17" cy="18" r="2" fill={color} />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function UserIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill="#E8EDF2" />
      <Circle cx="18" cy="14" r="5" fill="#94A3B8" />
      <Path d="M8 30c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#94A3B8" />
    </Svg>
  );
}

export function PinIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1C5.8 1 4 2.8 4 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.2-1.8-4-4-4zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
        fill={color}
      />
    </Svg>
  );
}

export function RouteIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2 4h12M2 8h12M2 12h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function WeightIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6h8l1 6H3l1-6zm2-3h4l1 3H5l1-3z"
        stroke={color}
        strokeWidth="1.2"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2" y="3" width="12" height="11" rx="1" stroke={color} strokeWidth="1.2" />
      <Path d="M2 6h12M5 1v3M11 1v3" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

export function BoxIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" stroke={color} strokeWidth="1.2" />
      <Path d="M8 2v12M2 5l6 3 6-3" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

export function MoneyIcon({ size = 16, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="1" y="4" width="14" height="8" rx="1" stroke={color} strokeWidth="1.2" />
      <Circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

export function WarningIcon({ size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.5L1 14h14L8 1.5z" fill={colors.warning} />
      <Path d="M8 6v4M8 12h.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M12.5 2.5l3 3L6 15H3v-3l9.5-9.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M4 3h3l1.5 4-2 1.5a10 10 0 0 0 5 5L14 11l4 1.5V16a2 2 0 0 1-2 2C6 18 0 12 0 5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="1.3"
      />
    </Svg>
  );
}

export function EmailIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x="2" y="4" width="14" height="10" rx="1" stroke={color} strokeWidth="1.3" />
      <Path d="M2 5l7 5 7-5" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

export function DownloadIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 2v9M5 8l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M3 14h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function FilePdfIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect x="3" y="2" width="14" height="16" rx="2" fill="#FEE2E2" />
      <SvgText x="10" y="13" textAnchor="middle" fill="#DC2626" fontSize="6" fontWeight="700">
        PDF
      </SvgText>
    </Svg>
  );
}

export function FileDocIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect x="3" y="2" width="14" height="16" rx="2" fill="#DCFCE7" />
      <SvgText x="10" y="13" textAnchor="middle" fill="#16A34A" fontSize="6" fontWeight="700">
        DOC
      </SvgText>
    </Svg>
  );
}

export function FileContractIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect x="3" y="2" width="14" height="16" rx="2" fill="#FEF9C3" />
      <SvgText x="10" y="13" textAnchor="middle" fill="#CA8A04" fontSize="5" fontWeight="700">
        PDF
      </SvgText>
    </Svg>
  );
}

export function EyeIcon({ size = 20, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"
        stroke={color}
        strokeWidth="1.4"
      />
      <Circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.4" />
    </Svg>
  );
}

export function EyeOffIcon({ size = 20, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 2l16 16M8.5 8.5A3 3 0 0 0 10 13a3 3 0 0 0 2.5-1.5M5 5.5C3.5 6.8 2.3 8.4 1 10s3 6 9 6c1.2 0 2.3-.2 3.3-.6M14 14.2c1.5-1.1 2.6-2.5 3.5-4.2-1.5-3-4.5-5-7.5-5-.8 0-1.6.1-2.3.3"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MapPlaceholderIcon({ size = 48, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M8 20c0-6 6-12 16-12s16 6 16 12c0 10-16 22-16 22S8 30 8 20z"
        stroke={color}
        strokeWidth="2"
      />
      <Circle cx="24" cy="20" r="5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
