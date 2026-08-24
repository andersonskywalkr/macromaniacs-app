import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined; // P2
};

export type MealsStackParamList = {
  MealsHome: undefined;
  FoodSearch: undefined;
  FoodConfirm: { candidateIds: string[] };
  MealBuilder: undefined;
  MealReview: { mealId: string };
};

export type GroupStackParamList = {
  GroupsList: undefined;
  GroupProfile: { groupId: string };
  RankingFull: { groupId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  History: undefined;
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

export type RootStackParamList = {
  AuthStack: undefined;
  AppTabs: undefined;
};
