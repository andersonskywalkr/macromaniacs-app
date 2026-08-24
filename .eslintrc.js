module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-native/all',
    'eslint-config-prettier',
  ],
  env: {
    'react-native/react-native': true,
  },
  rules: {
    // Regra da seção 108: nunca deixar segredo hardcoded no app
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/^sk-|API_KEY|SECRET/]",
        message: 'Nunca hardcode chaves/segredos no frontend (seção 108 do documento de arquitetura).',
      },
    ],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
