# Relatório do estado atual do MacroManiacs

> **Nota:** este relatório é um retrato de 13/11/2026, antes das etapas de integração com o backend, telas finais, teclado e atualização para o SDK 58. A tabela de versões (seção 3) foi corrigida; o restante descreve o estado da época. Para o estado atual, veja o `README.md` e o `docs/INTEGRACAO_BACKEND.md`.

Levantamento somente de leitura, feito em 13/11/2026 no computador do desenvolvedor.
Nenhum arquivo do projeto foi alterado, e nenhum comando de escrita do Git foi usado
(só `git status`, `git log`, `git diff`, `git show`, `git ls-remote`). Este arquivo é o
único criado nesta tarefa. Valores do `.env` não são mostrados; só nomes e situação.

---

## A) Resumo em 5 linhas

1. O computador está **100% sincronizado com o GitHub**: a árvore de trabalho está limpa, não há arquivo modificado, novo ou apagado, e a branch `master` local está no mesmo commit do remoto (`db8a214`, de 26/10/2026).
2. Quantidade de coisas **só no computador: 0** arquivos do projeto (o único arquivo local de propósito é o `GIT_MANUAL.md`, ignorado pelo `.gitignore`).
3. Tudo o que foi feito nas últimas etapas (refeições, Home com anel e macros, Perfil, Editar perfil, sexo com 3 opções, TMB no mock) está no commit `db8a214`, já no GitHub.
4. Das 17 telas do plano, **12 estão prontas e 5 são placeholder** (Esqueci a senha, Grupos, Perfil do grupo, Ranking completo, Histórico). Só a aba Grupo mostra a tela de manutenção.
5. Qualidade: `type-check`, `lint` e `npm test` passam (30 suítes, 166 testes). Para integrar com o backend real, os maiores bloqueios são: endpoints sem `/v1` (foods, meals, progress, gamification, groups), nenhum contrato confirmado para esses endpoints, ausência de `timezone` e de campo próprio para o tipo da refeição.

---

## B) Situação do Git

**Branches**

| Onde | Branch | Commit | Observação |
|---|---|---|---|
| Local | `master` (atual) | `db8a214` | em dia com `origin/master`, 0 commits à frente |
| Remoto | `master` | `db8a214` | mesmo commit do local (confirmado com `git ls-remote`) |
| Remoto | `feat/onboarding-nutrition-integration` | `5582a7f` | já foi mesclada na `master` pelo Pull Request nº 1 (20/09/2026) |
| Remoto | `feature/chat-grupo` | `4f01a9c` | **não existe no computador**; o conteúdo não foi confirmado (precisaria de `git fetch`, que não foi executado) |

- Última branch usada: `master` (o histórico de movimentos mostra só `master`).
- Remoto configurado: `origin` = `github.com/andersonskywalkr/macromaniacs-app`.
- Não há branches locais além da `master`.

**Não commitado:** nada. `git status`: "nothing to commit, working tree clean".
Arquivos novos (não rastreados): nenhum. Apagados: nenhum. Renomeados: nenhum.

**Não enviado ao GitHub:** nada. `git log origin/master..master` está vazio.

**O que há no último commit (`db8a214`, "Fecha o ciclo de refeições, Home, Perfil e Editar perfil")**
77 arquivos, 5.949 linhas incluídas e 321 removidas. Resumo por grupo (como não há mudanças pendentes, a explicação é do commit):

