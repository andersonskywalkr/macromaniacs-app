import * as SecureStore from 'expo-secure-store';
import { ApiError } from '@/api/ApiError';
import { getApiAccessToken, setApiAccessToken } from '@/api/authSession';
import { useAuthStore } from './authStore';
import { queryClient } from '@/queries/queryClient';

const mockGetMyProfile = jest.fn();

jest.mock('@/api/config', () => ({ USE_AUTH_MOCK: false }));
jest.mock('@/api/users', () => ({
  getMyProfile: () => mockGetMyProfile(),
}));
jest.mock('@/queries/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const user = {
  id: 'user-id',
  email: 'user@example.com',
  username: 'macro_user',
  displayName: 'Macro User',
  dateOfBirth: '1996-09-19',
  biologicalSex: 'MALE' as const,
  goal: 'MAINTAIN' as const,
  activityLevel: 'MODERATE' as const,
  targetWeightKg: null,
  targetDate: null,
  dietaryRestrictions: null,
  onboardingCompleted: true,
  onboardingCompletedAt: new Date(0).toISOString(),
  currentMeasurement: {
    id: 'measurement-id',
    heightCm: 180,
    weightKg: 80,
    measuredAt: new Date(0).toISOString(),
  },
  measurements: [],
  nutrition: {
    ageYears: 30,
    bmrKcalPerDay: 1780,
    tdeeKcalPerDay: 2759,
    calorieTargetKcalPerDay: 2759,
    calculatedAt: new Date(0).toISOString(),
  },
};

function resetStore(): void {
  setApiAccessToken(null);
  useAuthStore.setState({
    status: 'loading',
    accessToken: null,
    user: null,
    sessionRestoreError: false,
  });
}

describe('auth store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('persists the token securely and loads /me after login', async () => {
    mockGetMyProfile.mockResolvedValue(user);

    await useAuthStore.getState().signIn('jwt-token');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'macromaniacs.access-token',
      'jwt-token',
    );
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'jwt-token',
      user,
    });
    expect(getApiAccessToken()).toBe('jwt-token');
  });

  it('restores a valid persisted session through /me', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-token');
    mockGetMyProfile.mockResolvedValue(user);

    await useAuthStore.getState().bootstrap();

    expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'saved-token',
      user,
    });
  });

  it('restores an incomplete profile so navigation can open onboarding', async () => {
    const incompleteUser = {
      ...user,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      currentMeasurement: null,
      nutrition: null,
    };
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-token');
    mockGetMyProfile.mockResolvedValue(incompleteUser);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: { onboardingCompleted: false },
    });
  });

  it('updates the global profile after onboarding without another login', () => {
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'jwt-token',
      user: { ...user, onboardingCompleted: false },
    });

    useAuthStore.getState().completeOnboarding(user);

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().user?.onboardingCompleted).toBe(true);
  });

  it('starts unauthenticated when there is no persisted token', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    await useAuthStore.getState().bootstrap();

    expect(mockGetMyProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('removes an invalid persisted token', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('invalid-token');
    mockGetMyProfile.mockRejectedValue(
      new ApiError({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date(0).toISOString(),
        path: '/v1/auth/me',
      }),
    );

    await useAuthStore.getState().bootstrap();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'macromaniacs.access-token',
    );
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      accessToken: null,
      user: null,
    });
  });

  it('preserves the token when session restore fails because of the network', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-token');
    mockGetMyProfile.mockRejectedValue(new ApiError({ message: 'network' }));

    await useAuthStore.getState().bootstrap();

    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      accessToken: 'saved-token',
      sessionRestoreError: true,
    });
  });

  it('clears the complete local session on logout', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      accessToken: 'jwt-token',
      user,
    });

    await useAuthStore.getState().signOut();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'macromaniacs.access-token',
    );
    expect(queryClient.clear).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      status: 'unauthenticated',
      accessToken: null,
      user: null,
    });
    expect(getApiAccessToken()).toBeNull();
  });
});
