import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile, type UpdateMyProfileRequest } from '@/api/users';
import { myProfileKey } from './useMyProfile';

// Reaproveitada pelo onboarding (conclusão do wizard) e, futuramente, por
// EditProfileScreen (UC-03) — ambos só fazem PATCH /users/me.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateMyProfileRequest) => updateMyProfile(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(myProfileKey, data);
    },
  });
}
