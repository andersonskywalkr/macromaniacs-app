import React from 'react';
import Svg, { Path, Circle, SvgXml } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Ícones da bottom tab bar (Início/Refeições/Grupo/Perfil).
export function HomeIcon({ size = 22, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M3 9.5L11 2.5L19 9.5V18.5C19 18.8978 18.842 19.2794 18.5607 19.5607C18.2794 19.842 17.8978 20 17.5 20H4.5C4.10218 20 3.72064 19.842 3.43934 19.5607C3.15804 19.2794 3 18.8978 3 18.5V9.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MealsIcon({ size = 22, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M10.5882 17.8043C14.5735 17.8043 17.8043 14.5736 17.8043 10.5882C17.8043 6.60287 14.5735 3.3721 10.5882 3.3721C6.60284 3.3721 3.37207 6.60287 3.37207 10.5882C3.37207 14.5736 6.60284 17.8043 10.5882 17.8043Z"
        stroke={color}
        strokeWidth={1.17647}
      />
      <Path
        d="M10.5884 20.5882C16.1112 20.5882 20.5884 16.1111 20.5884 10.5882C20.5884 5.06538 16.1112 0.588226 10.5884 0.588226C5.06553 0.588226 0.588379 5.06538 0.588379 10.5882C0.588379 16.1111 5.06553 20.5882 10.5884 20.5882Z"
        stroke={color}
        strokeWidth={1.17647}
      />
      <Path
        d="M11.6504 6.30252C12.5247 6.30252 13.3633 6.64985 13.9815 7.2681C14.5998 7.88635 14.9471 8.72488 14.9471 9.59922"
        stroke={color}
        strokeWidth={1.17647}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function GroupIcon({ size = 24, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={(size * 22) / 24} viewBox="0 0 24 22" fill="none">
      <Path
        d="M8.3079 11.3692C10.0412 11.3692 11.4464 9.9641 11.4464 8.23078C11.4464 6.49745 10.0412 5.09232 8.3079 5.09232C6.57457 5.09232 5.16943 6.49745 5.16943 8.23078C5.16943 9.9641 6.57457 11.3692 8.3079 11.3692Z"
        stroke={color}
        strokeWidth={1.66154}
      />
      <Path
        d="M2.30762 18.3846C2.86146 15.4308 5.26146 13.7692 8.30762 13.7692C11.3538 13.7692 13.7538 15.4308 14.3076 18.3846"
        stroke={color}
        strokeWidth={1.66154}
        strokeLinecap="round"
      />
      <Path
        d="M17.0768 11.5538C18.4022 11.5538 19.4768 10.4793 19.4768 9.15385C19.4768 7.82836 18.4022 6.75385 17.0768 6.75385C15.7513 6.75385 14.6768 7.82836 14.6768 9.15385C14.6768 10.4793 15.7513 11.5538 17.0768 11.5538Z"
        stroke={color}
        strokeWidth={1.66154}
      />
      <Path
        d="M18 13.9539C20.0308 14.4154 21.4154 15.8 21.6923 17.9231"
        stroke={color}
        strokeWidth={1.66154}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11.0002 10.8C13.0989 10.8 14.8002 9.09869 14.8002 7.00001C14.8002 4.90133 13.0989 3.20001 11.0002 3.20001C8.90151 3.20001 7.2002 4.90133 7.2002 7.00001C7.2002 9.09869 8.90151 10.8 11.0002 10.8Z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M3.5 19.5C4.3 15.9 7.3 14 11 14C14.7 14 17.7 15.9 18.5 19.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={(size * 24) / 22} viewBox="0 0 22 24" fill="none">
      <Path
        d="M11 2.5a6.5 6.5 0 0 0-6.5 6.5v3.6L2.8 16a1 1 0 0 0 .9 1.5h14.6a1 1 0 0 0 .9-1.5l-1.7-3.4V9A6.5 6.5 0 0 0 11 2.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M8.5 20.5a2.6 2.6 0 0 0 5 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

// Ícone único que alterna lua (modo claro -> convida a trocar pra escuro) e
// sol (modo escuro -> convida a trocar pra claro), como no protótipo.
export function ThemeToggleIcon({ mode, size = 20, color = '#000' }: IconProps & { mode: 'light' | 'dark' }) {
  if (mode === 'dark') {
    return (
      <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
        <Circle cx="11" cy="11" r="4.5" stroke={color} strokeWidth={1.8} />
        <Path
          d="M11 1.5v2.2M11 18.3v2.2M1.5 11h2.2M18.3 11h2.2M4.3 4.3l1.6 1.6M16.1 16.1l1.6 1.6M17.7 4.3l-1.6 1.6M5.9 16.1l-1.6 1.6"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17 11.5A7.5 7.5 0 0 1 8.5 3a7.5 7.5 0 1 0 8.5 8.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 14, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 2v14M2 9h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 8, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={(size * 14) / 8} viewBox="0 0 8 14" fill="none">
      <Path d="M1 1l6 6-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ícone de olho (senha visível/oculta), extraído do protótipo de login —
// a variante "oculta" soma o traço diagonal sobre o mesmo olho.
export function EyeIcon({ size = 20, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M2 11s3.6-6.5 9-6.5 9 6.5 9 6.5-3.6 6.5-9 6.5-9-6.5-9-6.5z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Circle cx="11" cy="11" r="2.6" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function EyeOffIcon({ size = 20, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M2 11s3.6-6.5 9-6.5 9 6.5 9 6.5-3.6 6.5-9 6.5-9-6.5-9-6.5z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Circle cx="11" cy="11" r="2.6" stroke={color} strokeWidth={1.6} />
      <Path d="M3 19L19 3" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        fill="#4285F4"
        d="M19.6 10.2c0-.7-.06-1.35-.18-2H10v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.75 3-4.3 3-7.3z"
      />
      <Path
        fill="#34A853"
        d="M10 20c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.75-5.6-4.1H1.1v2.6A10 10 0 0 0 10 20z"
      />
      <Path
        fill="#FBBC05"
        d="M4.4 12c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.4H1.1A10 10 0 0 0 0 10c0 1.6.4 3.15 1.1 4.6z"
      />
      <Path
        fill="#EA4335"
        d="M10 3.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C14.9.9 12.7 0 10 0 6.1 0 2.7 2.2 1.1 5.4l3.3 2.6C5.2 5.65 7.4 3.9 10 3.9z"
      />
    </Svg>
  );
}

export function AppleIcon({ size = 20, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.845 1.334 1.72 2.316 1.72.982 0 1.303-.63 2.493-.63 1.19 0 1.475.63 2.503.63 1.028 0 1.674-.826 2.312-1.653.32-.408.606-.842.845-1.298.031-.06-.005-.084-.038-.105z" />
    </Svg>
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="#1877F2">
      <Path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
    </Svg>
  );
}

export function TrendingUpIcon({ size = 20, color = '#000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M2.5 12.5l5-5 4 4 7-7.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.5 4h5v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Fire e as medalhas vêm do protótipo como arquivos .svg avulsos (não paths
// inline) — como o projeto não tem um transformer de SVG configurado no
// Metro, renderizamos o XML original direto via SvgXml em vez de depender
// de um asset pipeline extra.
const FIRE_XML = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M194.118 274.44C190.621 260.275 188.117 245.884 186.626 231.371C180.63 173.922 190.798 119.929 220.479 70.0891C231.392 51.8328 244.228 34.7961 258.765 19.2689C263.233 14.5174 267.995 10.1884 272.525 5.60449C272.34 18.8023 273.045 32.7371 273.853 45.8736C276.615 90.6953 285 136.508 311.26 173.975C329.458 199.937 353.085 220.776 374.367 244.049C378.582 248.659 383.062 253.115 386.997 258.008C407.017 283.293 421.065 316.208 420.62 348.813C420.022 392.783 398.407 429.808 367.672 459.705C350.447 476.185 331.092 490.283 310.122 501.62C309.055 502.198 303.415 505.453 302.638 505.505L302.43 505.168C303.087 503.475 306.018 499.018 307.075 497.163C309.79 492.465 312.182 487.588 314.24 482.568C327.257 451 324.243 419.068 310.66 388.278C310.045 386.885 309.418 385.495 308.783 384.113C308.35 387.693 307.355 390.598 306.185 393.975C302.69 404.053 297.418 413.883 288.855 420.54C285.175 423.345 281.09 425.57 276.737 427.14C278.872 421.718 280.38 415.403 281.36 409.655C288.752 366.37 266.907 327.588 241.357 294.673C242.091 300.865 241.125 308.865 240.622 315.12C238.007 347.693 228.244 380.94 204.109 404.063C183.507 423.8 177.731 452.18 189.909 477.843C190.533 479.158 191.065 480.683 191.865 481.89C193.171 484.115 194.422 486.595 195.727 488.715C199.263 494.415 203.171 499.873 207.425 505.058C205.315 504.315 198.409 500.553 196.204 499.305C155.033 476.008 109.976 439.93 96.5777 392.518L96.4217 392.243C95.8595 390.588 95.683 389.898 95.374 388.178C84.1967 346.9 98.0545 304.36 118.659 268.47C125.795 255.97 133.742 243.951 142.448 232.488C144.453 229.802 149.03 223.646 151.46 221.479C156.139 240.981 162.745 257.348 180.725 268.215C186.62 271.78 188.372 271.86 194.118 274.44Z" fill="url(#paint0_linear_207_185)"/>
<defs>
<linearGradient id="paint0_linear_207_185" x1="133" y1="445" x2="331.5" y2="134.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#FFC728"/>
<stop offset="1" stop-color="#EF3F3D"/>
</linearGradient>
</defs>
</svg>`;

export function FireIcon({ size = 16 }: { size?: number }) {
  return <SvgXml xml={FIRE_XML} width={size} height={Math.round((size * 19) / 16)} />;
}

const MEDAL_XML: Record<'gold' | 'silver' | 'bronze', string> = {
  gold: `<svg width="248" height="397" viewBox="0 0 248 397" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="62" y="0" width="124" height="170" rx="14" fill="#22073E"/>
<rect x="68" y="8" width="13" height="140" fill="#FBC54E"/>
<rect x="167" y="8" width="13" height="140" fill="#FBC54E"/>
<rect x="78" y="8" width="3" height="140" fill="#E5A034"/>
<rect x="167" y="8" width="3" height="140" fill="#E5A034"/>
<rect x="86" y="8" width="76" height="160" fill="#562695"/>
<rect x="86" y="8" width="76" height="12" fill="#9868C8"/>
<rect x="86" y="128" width="76" height="24" fill="#22073E" fill-opacity=".28"/>
<circle cx="124" cy="271" r="124" fill="#22073E"/>
<circle cx="124" cy="271" r="112" fill="#FBC54E"/>
<path d="M38 310A112 112 0 0 0 210 310Z" fill="#E5A034" fill-opacity=".45"/>
<circle cx="124" cy="271" r="96" fill="#22073E"/>
<circle cx="124" cy="271" r="82" fill="#FBC54E"/>
<path d="M62 300A82 82 0 0 0 186 300Z" fill="#E5A034" fill-opacity=".3"/>
<path d="M70 224a70 70 0 0 1 30-24" stroke="#FDDE8C" stroke-width="9" stroke-linecap="round"/>
<path d="M88 316V244l36 44 36-44v72" stroke="#22073E" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  silver: `<svg width="248" height="397" viewBox="0 0 248 397" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="62" y="0" width="124" height="170" rx="14" fill="#22073E"/>
<rect x="68" y="8" width="13" height="140" fill="#C1C4C9"/>
<rect x="167" y="8" width="13" height="140" fill="#C1C4C9"/>
<rect x="78" y="8" width="3" height="140" fill="#8D949A"/>
<rect x="167" y="8" width="3" height="140" fill="#8D949A"/>
<rect x="86" y="8" width="76" height="160" fill="#931C1E"/>
<rect x="86" y="8" width="76" height="12" fill="#C1585A"/>
<rect x="86" y="128" width="76" height="24" fill="#22073E" fill-opacity=".28"/>
<circle cx="124" cy="271" r="124" fill="#22073E"/>
<circle cx="124" cy="271" r="112" fill="#C1C4C9"/>
<path d="M38 310A112 112 0 0 0 210 310Z" fill="#8D949A" fill-opacity=".45"/>
<circle cx="124" cy="271" r="96" fill="#22073E"/>
<circle cx="124" cy="271" r="82" fill="#C1C4C9"/>
<path d="M62 300A82 82 0 0 0 186 300Z" fill="#8D949A" fill-opacity=".3"/>
<path d="M70 224a70 70 0 0 1 30-24" stroke="#F4F4F4" stroke-width="9" stroke-linecap="round"/>
<path d="M88 316V244l36 44 36-44v72" stroke="#22073E" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  bronze: `<svg width="248" height="397" viewBox="0 0 248 397" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="62" y="0" width="124" height="170" rx="14" fill="#22073E"/>
<rect x="68" y="8" width="13" height="140" fill="#DA8E5A"/>
<rect x="167" y="8" width="13" height="140" fill="#DA8E5A"/>
<rect x="78" y="8" width="3" height="140" fill="#AF633A"/>
<rect x="167" y="8" width="3" height="140" fill="#AF633A"/>
<rect x="86" y="8" width="76" height="160" fill="#0C7F56"/>
<rect x="86" y="8" width="76" height="12" fill="#69B498"/>
<rect x="86" y="128" width="76" height="24" fill="#22073E" fill-opacity=".28"/>
<circle cx="124" cy="271" r="124" fill="#22073E"/>
<circle cx="124" cy="271" r="112" fill="#DA8E5A"/>
<path d="M38 310A112 112 0 0 0 210 310Z" fill="#AF633A" fill-opacity=".45"/>
<circle cx="124" cy="271" r="96" fill="#22073E"/>
<circle cx="124" cy="271" r="82" fill="#DA8E5A"/>
<path d="M62 300A82 82 0 0 0 186 300Z" fill="#AF633A" fill-opacity=".3"/>
<path d="M70 224a70 70 0 0 1 30-24" stroke="#F3CDA9" stroke-width="9" stroke-linecap="round"/>
<path d="M88 316V244l36 44 36-44v72" stroke="#22073E" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
};

export function MedalIcon({ rank, size = 18 }: { rank: 1 | 2 | 3; size?: number }) {
  const variant = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
  return <SvgXml xml={MEDAL_XML[variant]} width={size} height={Math.round((size * 397) / 248)} />;
}
