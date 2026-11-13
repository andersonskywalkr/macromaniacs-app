import { rankMembers, sortByPosition, splitPodium, findEntry, buildInitials } from './ranking';

const member = (userId: string, displayName: string, points: number, streak?: number) => ({
  userId,
  displayName,
  points,
  streak,
});

describe('rankMembers', () => {
  it('orders by points, highest first, and numbers the positions', () => {
    const ranking = rankMembers([
      member('a', 'Ana', 100),
      member('b', 'Bia', 300),
      member('c', 'Caio', 200),
    ]);

    expect(ranking.map((e) => [e.position, e.userId])).toEqual([
      [1, 'b'],
      [2, 'c'],
      [3, 'a'],
    ]);
  });

  it('breaks a points tie with the longer streak', () => {
    const ranking = rankMembers([
      member('voce', 'Anderson', 420, 5),
      member('fer', 'Fernanda Lima', 420, 9),
      member('gus', 'Gustavo Alves', 510, 7),
    ]);

    expect(ranking.map((e) => e.userId)).toEqual(['gus', 'fer', 'voce']);
  });

  it('keeps the order stable (alphabetical) when points and streak are equal', () => {
    const ranking = rankMembers([member('z', 'Zeca', 50, 1), member('a', 'Ana', 50, 1)]);
    expect(ranking.map((e) => e.displayName)).toEqual(['Ana', 'Zeca']);
  });

  it('treats a missing streak as zero and does not mutate the input', () => {
    const input = [member('a', 'Ana', 10), member('b', 'Bia', 10, 2)];
    const ranking = rankMembers(input);
    expect(ranking.map((e) => e.userId)).toEqual(['b', 'a']);
    expect(input.map((m) => m.userId)).toEqual(['a', 'b']);
  });

  it('builds the initials and carries the streak', () => {
    const [first] = rankMembers([member('a', 'Maria Pereira', 10, 4)]);
    expect(first).toMatchObject({ initials: 'MP', streak: 4, position: 1 });
  });
});

describe('ranking helpers', () => {
  const entries = rankMembers([
    member('a', 'Ana', 500),
    member('b', 'Bia', 400),
    member('c', 'Caio', 300),
    member('d', 'Duda', 200),
    member('e', 'Eva', 100),
  ]);

  it('splits the podium (top 3) from the others', () => {
    const { podium, others } = splitPodium(entries);
    expect(podium.map((e) => e.userId)).toEqual(['a', 'b', 'c']);
    expect(others.map((e) => e.userId)).toEqual(['d', 'e']);
    expect(splitPodium(entries.slice(0, 2)).others).toEqual([]);
  });

  it('keeps backend order by position and finds the user entry', () => {
    const shuffled = [entries[2], entries[0], entries[1]];
    expect(sortByPosition(shuffled).map((e) => e.position)).toEqual([1, 2, 3]);
    expect(findEntry(entries, 'c')?.position).toBe(3);
    expect(findEntry(entries, 'nao-existe')).toBeUndefined();
    expect(findEntry(entries, undefined)).toBeUndefined();
  });

  it('builds initials from the name, falling back to the username', () => {
    expect(buildInitials('Maria Pereira', 'maria')).toBe('MP');
    expect(buildInitials('Anderson', 'anderson')).toBe('AN');
    expect(buildInitials('', 'carlos_s')).toBe('CA');
    expect(buildInitials(null, null)).toBe('?');
  });
});