| Grupo | Arquivos principais | O que mudou e por quê |
|---|---|---|
| Refeições | `MealBuilderScreen`, `MealsHomeScreen`, `MealReviewScreen`, `FoodSearchScreen`, `FoodConfirmScreen`, `FoodManualScreen`, `api/meals.ts`, `api/mealName.ts` | Ciclo completo de registrar refeição: busca, confirmação, cadastro manual, hub com vários itens, nome do prato separado do tipo, lista e detalhe. |
| Home | `HomeScreen`, `MacroBar`, `InlineRetry`, `utils/dailyProgress.ts` | Anel de calorias, macros, falha parcial por consulta; TMB/TDEE saíram da tela. |
| Perfil | `ProfileHomeScreen`, `EditProfileScreen`, `validation/profileForm.ts`, `utils/streak.ts` | Perfil com dados do dia, pontos e sequência, tema, Editar perfil com aviso ao sair. |
| Sexo e TMB | `api/sexMapping.ts`, `utils/energy.ts`, `mocks/mockProfile.ts`, `StepSex`, `onboarding/types.ts` | 3 opções de sexo; cálculo de TMB/TDEE/meta só no mock. |
| Navegação e config | `AppTabs`, `MealsStack`, `types.ts`, `api/config.ts` | Abas em manutenção por variável (`EXPO_PUBLIC_MAINTENANCE_TABS`). |
| Mocks e dados | `mocks/data.ts`, `mocks/mealStore.ts` | 22 alimentos de teste; consumo do dia começa em 0. |
| Build e assets | `eas.json`, `app.json`, `assets/icon.png`, `scripts/generate-mascot-svgs.js`, `components/mascotSvgs.ts` | Perfil de build `preview`, ícone do app, mascote em texto. |
| Testes | 22 arquivos `*.test.ts(x)` novos ou ajustados | Cobrem cálculos, validações, telas e o fluxo de navegação. |
| Outros | `.gitignore`, `.env.example`, `RELATORIO_ESTADO_PROJETO.md`, `types/assets.d.ts` (apagado) | Ver "Pontos de atenção" abaixo. |

**Dependências (package.json e lockfile)**
Única mudança em relação ao commit anterior à etapa (`c9ef20a`): entrou `babel-preset-expo ~57.0.12` em `dependencies` (3 linhas a mais no `pnpm-lock.yaml`). Nenhuma outra dependência foi adicionada ou removida.

**`.env`**
- Não está rastreado (`git ls-files` mostra só o `.env.example`) e não aparece como novo.
- Coberto pelo `.gitignore` (regras `.env` e `.env.*`, com exceção `!.env.example`). Confirmado com `git check-ignore`.

**Pontos de atenção**
- `RELATORIO_ESTADO_PROJETO.md` **está rastreado e foi enviado ao GitHub** no commit `db8a214` (a versão anterior deste relatório). Pediu-se que ele não fosse commitado: hoje ele não está no `.gitignore`. Este novo conteúdo vai aparecer como "modificado" no `git status`.
- O arquivo `GIT_MANUAL.md` existe só no computador e está no `.gitignore`, como combinado.
- Existe no GitHub uma branch `feature/chat-grupo` que o computador não conhece.

**Recomendação para salvar tudo com segurança** (sugestão, nada foi executado)
1. Não há trabalho a salvar: tudo já está no GitHub. Para ter uma "foto" desta versão, criar uma etiqueta: `git tag fim-ciclo-refeicoes` e `git push origin fim-ciclo-refeicoes`.
2. Decidir sobre este relatório: ou deixar versionado de propósito, ou parar de rastrear com `git rm --cached RELATORIO_ESTADO_PROJETO.md`, incluí-lo no `.gitignore` e fazer um commit.
3. Para ver a `feature/chat-grupo` antes de planejar a integração: `git fetch origin` e depois `git log origin/feature/chat-grupo --oneline -10`.
4. Para novas tarefas, trabalhar em branch própria (`git checkout -b feat/nome-da-tarefa`) e abrir Pull Request, como descrito no `GIT_MANUAL.md`.

---

## 2) O que mudou desde o relatório anterior

O relatório anterior (20/10/2026, versão enviada no commit `db8a214`) mostrava 3 telas prontas (Cadastro, Login, Onboarding), 2 parciais (Home e Perfil) e 12 não iniciadas. Hoje:

| Item | Situação então | Situação agora | Onde está |
|---|---|---|---|
| Home | Parcial (anel em 0, sem macros, TMB/TDEE visíveis) | Pronta (anel, consumidas/restantes/meta, macros, falha parcial) | já está no GitHub |
| Busca de alimento | Placeholder | Pronta | já está no GitHub |
| Confirmação de alimento | Placeholder | Pronta | já está no GitHub |
| Cadastro manual de alimento | Sem arquivo e sem rota | Pronta | já está no GitHub |
| Adicionar refeição (hub) | Placeholder | Pronta | já está no GitHub |
| Refeições (lista) | Placeholder | Pronta | já está no GitHub |
| Detalhe da refeição | Placeholder | Pronta | já está no GitHub |
| Perfil | Parcial (só "Sair") | Pronta (sem nível/XP e medalhas) | já está no GitHub |
| Editar perfil | Placeholder | Pronta | já está no GitHub |
| Sexo | 2 opções | 3 opções | já está no GitHub |
| Aba Refeições | Em manutenção | Real | já está no GitHub |
| Tema claro/escuro | Botão na Home | Escolha no Perfil (Claro, Escuro, Automático) | já está no GitHub |
| Fonte Plus Jakarta Sans | Sem arquivo | Continua sem arquivo | sem mudança |

