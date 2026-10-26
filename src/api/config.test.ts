import { parseMaintenanceTabs } from './config';

describe('parseMaintenanceTabs', () => {
  it('defaults to only Grupo in maintenance, with Início and Refeições real', () => {
    const tabs = parseMaintenanceTabs(undefined);
    expect(tabs.has('home')).toBe(false);
    expect(tabs.has('meals')).toBe(false);
    expect(tabs.has('group')).toBe(true);
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
