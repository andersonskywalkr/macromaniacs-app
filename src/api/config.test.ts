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
