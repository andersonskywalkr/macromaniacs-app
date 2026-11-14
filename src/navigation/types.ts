import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FoodItem } from '@/api/types/domain';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined; // P2
};

export type MealsStackParamList = {
  MealsHome: undefined;
  FoodSearch: undefined;
  FoodConfirm: { food: FoodItem };
  FoodManual: undefined;
  MealBuilder: undefined;
  MealReview: { mealId: string };
};

export type GroupStackParamList = {
  GroupsList: undefined;
  // origin 'home': aberto pelo bloco de ranking da Home (o voltar leva de volta à Home)
  GroupProfile: { groupId: string; origin?: 'home' };
  RankingFull: { groupId: string };
};

export type ProfileStackParamList = {
  // saved: o Editar perfil acabou de salvar (mostra a confirmação no Perfil)
  ProfileHome: { saved?: boolean } | undefined;
  EditProfile: undefined;
  AvatarCustomizer: undefined;
  // origin 'home': aberto pelo atalho "Desempenho semanal" da Home
  History: { origin?: 'home' } | undefined;
  GamificationRewards: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

// NavigatorScreenParams permite pular direto pra uma tela específica dentro
// de outra aba (ex.: da Home pro Histórico, que vive dentro da ProfileStack) —
// sem isso, navigate('ProfileTab') sempre cairia na tela inicial daquela aba.
export type AppTabsParamList = {
  HomeTab: undefined;
  MealsTab: NavigatorScreenParams<MealsStackParamList>;
  GroupTab: NavigatorScreenParams<GroupStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  OnboardingStack: undefined;
  AppTabs: undefined;
};
