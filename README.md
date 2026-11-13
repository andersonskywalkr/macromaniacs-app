# MacroManiacs

Aplicativo mobile (Android e iOS) de **acompanhamento nutricional com gamificação e grupos**. A pessoa registra o que come, vê quanto falta para a meta de calorias e macros do dia, mantém uma sequência de dias e compete com amigos em grupos.

Este repositório é o **app (frontend)**. O backend (NestJS + PostgreSQL, publicado na Railway) é mantido por outros membros da equipe e não está aqui.

## O que já está pronto

- **Conta:** cadastro, login, restauração da sessão, sair, "Esqueci a senha" (no modo mock é uma demonstração; no modo real mostra que o recurso ainda não está disponível).
- **Onboarding:** sexo, idade, altura, peso, objetivo, nível de atividade e restrições alimentares, salvos no perfil.
- **Início:** anel de calorias do dia, macros (proteína, carboidrato, gordura), sequência de dias e pontos.
- **Refeições:** montar uma refeição com vários alimentos, escolher o tipo (café da manhã, almoço…), revisar e salvar; lista do dia com totais.
- **Busca de alimentos:** sugestões enquanto digita, histórico de buscas, busca completa e cadastro manual de alimento.
- **Grupos:** lista de grupos, entrar com código de convite, ranking, aba Sobre e chat do grupo (campo que cresce com o texto, envio com retentativa).
- **Histórico:** desempenho dos últimos dias, com "meta batida" (de 90% a 110% da meta).
- **Perfil:** dados da conta, editar perfil, tema claro/escuro/automático.
- **Funciona sem internet:** refeições salvas sem rede ficam numa fila e são enviadas quando a conexão volta.
- **Teclado:** campos nunca ficam escondidos atrás do teclado (Android e iOS).

## Tecnologias

- **Expo SDK 58** (`expo ~58.0`), **React Native 0.88**, **React 19**, **TypeScript 6**
- React Navigation 7 (pilhas e abas)
- TanStack Query (dados do servidor) e Zustand (estado local)
- axios, AsyncStorage e `expo-secure-store` (o token de login fica no armazenamento seguro)
- Fonte Plus Jakarta Sans (`@expo-google-fonts`)
- Testes: Jest + `jest-expo` + Testing Library
- Backend (outra equipe): NestJS + PostgreSQL, publicado na Railway

## Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (versão 20 ou mais nova) e npm
- Celular com o app **Expo Go** na versão do **SDK 58** (ou um emulador Android/iOS)
- Para gerar o APK: uma conta gratuita em [expo.dev](https://expo.dev)

## Instalação

```bash
npm install
cp .env.example .env
```

O `.env.example` já vem no modo **mock** (tudo funciona sem backend e sem internet).

> O repositório tem um `pnpm-lock.yaml`. O `npm install` funciona normalmente; o pnpm é opcional.

## Como rodar

```bash
npx expo start
```

Escaneie o QR code com o Expo Go, ou aperte `a` (emulador Android) ou `i` (simulador iOS). Depois de mudar o `.env`, reinicie limpando o cache: `npx expo start -c`.

### Modo mock × modo real

O app lê estas variáveis do `.env`. Elas começam com `EXPO_PUBLIC_` porque o Expo as **grava dentro do app na hora de rodar/gerar o build**.

| Variável | O que faz |
|---|---|
| `EXPO_PUBLIC_USE_MOCK` | `true` = dados de demonstração (alimentos, refeições, progresso, grupos). `false` = backend real. |
| `EXPO_PUBLIC_USE_AUTH_MOCK` | `true` = login, cadastro e perfil de demonstração (qualquer usuário e senha entram). `false` = login real. Se não for definida, acompanha `EXPO_PUBLIC_USE_MOCK`. |
| `EXPO_PUBLIC_API_URL` | Endereço do backend, **sem `/v1` no final** (o app já põe `/v1` em todas as rotas). Obrigatória quando alguma das duas chaves acima for `false`; sem ela o app não abre. |
| `EXPO_PUBLIC_MAINTENANCE_TABS` | Abas que mostram a tela "em construção" no lugar da tela real (`home`, `meals`, `group`, separadas por vírgula). **Hoje fica vazia**: nenhuma aba em manutenção. A aba Perfil nunca entra aqui. |
| `EXPO_PUBLIC_LANDING_PAGE_URL` | Página aberta pelo botão da tela "em construção". |

Combinações mais usadas:

| Objetivo | `USE_MOCK` | `USE_AUTH_MOCK` | `API_URL` |
|---|---|---|---|
| Apresentação sem internet (principal) | `true` | `true` | não precisa |
| Tudo real | `false` | `false` | obrigatória |
| Login real e o resto de demonstração | `true` | `false` | obrigatória |

Exemplos de `EXPO_PUBLIC_API_URL`: `http://10.0.2.2:3000` (emulador Android), `http://localhost:3000` (simulador iOS), `http://IP_DA_SUA_MAQUINA:3000` (celular físico na mesma rede) ou a URL do backend publicado.

Como o app conversa com o backend (rotas, conversões, limitações): [docs/INTEGRACAO_BACKEND.md](docs/INTEGRACAO_BACKEND.md).

## Testes e verificações

```bash
npm test               # testes automatizados (Jest)
npm run type-check     # TypeScript (tsc --noEmit)
npm run lint           # ESLint
npx expo-doctor        # confere a saúde do projeto Expo
npx expo install --check   # confere se as versões das libs batem com o SDK
```

## Estrutura de pastas

```
src/
  api/          chamadas ao backend (mock e real), rotas, adaptadores e tipos
    adapters/   conversões entre o formato do backend e o do app
  app/          App.tsx (provedores, fonte, tela de abertura)
  components/   componentes reutilizáveis (Button, Card, ProgressRing, teclado…)
  hooks/        hooks compartilhados
  mocks/        dados de demonstração
  navigation/   pilhas e abas
  offline/      fila de refeições sem rede e sincronização
  queries/      TanStack Query (consultas e mutações)
  screens/      telas, por área (auth, onboarding, home, meals, foods, groups, profile, progress)
  store/        Zustand (sessão, tema, rascunho de refeição, histórico de busca)
  theme/        cores, tamanhos, fonte e tema claro/escuro
  utils/        funções puras (datas, cálculo de energia, ranking de sugestões…)
  validation/   validação de formulários
assets/         ícone e mascote
docs/           documentação técnica (integração com o backend)
scripts/        scripts de apoio
```

## Como gerar o APK (instalar no celular Android)

O APK é gerado na nuvem pelo EAS Build, com a conta Expo do time. Existem dois perfis em `eas.json`:

| Perfil | Para quê | Backend |
|---|---|---|
| `preview-mock` | Apresentação offline (tudo de demonstração) | não usa |
| `preview-real` | App conectado ao backend | usa a URL definida em `eas.json` |

Passo a passo:

```bash
# 1. Entrar na conta Expo (uma vez)
npx eas-cli login

# 2a. APK de demonstração (mock)
npx eas-cli build -p android --profile preview-mock

# 2b. APK com backend real
npx eas-cli build -p android --profile preview-real
```

Ao terminar (alguns minutos), o terminal mostra um link e um QR code para baixar o `.apk`.

**Instalar no celular:** abra o link de download no próprio celular (ou envie o `.apk` por mensagem/cabo), toque no arquivo e permita "instalar apps de fontes desconhecidas" quando o Android pedir.

**Atenção ao `preview-real`:**

- Em `eas.json`, o campo `EXPO_PUBLIC_API_URL` do perfil `preview-real` está com um **valor provisório** (`https://COLOQUE-AQUI-A-URL-DO-BACKEND`). Troque pela URL do backend publicado, **sem `/v1` no final**, antes de gerar o APK.
- As variáveis `EXPO_PUBLIC_*` ficam **gravadas dentro do APK na hora do build**. Se a URL do backend mudar, é preciso gerar um **novo APK**.
- Cada build novo que for entregue deve ter a `version` do `app.json` conferida (hoje `0.1.0`).

## Limitações conhecidas

- **Login com Google:** botão mostra "Em breve"; ainda não funciona.
- **Sino de notificações (Início):** é só um espaço reservado; não abre nenhuma tela.
- **Fotos de refeição e leitura de código de barras pela câmera:** não existem ainda.
- **Sugestões de busca (modo real):** vêm apenas do que já está no banco do backend. A busca completa também consulta fontes externas.
- **Histórico de busca:** fica só no aparelho (some ao limpar os dados do app ou trocar de celular).
- **Recuperar senha:** no modo real ainda não está disponível.
- **Meta batida:** a faixa de 90% a 110% da meta aguarda validação da Nutrição.
- **"Prefiro não informar" (sexo):** o backend não calcula metas; o app calcula localmente (constante também aguardando a Nutrição).
- **Sem paginação:** listas pedem uma página grande (o formato do `meta` do backend não foi confirmado).

## Decisões de projeto

- Expo gerenciado (sem código nativo próprio) e TypeScript estrito.
- Tokens de design em `src/theme/tokens.ts`; estilos com `StyleSheet.create`, sem Tailwind.
- Fonte sempre via `fontFamily(peso)` (nunca `fontWeight`).
- O formato do backend nunca chega às telas: tudo passa pelos adaptadores em `src/api/adapters/`.
- Token de login só em `expo-secure-store`, nunca em AsyncStorage.
- Quando o backend publicar o Swagger, os tipos podem ser gerados com `npm run generate:types`.