"Só no meu computador": nenhum item.

---

## 3) Configuração

| Item | Versão |
|---|---|
| Expo SDK | 58 (`expo ~58.0.25`) |
| React Native / React | 0.88.1 / 19.3.0 |
| TypeScript | `~6.0.3` |
| Navegação | `@react-navigation/native`, `native-stack` e `bottom-tabs` (^7) |
| Estado | `zustand ^4.5` |
| Requisições e cache | `axios ^1.7`, `@tanstack/react-query ^5.45` |
| Armazenamento | `@react-native-async-storage/async-storage 2.2.0`, `expo-secure-store ~58.0.3` |
| Rede | `@react-native-community/netinfo 12.0.1` |
| Testes | `jest ^30`, `jest-expo ~58`, `@testing-library/react-native ^12` |

**Scripts:** `start`, `android`, `ios`, `lint`, `type-check`, `test` (`jest --runInBand`), `generate:types` (usa `$SWAGGER_URL`, mas não há `api.d.ts` gerado) e `prepare` (husky).

**Variáveis de ambiente lidas pelo código** (todas em `src/api/config.ts`)

| Variável | Padrão no código se ausente | `.env` local | `.env.example` | `eas.json` (preview) |
|---|---|---|---|---|
| `EXPO_PUBLIC_USE_MOCK` | mock ligado (qualquer valor diferente de `false` liga) | preenchida | presente | presente |
| `EXPO_PUBLIC_USE_AUTH_MOCK` | segue o valor de `USE_MOCK` | preenchida | presente | presente |
| `EXPO_PUBLIC_API_URL` | vazio; **lança erro ao iniciar** se `USE_MOCK` ou `USE_AUTH_MOCK` for falso e ela faltar | ausente (a linha existe comentada) | presente | presente (domínio `macromaniacs-backend-production.up.railway.app`) |
| `EXPO_PUBLIC_MAINTENANCE_TABS` | `group` | preenchida | `group` | `group` |
| `EXPO_PUBLIC_LANDING_PAGE_URL` | vazio | preenchida (domínio `macromaniacs-landingpage.vercel.app`) | presente | presente |

---

## C) Tabela de telas (17 do plano)

| # | Item | Arquivo | Situação | GitHub |
|---|---|---|---|---|
| 1 | Cadastro | `screens/auth/RegisterScreen.tsx` | Pronta | no GitHub |
| 2 | Onboarding | `screens/onboarding/OnboardingScreen.tsx` e `steps/` | Pronta | no GitHub |
| 3 | Login | `screens/auth/LoginScreen.tsx` | Pronta (botão do Google só avisa "Em breve") | no GitHub |
| 4 | Esqueci a senha | `screens/auth/ForgotPasswordScreen.tsx` | Placeholder | no GitHub |
| 5 | Home | `screens/home/HomeScreen.tsx` | Pronta (sino sem ação, TODO) | no GitHub |
| 6 | Refeições (lista) | `screens/meals/MealsHomeScreen.tsx` | Pronta | no GitHub |
| 7 | Adicionar refeição (hub) | `screens/meals/MealBuilderScreen.tsx` | Pronta | no GitHub |
| 8 | Busca de alimento | `screens/foods/FoodSearchScreen.tsx` | Pronta | no GitHub |
| 9 | Confirmação de alimento | `screens/foods/FoodConfirmScreen.tsx` | Pronta | no GitHub |
| 10 | Cadastro manual de alimento | `screens/foods/FoodManualScreen.tsx` | Pronta | no GitHub |
| 11 | Detalhe da refeição | `screens/meals/MealReviewScreen.tsx` | Pronta (sem "Excluir": não há função na API) | no GitHub |
| 12 | Grupos (lista) | `screens/groups/GroupsListScreen.tsx` | Placeholder | no GitHub |
| 13 | Perfil do grupo | `screens/groups/GroupProfileScreen.tsx` | Placeholder | no GitHub |
| 14 | Ranking completo | `screens/groups/RankingFullScreen.tsx` | Placeholder | no GitHub |
| 15 | Perfil | `screens/profile/ProfileHomeScreen.tsx` | Pronta (sem nível/XP e medalhas, por falta de dado na API) | no GitHub |
| 16 | Editar perfil | `screens/profile/EditProfileScreen.tsx` | Pronta (sem troca de senha e e-mail) | no GitHub |
| 17 | Histórico e desempenho | `screens/progress/HistoryScreen.tsx` | Placeholder | no GitHub |

