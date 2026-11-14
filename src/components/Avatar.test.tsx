import React from 'react';
import { Image } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SvgXml } from 'react-native-svg';
import { Avatar } from './Avatar';
import { defaultAvatarConfig, type AvatarConfig } from '@/utils/avatarConfig';
import { buildAvatarSvg } from '@/utils/avatarSvg';

let mockConfig: AvatarConfig | null = null;
let mockBuildFails = false;

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ tokens: { primary: '#bba0ff', onPrimary: '#fff', card: '#111' } }),
}));
jest.mock('@/hooks/useMyAvatar', () => ({
  useMyAvatar: () => ({ config: mockConfig, save: jest.fn() }),
}));
jest.mock('@/utils/avatarSvg', () => {
  const actual = jest.requireActual<typeof import('@/utils/avatarSvg')>('@/utils/avatarSvg');
  return {
    ...actual,
    buildAvatarSvg: (...args: Parameters<typeof actual.buildAvatarSvg>) => {
      if (mockBuildFails) throw new Error('falha ao gerar');
      return actual.buildAvatarSvg(...args);
    },
  };
});

const drawings = () => screen.UNSAFE_queryAllByType(SvgXml);

describe('Avatar', () => {
  beforeEach(() => {
    mockConfig = null;
    mockBuildFails = false;
  });

  it('shows the initials when there is no avatar', () => {
    render(<Avatar displayName="Maria Pereira" />);
    expect(screen.getByText('MP')).toBeTruthy();
    expect(drawings()).toHaveLength(0);
  });

  it('keeps the other people with initials even when I have an avatar (backend does not know avatars)', () => {
    mockConfig = defaultAvatarConfig();
    render(<Avatar displayName="Maria Pereira" />);
    expect(screen.getByText('MP')).toBeTruthy();
    expect(drawings()).toHaveLength(0);
  });

  it('shows my drawn avatar when isSelf, generated locally from my configuration', () => {
    mockConfig = defaultAvatarConfig();
    render(<Avatar isSelf displayName="Anderson Lima" size={64} />);

    const [drawing] = drawings();
    expect(drawing.props.xml).toBe(buildAvatarSvg(mockConfig, 128));
    expect(drawing.props.width).toBe(64);
    expect(screen.queryByText('AL')).toBeNull();
    expect(screen.getByLabelText('Foto de perfil de Anderson Lima')).toBeTruthy();
  });

  it('isSelf without a saved avatar shows the initials', () => {
    render(<Avatar isSelf displayName="Anderson Lima" />);
    expect(screen.getByText('AL')).toBeTruthy();
    expect(drawings()).toHaveLength(0);
  });

  it('uses an explicit configuration (customizer preview) over the saved one', () => {
    mockConfig = defaultAvatarConfig();
    const other: AvatarConfig = { ...defaultAvatarConfig(), options: { ...mockConfig.options, skinColor: '614335' } };
    render(<Avatar isSelf config={other} displayName="Anderson Lima" />);
    expect(drawings()[0].props.xml).toBe(buildAvatarSvg(other, 128));
  });

  it('falls back to the initials when generating the drawing fails', () => {
    mockBuildFails = true;
    mockConfig = defaultAvatarConfig();
    render(<Avatar isSelf displayName="Anderson Lima" />);
    expect(screen.getByText('AL')).toBeTruthy();
    expect(drawings()).toHaveLength(0);
  });

  it('keeps the streak badge', () => {
    mockConfig = defaultAvatarConfig();
    render(<Avatar isSelf displayName="Anderson Lima" streakCount={5} />);
    expect(screen.getByLabelText('Sequência de 5 dias')).toBeTruthy();
  });

  it('makes no network request (no remote images)', () => {
    mockConfig = defaultAvatarConfig();
    render(<Avatar isSelf displayName="Anderson Lima" />);
    const serialized = JSON.stringify(screen.toJSON());
    // o SVG traz só metadados de licença (texto): nada de imagem remota
    expect(serialized).not.toMatch(/(href|src)=|"uri"/);
    expect(serialized).not.toContain('dicebear.com');
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  });
});
