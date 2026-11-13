// Mock oficial do react-native-keyboard-controller (módulo nativo): sem ele os
// testes não conseguem renderizar KeyboardProvider, KeyboardAvoidingView etc.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