Resultado: **12 prontas, 5 placeholders, 0 inexistentes.**
Tela extra: `screens/MaintenanceScreen.tsx` ("O app está em construção", botão para a landing page).

**Abas e tela de manutenção**
- Início: tela real. Refeições: real. **Grupo: tela de manutenção.** Perfil: real (nunca entra na lista).
- `EXPO_PUBLIC_MAINTENANCE_TABS`: padrão no código = `group`; `eas.json` (preview) = `group`; `.env.example` = `group`. O `.env` local está preenchido (valor não mostrado).

---

## D) Camada de API

**Base e transporte (`src/api/client.ts`, `config.ts`)**
- URL base: `EXPO_PUBLIC_API_URL` sem barra final. Os caminhos de auth/users já incluem `/v1`; os demais não.
- Dois clientes axios, ambos com tempo limite de 10 s e `Content-Type: application/json`:
  - `publicHttpClient`: usado em login e cadastro; nunca envia token.
  - `httpClient`: envia `Authorization: Bearer <token>` (token mantido em memória em `authSession.ts`).
- 401 em chamada autenticada com token presente: chama o logout local (`authStore.signOut`), que apaga o token e limpa o cache. Em 401 no `bootstrap`, o token salvo é apagado.
- Não existe renovação de token (refresh token): não confirmado no backend e ausente no app.
- Erros: com resposta, vira `ApiError` (`statusCode`, `code`, `message`); sem resposta, `ApiError` "NETWORK_ERROR" com `statusCode` 0. Mensagens em `authErrors.ts`.
- Token guardado no `SecureStore` quando `USE_AUTH_MOCK=false`, e no `AsyncStorage` no modo mock de autenticação.

**Funções**

