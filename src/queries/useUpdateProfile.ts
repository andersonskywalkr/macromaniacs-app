import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile, type UpdateMyProfileRequest } from '@/api/users';
import { myProfileKey } from './useMyProfile';
import { progressTodayKey } from './useProgressToday';

// Reaproveitada pelo onboarding (conclusão do wizard) e pelo Editar perfil
// (UC-03) — ambos só fazem PATCH /users/me.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateMyProfileRequest) => updateMyProfile(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(myProfileKey, data);
      // Meta calórica e de macros dependem do perfil: o progresso do dia
      // (Home e Perfil) é buscado de novo.
      queryClient.invalidateQueries({ queryKey: progressTodayKey });
    },
  });
}
