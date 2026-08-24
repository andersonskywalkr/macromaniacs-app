import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '@/api/users';

export const myProfileKey = ['users', 'me'] as const;

export function useMyProfile() {
  return useQuery({
    queryKey: myProfileKey,
    queryFn: getMyProfile,
  });
}
