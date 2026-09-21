# MacroManiacs — App (React Native + Expo)

Terreno inicial do frontend, montado a partir do Documento de Arquitetura
(seções 6, 111, 117–129). Antes de mexer, leia os pontos abaixo — eles
explicam **por que** as coisas estão organizadas assim.

## Como rodar

```bash
# 1. Instale as dependências (recomendado pnpm, ver seção 117.2)
pnpm install

# 1.1. Depois de instalar, rode este comando pra garantir que todas as
# libs nativas (câmera, secure-store, etc.) estão na versão certa pro
# Expo SDK 57 — corrige sozinho qualquer divergência de versão:
npx expo install --fix

# 2. Copie o .env de exemplo
cp .env.example .env

# 3. Rode o app
npx expo start
```

Abra no celular com o app **Expo Go**, ou pressione `a` / `i` no terminal
para emulador Android/iOS (se configurado na sua máquina).

O projeto possui validação automatizada de tipos, lint, testes e exportação
Expo. Rode `npx expo-doctor` se o ambiente local ou o Expo Go indicar
divergência de versões.

## A flag mais importante: `EXPO_PUBLIC_USE_MOCK`

No `.env`:

```
EXPO_PUBLIC_USE_MOCK=true   # usa dados fake, não precisa do backend rodando
EXPO_PUBLIC_USE_MOCK=false  # chama a API real (preencha EXPO_PUBLIC_API_URL)
```

Para apresentar a autenticação real enquanto os demais módulos ainda usam
dados demonstrativos:

```env
EXPO_PUBLIC_USE_MOCK=true
EXPO_PUBLIC_USE_AUTH_MOCK=false
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Use `10.0.2.2` no emulador Android, `localhost` no simulador iOS/web ou o IP
local da máquina em um celular físico. A URL não deve conter `/api/v1`; o
cliente usa diretamente `/v1/auth/register`, `/v1/auth/login`,
`/v1/auth/me` e `/v1/users/me`.

Com `EXPO_PUBLIC_USE_AUTH_MOCK=false`, autenticação, perfil, onboarding e os
valores nutricionais da Home sempre usam a API real. Os outros módulos podem
continuar com `EXPO_PUBLIC_USE_MOCK=true` até seus endpoints existirem.

## Compatibilidade com o Expo Go

O projeto está fixado no **Expo SDK 57**. O app Expo Go instalado no celular precisa ser da
mesma versão de SDK — se aparecer um erro dizendo que o projeto só é compatível com outro SDK,
duas soluções:

1. Rode `npx expo install --fix` para alinhar as libs do projeto à versão do SDK declarada no
   `package.json`, ou
2. Se o Expo Go do celular for de um SDK diferente, atualize o Expo Go pela loja de aplicativos
   (ele geralmente já acompanha a versão mais recente).

## O que já está pronto

| Camada | Onde | Status |
|---|---|---|
| Config (tsconfig, eslint, env) | raiz | ✅ pronto |
| Design tokens (cores, radius, fontes) | `src/theme/tokens.ts` | ✅ pronto, extraído do documento |
| Tema claro/escuro | `src/theme/ThemeProvider.tsx` | ✅ pronto |
| Autenticação (store + telas) | `src/store/authStore.ts`, `src/screens/auth/` | ✅ Cadastro, login, perfil, restauração e logout local |
| Camada de API (mock/real) | `src/api/*.ts` | ✅ pronto pros domínios P0 |
| Queries (TanStack Query) | `src/queries/*.ts` | ✅ pronto pros domínios P0 |
| Offline (outbox + sync) | `src/offline/*.ts` | ✅ pronto |
| Componentes base | `src/components/*.tsx` | ✅ Card, Button, ProgressRing, Badge, Avatar, EmptyState |
| Onboarding | `src/screens/onboarding/` | ✅ valida, persiste no backend e conclui somente após confirmação |
| Navegação completa | `src/navigation/*.tsx` | ✅ auth loading, login, onboarding e aplicação |
| Home nutricional | `src/screens/home/HomeScreen.tsx` | ✅ TMB, TDEE e meta calórica reais; demais domínios continuam isolados |
| Outras telas de conteúdo | `src/screens/**` | 🟡 mocks/placeholders conforme disponibilidade dos endpoints |

## O que falta (próximos passos, nessa ordem)

1. **Copiar os assets do protótipo** (`mascote.png`, `fire.svg`, medalhas,
   `perfil.jpg` etc.) do zip do Netlify para `assets/`, e referenciá-los
   nos componentes (`Avatar`, `EmptyState` já esperam esses arquivos).
2. **Adicionar a fonte Plus    Jakarta Sans** de verdade em `assets/fonts/` e
   descomentar o `Font.loadAsync` em `src/app/App.tsx`.
3. **Substituir os mocks remanescentes** somente quando Refeições, Grupos,
   Ranking e Gamificação tiverem endpoints reais no backend.
4. Em um celular físico, configure `EXPO_PUBLIC_API_URL` com o IP local da
   máquina e mantenha backend, PostgreSQL e Metro em execução.

## Decisões já tomadas (não precisa redebater)

Tudo isso já está fechado no documento de arquitetura, seções 109 e
117–121 — não é pra ser alterado sem atualizar o documento e avisar o
time:

- Expo managed workflow (não é RN CLI puro)
- TanStack Query pra dados de servidor, Zustand pra estado local de UI
- axios com Bearer token centralizado e encerramento local da sessão em 401
- Tokens de segurança (JWT) em `expo-secure-store`, nunca em AsyncStorage
- `StyleSheet.create` + tokens, sem NativeWind/Tailwind
- Tipos de domínio em `src/api/types/domain.ts` até o backend publicar o
  Swagger real (aí entra `npm run generate:types`, seção 120.2)

## Pendências que dependem do time de backend

Estas eram pendências do documento original (seção 129) e continuam
abertas — o mock foi construído com uma suposição razoável pra cada uma,
documentada no código:

- **Pendente 11**: nomes exatos dos query params `from`/`to` em
  `GET /meals` (usado em `src/api/meals.ts` → `getMealsByDateRange`, que
  alimenta o cálculo de streak da seção 127.4).
- **Pendente 12**: se um endpoint `/dashboard` agregador vai existir —
  por enquanto a Home consome os endpoints individuais em paralelo, como
  o documento recomenda para o P0.
- **Pendente 13**: se alguma feature de P2 (IA com foto) vai exigir sair
  do Expo managed workflow.
