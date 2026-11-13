import { parseMaintenanceTabs } from './config';

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
