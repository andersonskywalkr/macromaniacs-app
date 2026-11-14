import { DEFAULT_TERMS_URL, TERMS_VERSION, parseMaintenanceTabs, resolveTermsUrl } from './config';

describe('parseMaintenanceTabs', () => {
  it('defaults to no tab in maintenance: Início, Refeições and Grupo are real', () => {
    const tabs = parseMaintenanceTabs(undefined);
    expect(tabs.size).toBe(0);
    expect(tabs.has('home')).toBe(false);
    expect(tabs.has('meals')).toBe(false);
    expect(tabs.has('group')).toBe(false);
  });

  it('reads a comma separated list, ignoring spaces and case', () => {
    const tabs = parseMaintenanceTabs(' Home , group ');
    expect([...tabs].sort()).toEqual(['group', 'home']);
  });

  it('an empty value means no tab is in maintenance', () => {
    expect(parseMaintenanceTabs('').size).toBe(0);
  });

  it('ignores unknown names, including profile (never in maintenance)', () => {
    expect([...parseMaintenanceTabs('profile,meals,foo')]).toEqual(['meals']);
  });
});

describe('MAINTENANCE_TABS with the variable absent (EAS builds do not define it)', () => {
  const original = process.env.EXPO_PUBLIC_MAINTENANCE_TABS;

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_MAINTENANCE_TABS;
    else process.env.EXPO_PUBLIC_MAINTENANCE_TABS = original;
  });

  it('leaves no tab in maintenance when the variable is not defined', () => {
    delete process.env.EXPO_PUBLIC_MAINTENANCE_TABS;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MAINTENANCE_TABS } = require('./config') as typeof import('./config');
      expect(MAINTENANCE_TABS.size).toBe(0);
    });
  });

  it('still reads the variable when it is defined (local .env)', () => {
    process.env.EXPO_PUBLIC_MAINTENANCE_TABS = 'group';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MAINTENANCE_TABS } = require('./config') as typeof import('./config');
      expect([...MAINTENANCE_TABS]).toEqual(['group']);
    });
  });
});

describe('terms document url', () => {
  const original = process.env.EXPO_PUBLIC_TERMS_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_TERMS_URL;
    else process.env.EXPO_PUBLIC_TERMS_URL = original;
  });

  it('uses the default public address when the variable is not set or is empty', () => {
    expect(resolveTermsUrl(undefined)).toBe(DEFAULT_TERMS_URL);
    expect(resolveTermsUrl('')).toBe(DEFAULT_TERMS_URL);
    expect(resolveTermsUrl('   ')).toBe(DEFAULT_TERMS_URL);
  });

  it('uses the variable when it is set', () => {
    expect(resolveTermsUrl(' https://exemplo.com/termos.pdf ')).toBe('https://exemplo.com/termos.pdf');
  });

  it('TERMS_URL falls back to the default when the variable is absent, and follows it when set', () => {
    delete process.env.EXPO_PUBLIC_TERMS_URL;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TERMS_URL } = require('./config') as typeof import('./config');
      expect(TERMS_URL).toBe(DEFAULT_TERMS_URL);
    });

    process.env.EXPO_PUBLIC_TERMS_URL = 'https://exemplo.com/termos.pdf';
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TERMS_URL } = require('./config') as typeof import('./config');
      expect(TERMS_URL).toBe('https://exemplo.com/termos.pdf');
    });
  });

  it('points to the PDF in docs/legal and keeps the version', () => {
    expect(DEFAULT_TERMS_URL).toBe(
      'https://github.com/andersonskywalkr/macromaniacs-app/blob/master/docs/legal/MacroManiacs_Termos_de_Aceite.pdf',
    );
    expect(TERMS_VERSION).toBe('2026-11-14');
  });
});