| Função (arquivo) | Método e caminho no modo real | Envia | Recebe | Mock | Adaptação |
|---|---|---|---|---|---|
| `login` (`auth.ts`) | POST `/v1/auth/login` | `{ identifier, password }` | `{ accessToken }` | Sim (`USE_AUTH_MOCK`), token fixo | Não |
| `register` (`auth.ts`) | POST `/v1/auth/register` | `{ email, username, password, termsAccepted: true }` | `CurrentUser` | Sim (`USE_AUTH_MOCK`) | Não |
| `getMe` (`auth.ts`) | GET `/v1/auth/me` | nada | `CurrentUser` | Sim (`USE_AUTH_MOCK`) | Não. **Nenhuma tela chama esta função** |
| `getMyProfile` (`users.ts`) | GET `/v1/users/me` | nada | `UserProfile` (com `nutrition`) | Sim (`USE_AUTH_MOCK`, `mocks/mockProfile.ts`) | `sexMapping.fromApiSex` (valor desconhecido vira `null`) |
| `updateMyProfile` (`users.ts`) | PATCH `/v1/users/me` | `UpdateMyProfileRequest`: nome, usuário, nascimento, `biologicalSex` (texto), objetivo, atividade, `heightCm`, `currentWeightKg`, peso-alvo, prazo, restrições | `UserProfile` | Sim (`USE_AUTH_MOCK`); recalcula TMB/TDEE/meta | `toApiSex` na ida; `fromApiSex` na volta |
| `searchFoods` (`foods.ts`) | GET `/foods/search?q=` (**sem /v1**) | `q` | `FoodItem[]` | Sim (`USE_MOCK`, 22 alimentos) | Não |
| `getFoodByBarcode` (`foods.ts`) | GET `/foods/barcode/:barcode` (**sem /v1**) | código | `FoodItem` (404 vira `null`) | Sim (`USE_MOCK`) | 404 tratado. **Nenhuma tela chama** |
| `createManualFood` (`foods.ts`) | POST `/foods/manual` (**sem /v1**) | `FoodItem` sem `id`, `source` e `externalId` (inclui `brand`, `barcode`, `nutritionPer100g`) | `FoodItem` | Sim (`USE_MOCK`, guarda em memória) | Não |
| `createMeal` (`meals.ts`) | POST `/meals` (**sem /v1**) | `{ name, plannedMealId?, photoUrl?, consumedAt, items: [{ foodId, amountGrams }] }` | `MealLog` | Sim (`USE_MOCK`, `mocks/mealStore.ts`) | `mealName`: `name` = `"Tipo - Nome"` ou só `"Tipo"`; resposta decodificada em `mealType` e `name` |
| `getMealsToday` (`meals.ts`) | GET `/meals/today` (**sem /v1**) | nada | `MealLog[]` | Sim (`USE_MOCK`) | decodifica `name` |
| `getMealsByDateRange` (`meals.ts`) | GET `/meals?from=&to=` (**sem /v1**) | `from`, `to` | `MealLog[]` | Sim, devolve dado antigo fixo | decodifica `name`. **Nenhuma tela chama** |
| `getProgressToday` (`progress.ts`) | GET `/progress/today` (**sem /v1**) | nada | `{ calories, protein, carbohydrates, fat }`, cada um com `goal` e `consumed` | Sim (`USE_MOCK`, soma as refeições do `mealStore`) | Não |
| `getGamificationStats` (`gamification.ts`) | GET `/gamification/stats` (**sem /v1**) | nada | `{ points, currentStreak, bestStreak }` | Sim (`USE_MOCK`, valores fixos) | Não |
| `getMyGroups` (`groups.ts`) | GET `/groups` (**sem /v1**) | nada | `GroupSummary[]` | Sim (`USE_MOCK`, 1 grupo) | Não |
| `getGroupRanking` (`groups.ts`) | GET `/groups/:id/ranking` (**sem /v1**) | `groupId` | `RankingEntry[]` | Sim (`USE_MOCK`) | Não |
| `joinGroup` (`groups.ts`) | POST `/groups/join` (**sem /v1**) | `{ inviteCode }` | `GroupSummary` | Sim (`USE_MOCK`) | Não. **Nenhuma tela chama** |

Tipos de referência: `src/api/types/domain.ts`, escritos à mão (não há `api.d.ts` gerado do Swagger).

**Flags mock/real**

| `EXPO_PUBLIC_USE_MOCK` | `EXPO_PUBLIC_USE_AUTH_MOCK` | O que liga |
|---|---|---|
| `true` (ou ausente) | `true` (ou ausente) | Tudo mock, sem chamada ao backend. Token no AsyncStorage. |
| `true` | `false` | Login, cadastro e perfil reais (SecureStore); alimentos, refeições, progresso, gamificação e grupos em mock. É a combinação do `eas.json` preview. |
| `false` | ausente | Tudo real (a de auth acompanha `USE_MOCK`). |
| `false` | `true` | Autenticação e perfil em mock e o resto real: combinação sem sentido na prática, pois as chamadas reais iriam sem token válido. |

Aviso do modo híbrido (`true` / `false`): a meta calórica vem do perfil real, mas o consumo e as metas de macros do progresso vêm do mock, calculados a partir do perfil mock. Os números do mock podem não bater com o perfil real.

**Fila offline (`src/offline/`)**
- Quando `createMeal` falha por rede, `useCreateMeal` guarda a refeição no `AsyncStorage` (chave `macromaniacs:meals-outbox`) e o hub avisa o usuário.
- Ao voltar a conexão (`NetInfo`), `sync.ts` reenvia em ordem e invalida progresso e gamificação.
- Lacunas: a lista de refeições do dia não é atualizada depois do reenvio, e não há marca de "pendente" em nenhuma tela. Entradas guardadas antes da separação de tipo e nome teriam `mealType` ausente (risco baixo; só existiria em modo real).

---

## 6) Fuso horário

