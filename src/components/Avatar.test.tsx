import React from 'react';
import { Image } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar } from './Avatar';
import { buildAvatarUrl } from '@/utils/avatar';

let mockChoice: { style: string; seed: string } | null = null;

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ tokens: { primary: '#bba0ff', onPrimary: '#fff' } }),
}));
jest.mock('@/hooks/useMyAvatar', () => ({
  useMyAvatar: () => ({ choice: mockChoice, save: jest.fn() }),
}));

describe('Avatar', () => {
  beforeEach(() => {
    mockChoice = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the initials when there is no image', () => {
    render(<Avatar displayName="Maria Pereira" />);
    expect(screen.getByText('MP')).toBeTruthy();
  });

  it('keeps others with initials because social DTOs do not expose avatars', () => {
    mockChoice = { style: 'adventurer', seed: 'abc123def456' };
    render(<Avatar displayName="Maria Pereira" />);
    expect(screen.getByText('MP')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  });

  it('uses my chosen avatar when isSelf, with the initials underneath while it loads', () => {
    mockChoice = { style: 'adventurer', seed: 'abc123def456' };
    render(<Avatar isSelf displayName="Anderson Lima" size={64} />);

    const image = screen.UNSAFE_getByType(Image);
    expect(image.props.source.uri).toBe(
      buildAvatarUrl({ style: 'adventurer', seed: 'abc123def456', size: 128 }),
    );
    expect(screen.getByText('AL')).toBeTruthy(); // ainda carregando

    fireEvent(image, 'load');
    expect(screen.queryByText('AL')).toBeNull();
  });

  it('isSelf without a chosen avatar shows the initials', () => {
    render(<Avatar isSelf displayName="Anderson Lima" />);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('falls back to the initials when the image fails, and tells the parent', () => {
    const onImageError = jest.fn();
    render(<Avatar uri="https://example.com/x.png" displayName="Anderson Lima" onImageError={onImageError} />);

    fireEvent(screen.UNSAFE_getByType(Image), 'error');

    expect(onImageError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('AL')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  });

  it('waits loadDelayMs before asking for the image', () => {
    render(<Avatar uri="https://example.com/x.png" displayName="Anderson Lima" loadDelayMs={500} />);
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(1);
  });

  it('tries again when the image url changes', () => {
    const { rerender } = render(<Avatar uri="https://example.com/a.png" displayName="Anderson Lima" />);
    fireEvent(screen.UNSAFE_getByType(Image), 'error');
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);

    rerender(<Avatar uri="https://example.com/b.png" displayName="Anderson Lima" />);
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(1);
  });
});
