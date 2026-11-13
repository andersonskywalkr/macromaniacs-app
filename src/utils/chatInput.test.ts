import {
  CHAT_INPUT_LINE_HEIGHT,
  CHAT_INPUT_MAX_HEIGHT,
  CHAT_INPUT_MAX_LINES,
  CHAT_INPUT_MIN_HEIGHT,
  clampInputHeight,
  isInputScrollable,
  isNearBottom,
} from './chatInput';

describe('chat input height (WhatsApp style)', () => {
  it('is one line at minimum and about 5 lines at maximum', () => {
    expect(CHAT_INPUT_MIN_HEIGHT).toBe(CHAT_INPUT_LINE_HEIGHT);
    expect(CHAT_INPUT_MAX_LINES).toBe(5);
    expect(CHAT_INPUT_MAX_HEIGHT).toBe(CHAT_INPUT_LINE_HEIGHT * 5);
  });

  it('grows with the content between the minimum and the maximum', () => {
    expect(clampInputHeight(0)).toBe(CHAT_INPUT_MIN_HEIGHT);
    expect(clampInputHeight(17)).toBe(CHAT_INPUT_MIN_HEIGHT);
    expect(clampInputHeight(40)).toBe(40);
    expect(clampInputHeight(60.4)).toBe(60);
  });

  it('stops growing at the limit (no matter how long the text is)', () => {
    expect(clampInputHeight(100)).toBe(CHAT_INPUT_MAX_HEIGHT);
    expect(clampInputHeight(160)).toBe(CHAT_INPUT_MAX_HEIGHT);
    expect(clampInputHeight(8 * CHAT_INPUT_LINE_HEIGHT)).toBe(CHAT_INPUT_MAX_HEIGHT);
  });

  it('is safe with invalid heights', () => {
    expect(clampInputHeight(Number.NaN)).toBe(CHAT_INPUT_MIN_HEIGHT);
  });

  it('turns scrollEnabled on only after the limit', () => {
    expect(isInputScrollable(20)).toBe(false);
    expect(isInputScrollable(100)).toBe(false);
    expect(isInputScrollable(101)).toBe(false); // folga de arredondamento
    expect(isInputScrollable(120)).toBe(true);
    expect(isInputScrollable(8 * CHAT_INPUT_LINE_HEIGHT)).toBe(true);
  });
});

describe('isNearBottom (keep the list on the last message unless the user scrolled up)', () => {
  const base = { viewportHeight: 400, contentHeight: 1000 };

  it('is true at the end and close to it', () => {
    expect(isNearBottom({ ...base, offsetY: 600 })).toBe(true);
    expect(isNearBottom({ ...base, offsetY: 570 })).toBe(true);
  });

  it('is false when the user scrolled up to read the history', () => {
    expect(isNearBottom({ ...base, offsetY: 300 })).toBe(false);
    expect(isNearBottom({ ...base, offsetY: 0 })).toBe(false);
  });

  it('is true when everything fits on the screen', () => {
    expect(isNearBottom({ offsetY: 0, viewportHeight: 400, contentHeight: 200 })).toBe(true);
  });
});