- O app **não envia `timezone`** em nenhum lugar (nem no Onboarding, nem no Editar perfil, nem em cabeçalho). Confirmado por busca no código: nenhuma ocorrência.
- "Hoje" no app:
  - Consumo e lista do dia: quem decide é o backend (`/meals/today`, `/progress/today`); o app não manda data nem fuso. No mock, tudo que foi salvo na sessão conta como hoje (sem virada de dia).
  - Sequência (grade dos últimos 7 dias), data da Home e tipo de refeição sugerido: usam a data e a hora do celular.
  - `consumedAt` é enviado em UTC (`new Date().toISOString()`).
- Risco: se o servidor definir "hoje" em outro fuso, a virada do dia pode divergir do celular.

---

## 7) Fluxo de refeição

- **O hub acumula vários itens: confirmado.** Há um teste de navegação real (`MealsFlow.test.tsx`) que monta 4 alimentos diferentes, entrando pela Refeições e pelo botão da Home, e confere que o rascunho sobrevive à troca de aba. Alimento repetido pergunta "Somar à quantidade atual" ou "Substituir".
- **Nome e tipo:** o tipo (obrigatório) e o nome do prato (opcional, até 60 caracteres) são enviados separados no app. No modo real, `src/api/mealName.ts` junta os dois em `name` (`"Almoço - Almoço de segunda"` ou só `"Almoço"`) e, na volta, reconhece o tipo pelo prefixo exato de um dos 4 rótulos fixos; o que não bater vira nome livre. No mock não há codificação.
- **Limites usados na validação**

| Campo | Limite | Onde |
|---|---|---|
| Quantidade de alimento | maior que 0 e até 5000 g | `utils/nutrition.ts` |
| Nome da refeição | até 60 caracteres | `MealBuilderScreen.tsx` |
| Nome do alimento (manual) | até 80 caracteres | `validation/food.ts` |
| Marca (manual) | até 60 caracteres | `validation/food.ts` |
| Calorias (manual) | 0 a 900 por 100 g; soma dos macros até 100 g | `validation/food.ts` |
| Nome de exibição | até 80 caracteres | `validation/onboarding.ts` |
| Altura | 80 a 250 cm | `validation/onboarding.ts` |
| Peso / peso-alvo | 25 a 400 kg | `validation/onboarding.ts` |
| Idade | 18 a 120 anos | `validation/onboarding.ts` |
| Prazo (data-meta) | futura; peso-alvo e prazo juntos ou ambos vazios | `validation/onboarding.ts` |
| Restrições alimentares | até 1000 caracteres | `validation/onboarding.ts` |
| Senha (login) | 8 a 128 caracteres | `validation/auth.ts` |

---

## 8) Sexo e TMB

- O campo de sexo tem **3 opções**: Feminino, Masculino e Prefiro não informar. O texto não usa mais "biológico" e continua obrigatório.
- Valores no app: `FEMALE`, `MALE`, `PREFER_NOT_TO_SAY`. Para "Prefiro não informar", **o valor enviado à API é `PREFER_NOT_TO_SAY`**, no campo `biologicalSex` (o nome do campo da API foi mantido). O mapeamento está só em `src/api/sexMapping.ts`.
- O backend real aceitar esse terceiro valor: **não confirmado**.
- Cálculo local de TMB/TDEE/meta: **existe**, em `src/utils/energy.ts` (Mifflin-St Jeor; constantes +5, -161 e -78; fatores de atividade 1,2 a 1,9; meta = TDEE, com -10% só para emagrecimento). É usado **apenas pelo mock** (`mocks/mockProfile.ts`). Com o backend real, o app usa `nutrition` devolvido por `GET /v1/users/me`. A constante -78 é uma aproximação de engenharia que precisa de validação da Nutrição.

---

## E) Como rodar agora

```bash
pnpm install              # ou npm install
npx expo start -c         # limpa o cache e inicia
npm run type-check
npm run lint
npm test
```

