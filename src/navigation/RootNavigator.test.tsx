import React from 'react';
import { render } from '@testing-library/react-native';
import { RootNavigator } from './RootNavigator';

const bootstrap = jest.fn();
let mockAuthState: Record<string, unknown> = {};

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockAuthState),
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ tokens: { background: '#000', primary: '#fff' } }),
}));
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('./AuthStack', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthStackNavigator: () => ReactModule.createElement(MockText, null, 'AUTH_STACK'),
  };
});
jest.mock('./OnboardingStack', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    OnboardingStackNavigator: () =>
      ReactModule.createElement(MockText, null, 'ONBOARDING_STACK'),
  };
});
jest.mock('./AppTabs', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AppTabsNavigator: () => ReactModule.createElement(MockText, null, 'APP_TABS'),
  };
});
jest.mock('@/screens/MaintenanceScreen', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    MaintenanceScreen: () =>
      ReactModule.createElement(MockText, null, 'MAINTENANCE_SCREEN'),
  };
});
jest.mock('@/api/config', () => ({ SHOW_MAINTENANCE_SCREEN: false }));

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('@/api/config').SHOW_MAINTENANCE_SCREEN = false;
  });

  it('shows authentication when there is no valid session', () => {
    mockAuthState = { status: 'unauthenticated', user: null, bootstrap };
    const screen = render(<RootNavigator />);
    expect(screen.getByText('AUTH_STACK')).toBeTruthy();
  });

  it('routes an incomplete authenticated profile to onboarding', () => {
    mockAuthState = {
      status: 'authenticated',
      user: { onboardingCompleted: false },
      bootstrap,
    };
    const screen = render(<RootNavigator />);
    expect(screen.getByText('ONBOARDING_STACK')).toBeTruthy();
    expect(screen.queryByText('APP_TABS')).toBeNull();
  });

  it('routes a complete authenticated profile to Home tabs when maintenance mode is off', () => {
    jest.requireMock('@/api/config').SHOW_MAINTENANCE_SCREEN = false;
    mockAuthState = {
      status: 'authenticated',
      user: { onboardingCompleted: true },
      bootstrap,
    };
    const screen = render(<RootNavigator />);
    expect(screen.getByText('APP_TABS')).toBeTruthy();
    expect(screen.queryByText('ONBOARDING_STACK')).toBeNull();
    expect(screen.queryByText('MAINTENANCE_SCREEN')).toBeNull();
  });

  it('routes a complete authenticated profile to the maintenance screen when maintenance mode is on', () => {
    jest.requireMock('@/api/config').SHOW_MAINTENANCE_SCREEN = true;
    mockAuthState = {
      status: 'authenticated',
      user: { onboardingCompleted: true },
      bootstrap,
    };
    const screen = render(<RootNavigator />);
    expect(screen.getByText('MAINTENANCE_SCREEN')).toBeTruthy();
    expect(screen.queryByText('APP_TABS')).toBeNull();
  });
});
