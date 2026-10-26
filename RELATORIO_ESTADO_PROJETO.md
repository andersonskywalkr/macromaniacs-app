# Relatório do estado do MacroManiacs

Investigação feita só em leitura, sem alterar nenhum arquivo do projeto. Rodei `tsc`, lint e testes, e os três passaram.

## A) Resumo em 5 linhas

1. O app roda em Expo SDK 57, React Native 0.86, React 19 e TypeScript. A base está sólida: tema claro/escuro, camada de API com mock, navegação completa e cache de dados.
2. Estão prontos o fluxo de entrada (Cadastro, Login, sessão, logout), o Onboarding de 6 etapas com validação, e a Home com TMB, TDEE e meta calórica.
3. Das 17 telas do plano, 3 estão Prontas (Cadastro, Onboarding, Login) e 1 está Parcial (Home). As outras 13 são placeholders ("Tela ainda não implementada") ou não existem.
4. Todas as telas placeholder já têm rota, arquivo e tipos de parâmetros. Falta só preencher o conteúdo.
5. Hoje o app está configurado para mostrar uma tela de "em construção" no lugar de Início, Refeições e Grupo (`SHOW_MAINTENANCE_SCREEN` vale `true` por padrão).

**Qualidade:** `tsc --noEmit` e `eslint` não deram erro nenhum. O Jest rodou 9 suítes e 37 testes, todos passando.

## B) PRONTO

| Tela ou recurso | Arquivo | Observação |
|---|---|---|
| Cadastro | `src/screens/auth/RegisterScreen.tsx` | Valida os campos, chama o backend e faz login automático depois de cadastrar. |
| Login | `src/screens/auth/LoginScreen.tsx` | Entrada por usuário ou e-mail e senha, com tratamento de erros. Os botões sociais só mostram o aviso "Em breve". |
| Onboarding | `src/screens/onboarding/` | 6 etapas, validação por etapa, envio ao backend (`PATCH /v1/users/me`). |
| Sessão e logout | `src/store/authStore.ts` | Token no SecureStore, restauração ao abrir o app, logout ao receber 401. Há testes. |
| Guarda de navegação | `src/navigation/RootNavigator.tsx` | Carregando → Auth → Onboarding → App. Há teste. |
| Barra inferior | `src/navigation/AppTabs.tsx` | 4 abas: Início, Refeições, Grupo, Perfil, com ícones e destaque na aba ativa. |
| Tema e tokens | `src/theme/tokens.ts`, `ThemeProvider.tsx` | Claro/escuro, roxo `#5B21B6`, raio 28 nos cards. |
| Componentes base | `src/components/` | Avatar, Badge, Button, Card, ChoicePill, EmptyState, ProgressRing, TextField, ícones e mascote. |
| API e filas | `src/api/`, `src/queries/`, `src/offline/` | Mock/real, hooks de consulta e fila offline para refeições. |

## C) PARCIAL

| Item | O que falta |
|---|---|
| Home (`src/screens/home/HomeScreen.tsx`, 343 linhas) | O anel está fixo em `progress={0}`. Os macros (proteína, carboidrato e gordura) não aparecem: a tela mostra o aviso "O consumo e os macronutrientes aparecerão quando o diário alimentar estiver disponível". O sino de notificações não faz nada (TODO). Sequência, prévia do ranking, botão "Adicionar refeição" e atalho de Desempenho existem. |
| Perfil (`ProfileHomeScreen.tsx`, 40 linhas) | Mostra só o usuário, o e-mail e o botão "Sair". O TODO diz para reconstruir a partir de "Perfil Minimalista". |
| Esqueci a senha | Rota existe, tela é placeholder. É P2 no próprio código. |
| Login com Google | Botão visual que só abre o alerta "Em breve". Não há biblioteca de login social instalada. |
| Renovação de token | Não encontrei refresh token. Com 401 o app encerra a sessão. |
| Cálculo de TMB e gasto calórico | Não está no app. Os valores vêm prontos do backend (`nutrition.bmrKcalPerDay` e `tdeeKcalPerDay`). No mock são números fixos (1800 e 2790). |
| Sexo no onboarding | Há **2 opções** (Feminino e Masculino). O combinado eram 3, falta "Prefiro não informar". O texto da tela diz que o campo é sexo biológico, usado na fórmula. |
| Fonte Plus Jakarta Sans | Os estilos referenciam "PlusJakartaSans", mas o `Font.loadAsync` está vazio e `assets/fonts/` só tem `.gitkeep`. Hoje o app usa a fonte do sistema. |

## D) NÃO INICIADO (ordem do plano de 17)

Todas abaixo têm só o placeholder "Tela ainda não implementada" e a rota já criada, exceto a 10.

- 4 Esqueci a senha (`ForgotPasswordScreen`)
- 6 Refeições, lista (`MealsHomeScreen`)
- 7 Adicionar refeição, hub (`MealBuilderScreen`; o TODO cita "Refeicao Hub")
- 8 Busca de alimento (`FoodSearchScreen`)
- 9 Confirmação de alimento (`FoodConfirmScreen`)
- 10 Cadastro manual de alimento (**sem arquivo e sem rota**; só existe `createManualFood` na API)
- 11 Detalhe da refeição registrada (`MealReviewScreen`)
- 12 Grupos, lista (`GroupsListScreen`)
- 13 Perfil do grupo (`GroupProfileScreen`)
- 14 Ranking completo (`RankingFullScreen`)
- 15 Perfil do usuário (só o esqueleto com "Sair", ver seção C)
- 16 Editar perfil (`EditProfileScreen`)
- 17 Histórico e desempenho (`HistoryScreen`)