- **Tudo em mock (padrão do `.env` local atual):** `EXPO_PUBLIC_USE_MOCK=true` e `EXPO_PUBLIC_USE_AUTH_MOCK=true`. Qualquer usuário e senha entram (por exemplo `anderson`).
- **Autenticação real, resto em mock:** `USE_MOCK=true`, `USE_AUTH_MOCK=false` e `EXPO_PUBLIC_API_URL` preenchida (sem `/v1` no fim).
- **Tudo real:** `USE_MOCK=false` e `EXPO_PUBLIC_API_URL` preenchida. Hoje isso **não funciona de ponta a ponta** (ver G).
- Depois de mudar o `.env`, reinicie com `npx expo start -c`. No celular, use o Expo Go na mesma versão do SDK 58.
- Para ver Grupo como tela real, deixe `EXPO_PUBLIC_MAINTENANCE_TABS=` (vazio); com a variável ausente, vale `group`.

---

## F) Qualidade

| Verificação | Resultado |
|---|---|
| `npm run type-check` | Passou, sem erros |
| `npm run lint` | Passou, sem erros nem avisos |
| `npm test` | Passou: 30 suítes, 166 testes, 0 falhas |

Não foi aberto o app em celular ou emulador neste levantamento.

---

## G) Riscos e pendências

**O que impede ou atrapalha rodar com `USE_MOCK=false`**
1. **Prefixo `/v1` ausente** em foods, meals, progress, gamification e groups (auth e users usam `/v1`). Provável 404 se o backend usar `/v1` em tudo.
2. **Contratos não confirmados**: formato de `FoodItem` (`nutritionPer100g`, `brand`), `MealLog`, `ProgressToday`, `GamificationStats` e grupos foram escritos à mão a partir do documento de arquitetura; nenhum foi validado contra o backend. `generate:types` existe, mas não há `api.d.ts`.
3. **Tipo da refeição** vai dentro de `name` (`"Tipo - Nome"`); depende de o backend aceitar esse texto. Recomendado: campo próprio `mealType`.
4. **Terceiro valor de sexo** (`PREFER_NOT_TO_SAY`) precisa ser aceito pelo backend e pelo banco.
5. **Sem `timezone`**: "hoje" é decidido pelo servidor, sem informar o fuso do usuário.
6. **Sem renovação de token**: a sessão acaba no vencimento do token.
7. **Gamificação e grupos**: sem confirmação de que os endpoints existem. A Home e o Perfil já tratam a falha de cada parte separadamente.
8. **Modo híbrido** (auth real e resto mock) mistura números reais e de mock, como descrito na seção D.
9. **`brand` no cadastro manual** pode ser recusado pelo backend se ele não aceitar campos extras (não confirmado).
10. `EXPO_PUBLIC_API_URL` ausente com mock desligado faz o app **lançar erro ao iniciar**.

**Outras pendências**
- Placeholders: Esqueci a senha, Grupos, Perfil do grupo, Ranking completo e Histórico (5 telas). Login com Google é só um botão visual.
- TODOs no código: sino de notificações da Home (sem rota), e as 4 telas de grupo/histórico. Nenhum FIXME.
- Fonte Plus Jakarta Sans não carregada (`Font.loadAsync` vazio e `assets/fonts/` sem arquivos): o app usa a fonte do sistema.
- Dependências sem uso no código: `victory-native`, `expo-notifications`, `@tanstack/query-async-storage-persister`, `openapi-typescript` (só no script). `expo-camera` e `expo-sqlite` aparecem só como plugin no `app.json` (a câmera também pede permissão de câmera e microfone); a fila offline usa `AsyncStorage`, não SQLite.
- Husky: `prepare` roda `husky install`, mas não há hook em `.husky/` (só a pasta interna), então o `lint-staged` configurado não é executado antes do commit.
- Dados fixos que deveriam virar configuração: tempo limite de 10 s e latência do mock (400 ms) em código; meta de objetivo (-10%) no mock; `mockMealLogs` e `mockUserProfile.nutrition` ficaram como resquício (o primeiro só alimenta `getMealsByDateRange`).
- Código sem uso: `ThemeToggleIcon` (ícone), funções de API sem tela (`getMe`, `getFoodByBarcode`, `getMealsByDateRange`, `joinGroup`).
- `README.md` está desatualizado (ainda cita "Home nutricional" com TMB e TDEE e não descreve `EXPO_PUBLIC_MAINTENANCE_TABS`).
- Regra de idade (18 a 120 anos) e constante -78 do TMB aguardam confirmação do grupo de Nutrição.
- `feature/chat-grupo` existe no GitHub e não foi avaliada.
