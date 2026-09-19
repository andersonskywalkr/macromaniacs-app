// Import estático de .svg (usado por MascotIllustration) — Metro trata o
// arquivo como asset binário comum, então o valor importado tem o mesmo
// formato que um require() de imagem (ImageSourcePropType).
declare module '*.svg' {
  import type { ImageSourcePropType } from 'react-native';

  const value: ImageSourcePropType;
  export default value;
}