**Placar:** 3 Prontas (1, 2, 3), 2 Parciais (5 Home e 15 Perfil), 12 Não iniciadas. O item 15 conta como Parcial aqui, não como não iniciada.

## E) Como rodar

```
pnpm install
npx expo start            # abre no Expo Go; "a" abre o emulador Android, "i" o iOS
npm test                  # testes
npm run type-check        # tsc
npm run lint
```

- **Variáveis do `.env` atual:** `USE_MOCK=true` e `USE_AUTH_MOCK=false`. Isso significa que **autenticação e perfil usam o backend real** (`macromaniacs-backend-production.up.railway.app`) e os demais módulos usam mock.
- **Tudo em mock:** coloque `EXPO_PUBLIC_USE_AUTH_MOCK=true`. Nesse modo qualquer usuário e senha entram, e o token fica no AsyncStorage.
- **Usuário do mock:** `anderson@example.com`, username `anderson`, nome "Anderson". Depois de um cadastro novo, o mock exige o onboarding. O `getMe` do mock devolve `teste@macromaniacs.com`.
- **Ver as telas reais:** `EXPO_PUBLIC_SHOW_MAINTENANCE_SCREEN=false`. Sem isso você só vê a tela "em construção" nas abas Início, Refeições e Grupo. A aba Perfil nunca é substituída.
- **Build:** o `eas.json` tem o perfil `preview` (APK interno) com `SHOW_MAINTENANCE_SCREEN=true`.

## F) Problemas e riscos

- **Alterações ainda sem commit.** O `git status` mostra mudanças em `app.json`, `package.json` e no `LoginScreen`, mais arquivos novos (`eas.json`, `scripts/`, `assets/icon.png`, `mascotSvgs.ts`). `src/types/assets.d.ts` foi apagado. Não confirmei se o app ainda precisa dele. O `tsc` passa.
- **Se `EXPO_PUBLIC_API_URL` faltar com mock desligado**, o app lança erro ao iniciar (isso é proposital em `config.ts`).
- **Endpoints sem prefixo `/v1`.** Autenticação e perfil usam `/v1/...`, mas `foods`, `meals`, `groups`, `progress` e `gamification` chamam `/foods/search`, `/meals` etc., sem `/v1`. Quando o backend real existir, isso provavelmente vai quebrar. Não confirmado.
- **Nada de Refeições, Grupos e Ranking tem backend real confirmado.** Os mocks são fixos: 3 alimentos, 1 grupo ("Los Maniacs") e um ranking.
- **`EXPO_PUBLIC_USE_MOCK` ligado por padrão.** Em `config.ts`, qualquer valor diferente de `'false'` ativa o mock, inclusive a variável ausente.
- **Mock simples demais.** `createMeal` mock devolve `items: []`, e `getFoodByBarcode` devolve sempre o primeiro alimento.
- **Sem refresh token.** A sessão expira de vez quando o token vence.
- **Onboarding exige 18 a 120 anos** e rejeita menores. Isso é uma regra de negócio que vale confirmar.
- **README desatualizado.** Diz "Home nutricional ✅ pronta" e "Camada de API ✅ pronta pros domínios P0", mas o anel está em zero e os macros não aparecem. A fila offline (`offline/`) e o rascunho de refeição (`mealDraftStore`) existem, mas nenhuma tela os usa ainda.
- **Dependências instaladas sem uso aparente:** `victory-native`, `expo-camera` e `expo-notifications`, entre outras. Não confirmei o uso de cada uma.
- **Versão do TypeScript** `~6.0.3` no `package.json`. Funciona hoje, mas é uma versão muito nova.
- **Código comentado:** só o `Font.loadAsync` do `App.tsx`. Os TODOs são os já citados nas seções C e D.
- **Pastas de referência:** existem `prototype-reference/` e `.prototype-extract/` (HTMLs do protótipo). Os arquivos de login, onboarding e chat de grupo só estão na primeira. Há um "chat-grupo.html" sem tela correspondente no plano.

## G) Próximas 3 telas recomendadas

**1. Busca de alimento (item 8), ligada à Confirmação de alimento (item 9).**
Sem ela ninguém registra o que comeu, e o registro é o núcleo do produto.

- Componentes: TextField, Card e lista, EmptyState e Button. Uma linha de alimento nova com as calorias por 100 g.
- Endpoints: `searchFoods` e `getFoodByBarcode`, já existentes e já com mock.
- Mock: `mockFoods` (3 itens) e o `useFoodsSearch` já pronto. A API alerta para não buscar a cada tecla, só com botão ou espera de 400 ms.

**2. Adicionar refeição (item 7) e Refeições, lista (item 6).**
Fecham o ciclo começado pelo botão "Adicionar refeição" da Home e passam a alimentar o anel e os macros.

- Componentes: ProgressRing e Badge (que já existem), mais seletor de quantidade em gramas. O `mealDraftStore` já guarda os itens.
- Endpoints: `createMeal` e `getMealsToday`.
- Mock: `mockMealLogs`. Falta melhorar o mock de `createMeal`, que hoje devolve `items: []`.

**3. Perfil do usuário completo (item 15), seguido de Editar perfil (item 16).**
O Perfil atual é só o botão "Sair". Os dados do onboarding, o `updateMyProfile` e o `useUpdateProfile` já existem.

- Componentes: Avatar, Card, ChoicePill e TextField, reaproveitando os campos do onboarding.
- Endpoints: `GET` e `PATCH /v1/users/me`, que funcionam no backend real.
- Dados: o `mockUserProfile` já traz medidas e metas.

Os itens 12, 13 e 14 (Grupos e Ranking) vêm depois. Eles ficam mais baratos quando o fluxo de refeições estiver funcionando, porque os pontos do ranking dependem de refeições registradas.
