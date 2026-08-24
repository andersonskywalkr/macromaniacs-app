import { registerRootComponent } from 'expo';
import App from './src/app/App';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App)
// e garante o setup certo tanto rodando no Expo Go quanto em um build nativo.
registerRootComponent(App);
