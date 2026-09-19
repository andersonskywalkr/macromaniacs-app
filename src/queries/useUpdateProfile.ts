import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile } from '@/api/users';
import { myProfileKey } from './useMyProfile';
import type { UserProfile } from '@/api/types/domain';

// Reaproveitada pelo onboarding (conclusão do wizard) e, futuramente, por
// EditProfileScreen (UC-03) — ambos só fazem PATCH /users/me.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) => updateMyProfile(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(myProfileKey, data);
    },
  });
}
