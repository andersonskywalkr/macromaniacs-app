import { ApiError } from './ApiError';
import { getGroupFeed, getGroupRanking, getMyGroups, joinGroup, sendGroupMessage } from './groups';
import { MOCK_EXAMPLE_JOIN_CODE, MOCK_USER_ID, resetMockGroups } from '@/mocks/groupsData';

// Modo mock (EXPO_PUBLIC_USE_MOCK não definido nos testes): a fonte única de
// grupos, ranking, membros e chat.
describe('mock groups', () => {
  beforeEach(() => resetMockGroups());

  it('has 3 groups and the current user is in all of them', async () => {
    const groups = await getMyGroups();
    expect(groups.map((g) => g.name)).toEqual(['Los Maniacs', 'Time da Academia', 'Família Fit']);

    for (const group of groups) {
      const ranking = await getGroupRanking(group.id);
      expect(ranking.some((e) => e.userId === MOCK_USER_ID)).toBe(true);
      expect(ranking.length).toBeGreaterThanOrEqual(4);
      expect(ranking.length).toBeLessThanOrEqual(8);
    }
  });

  it('keeps memberCount equal to the ranking size (same source everywhere)', async () => {
    for (const group of await getMyGroups()) {
      expect(group.memberCount).toBe((await getGroupRanking(group.id)).length);
    }
  });

  it('ranks by points with the streak as tie-break, with sequential positions', async () => {
    const ranking = await getGroupRanking('group-2');
    expect(ranking.map((e) => e.position)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i < ranking.length; i += 1) {
      expect(ranking[i - 1].points).toBeGreaterThanOrEqual(ranking[i].points);
    }
    // Fernanda e "Você" empatam em 420; Fernanda tem mais dias seguidos
    const names = ranking.map((e) => e.displayName);
    expect(names.indexOf('Fernanda Lima')).toBeLessThan(names.indexOf('Anderson'));
  });

  it('has the same ranking for the Home, the list and the full ranking', async () => {
    const [first] = await getMyGroups();
    expect(await getGroupRanking(first.id)).toEqual(await getGroupRanking(first.id));
    expect((await getGroupRanking('group-1'))[0]).toMatchObject({
      displayName: 'Maria Pereira',
      points: 980,
    });
  });

  it('joins a group with the example code and then lists it', async () => {
    const joined = await joinGroup(MOCK_EXAMPLE_JOIN_CODE.toLowerCase());
    expect(joined.name).toBe('Corrida de Domingo');
    expect((await getMyGroups()).map((g) => g.id)).toContain('group-4');
    const ranking = await getGroupRanking('group-4');
    expect(ranking.some((e) => e.userId === MOCK_USER_ID)).toBe(true);
    expect(joined.memberCount).toBe(ranking.length);
  });

  it('rejects an unknown code with a clear error, and a group already joined', async () => {
    await expect(joinGroup('ZZZZZZZZ')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Código inválido',
    });
    await expect(joinGroup('LOSMAN26')).rejects.toBeInstanceOf(ApiError);
    await expect(joinGroup('LOSMAN26')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('keeps a message history per group and adds what the user sends', async () => {
    const before = await getGroupFeed('group-1');
    expect(before.length).toBeGreaterThanOrEqual(3);
    expect(before.some((m) => m.userId !== MOCK_USER_ID)).toBe(true);
    expect(before.some((m) => m.mealLogId && !m.content)).toBe(true);

    const sent = await sendGroupMessage('group-1', '  Bora treinar!  ');
    expect(sent).toMatchObject({ content: 'Bora treinar!', userId: MOCK_USER_ID, groupId: 'group-1' });

    const after = await getGroupFeed('group-1');
    expect(after).toHaveLength(before.length + 1);
    expect((await getGroupFeed('group-2')).some((m) => m.content === 'Bora treinar!')).toBe(false);
  });
});
