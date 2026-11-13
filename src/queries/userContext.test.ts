import { currentCalorieGoal, currentTimezone } from './userContext';
import { getDeviceTimezone } from '@/utils/today';

let mockUser: Record<string, unknown> | null = null;

jest.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => ({ user: mockUser }) },
}));

describe('user context for the daily queries', () => {
  it('uses the profile timezone and falls back to the device one', () => {
    mockUser = { timezone: 'Europe/Lisbon' };
    expect(currentTimezone()).toBe('Europe/Lisbon');

    mockUser = { timezone: null };
    expect(currentTimezone()).toBe(getDeviceTimezone());

    mockUser = null;
    expect(currentTimezone()).toBe(getDeviceTimezone());
  });

  it('gives the backend goal, or the app fallback for an incomplete-backend profile', () => {
    mockUser = {
      nutrition: { calorieTargetKcalPerDay: 1900 },
    };
    expect(currentCalorieGoal()).toBe(1900);

    mockUser = null;
    expect(currentCalorieGoal()).toBeNull();
  });
});
