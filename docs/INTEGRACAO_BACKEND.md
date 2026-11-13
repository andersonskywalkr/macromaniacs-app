# Integração do app com o backend real (NestJS)

Este documento descreve como o app conversa com o backend real e o que foi
adaptado **no app** (o backend não foi alterado). O modo mock segue igual: a troca
é a flag `EXPO_PUBLIC_USE_MOCK` (e `EXPO_PUBLIC_USE_AUTH_MOCK` para login, cadastro e perfil).

> Origem do contrato: extraído do código do backend. O Swagger não estava acessível
> por GET público (`/docs-json`, `/api-json`, `/swagger.json` e `/docs` responderam 404),
> então ele **não** foi usado para conferir os formatos. Se o Swagger divergir da tabela
> abaixo, vale o Swagger e as conversões (em `src/api/adapters/`) devem ser ajustadas.

## 1. Como ligar

| Variável | Valor para o backend real |
|---|---|
| `EXPO_PUBLIC_USE_MOCK` | `false` |
| `EXPO_PUBLIC_USE_AUTH_MOCK` | `false` |
| `EXPO_PUBLIC_API_URL` | URL do backend **sem `/v1` no fim** |

Combinações: ver o `.env.example`. Voltar ao mock: `USE_MOCK=true` e `USE_AUTH_MOCK=true`,
e reiniciar com `npx expo start -c`.

## 2. Regras gerais

- Todas as rotas têm `/v1`. Auth e users escrevem o `/v1` na mão (como antes); as demais usam `v1()` de `src/api/paths.ts`.
- O formato do backend **não vaza** para as telas: cada função de `src/api` converte a resposta para os tipos de `src/api/types/domain.ts` (e o contrário no envio). As conversões são funções puras em `src/api/adapters/` (com testes).
- Listas chegam como `{ items, meta }`. O app lê só `items`. **Limitação:** a forma do `meta` não foi confirmada, então não há paginação; o app pede uma página grande (`limit`: 20 na busca de alimentos, 8 nas sugestões da busca, 50 em refeições e no chat do grupo, 100 no histórico de progresso).
- Erros: `{ statusCode, error, message (texto ou lista), timestamp, path, correlationId }`. `ApiError` junta uma lista de mensagens com `; `.
- Números decimais podem chegar como texto; os adaptadores convertem (`toNumber`).

## 3. Contrato usado, rota por rota

| Função do app | Método e rota | Envia | Recebe | Conversão no app |
|---|---|---|---|---|
| `login` | POST `/v1/auth/login` | `identifier`, `password` | `accessToken` | (sem mudança) |
| `register` | POST `/v1/auth/register` | `email`, `username`, `password`, `termsAccepted` | usuário | (sem mudança) |
| `getMe` | GET `/v1/auth/me` | | usuário da sessão | (sem mudança; usado ao restaurar a sessão) |
| `getMyProfile` | GET `/v1/users/me` | | perfil com `nutrition` (pode ser `null`) e `timezone` | `NOT_INFORMED` vira `PREFER_NOT_TO_SAY` |
| `updateMyProfile` | PATCH `/v1/users/me` | campos do perfil + `timezone` | perfil | `PREFER_NOT_TO_SAY` vira `NOT_INFORMED` |
| `searchFoods` | GET `/v1/foods?q=&limit=` (q de 2 a 100 letras) | | `{ items: Food[], meta }` | `Food` vira `FoodItem` (`carbsPer100g` vira `carbohydrates`; `brand = null`; `source` preservado) |
| `suggestFoods` (sugestões ao digitar) | GET `/v1/foods?q=&limit=8&external=false` | | `{ items: Food[], meta }` | só do banco do backend (`external=false`, para não gastar o limite de 10 consultas por minuto do Open Food Facts); a tela espera 300 ms sem digitar, exige 2 letras e reordena o resultado no app. A busca completa **não** manda `external` (o padrão do backend consulta as fontes externas) |
| `getFoodByBarcode` | GET `/v1/foods/barcode/:barcode` | | `Food` (404 = não existe) | 404 vira `null` |
| `createManualFood` | POST `/v1/foods/manual` | campos soltos: `name` (até 255), `barcode` (8, 12, 13 ou 14 dígitos ou `null`), `caloriesPer100g`, `proteinPer100g`, `carbsPer100g`, `fatPer100g`, `fiberPer100g` | `Food` | marca juntada ao nome ("Nome (Marca)", até 255); números arredondados a 2 casas; sem `brand` nem objeto aninhado |
| `createMeal` | POST `/v1/meals/manual` | `name` (1 a 100), `consumedAt` (ISO UTC), `photoUrl?`, `items` (1 a 50) com `foodId` e `amountGrams` (2 casas) | `Meal` | `name` = `encodeMealName` ("Tipo - Nome"); **sem** `plannedMealId` nem extras; resposta passa por `decodeMealName` |
| `getMealsToday` | GET `/v1/meals?from=HOJE&to=HOJE&limit=50` | | `{ items: Meal[], meta }` | `HOJE` = data no fuso do usuário; `Meal` vira `MealLog` (sem `userId`; `foodId`/`foodName` nulos viram `''`/"Alimento") |
| `getMealsByDateRange` | GET `/v1/meals?from=&to=` | | idem | idem |
| `getProgressToday` | GET `/v1/progress/daily?date=AAAA-MM-DD` | | valores soltos (`calories`, `protein`, `carbs`, `fat`, `fiber`, `mealCount`, `targetCalories`) | vira `ProgressToday`; meta = `targetCalories` ou, se `null`, a meta calculada pelo app; metas de macros = divisão 50/25/25; **404 = consumo zero** |
| `getProgressHistory` | GET `/v1/progress/history?from=&to=&limit=100` (datas AAAA-MM-DD no fuso do usuário) | | `{ items, meta }`, cada item no mesmo formato de `/progress/daily` com `date` | vira `DailyProgressEntry`; dia sem meta no backend usa a meta do perfil. Alimenta a tela Histórico (meta batida = 90% a 110%) |
| `getGamificationStats` | GET `/v1/gamification/summary` | | `currentStreak`, `bestStreak`, `totalPoints` | `totalPoints` vira `points` |
| `getMyGroups` | GET `/v1/groups` | | lista simples de grupos | sem `memberCount` (campo opcional, não inventado) |
| `getGroupRanking` | GET `/v1/groups/:id/ranking` | | lista de `{ position, userId, username, displayName, points }` | iniciais calculadas no app |
| `joinGroup` | POST `/v1/groups/join` | `inviteCode` (8 caracteres, maiúsculas) | grupo | código sempre em maiúsculas |
| `getGroupFeed` | GET `/v1/groups/:id/feed?limit=50` | | `{ items, meta }` | cada item é uma mensagem do chat do grupo (aba Chat); atualiza a cada 15 s com a aba aberta |
| `sendGroupMessage` | POST `/v1/groups/:id/feed` | `content` (1 a 2000 caracteres) | item do feed | aparece na hora (otimista); se falhar, fica "Não enviada" com "Tentar de novo" |

Telas sem rota no backend: **Esqueci a senha**. No modo mock é uma demonstração (com aviso visível); no modo real o app **não chama nenhuma rota** e avisa que o recurso ainda não está disponível.
## 4. Conversões e regras do app

- **Sexo:** o backend só aceita `FEMALE`, `MALE` e `NOT_INFORMED`. O app usa `PREFER_NOT_TO_SAY` por dentro; o mapeamento está só em `src/api/sexMapping.ts`.
- **Objetivo:** o backend tem 6 valores. `RECOMPOSITION` foi adicionado ao tipo e ganhou o rótulo "Recomposição corporal", mas **não** é opção do Onboarding (só aparece, já selecionado, no Editar perfil de quem tem esse objetivo).
- **Fuso horário:** o app envia `timezone` (fuso do aparelho; `America/Sao_Paulo` se o aparelho não informar) no PATCH do Onboarding e do Editar perfil. O "hoje" do app (consulta do dia, data da Home, grade de sequência) vem de `src/utils/today.ts`, usando o `timezone` do perfil e, na falta dele, o do aparelho. `consumedAt` segue em ISO UTC.
- **Tipo e nome da refeição:** o backend só tem `name`; tipo e nome viajam juntos em `src/api/mealName.ts` ("Tipo - Nome", até 100 caracteres).
- **Meta calórica quando o backend não calcula** (`nutrition: null`, caso de "Prefiro não informar"): `src/utils/nutritionFallback.ts` calcula TMB, TDEE e meta localmente com `src/utils/energy.ts` (Mifflin-St Jeor; constante -78 para quem não informa). **Quando o backend traz `nutrition`, vale sempre o do backend.** A meta usa a regra do backend: emagrecimento = TDEE -10% (déficit máximo de 500 kcal), ganho de massa = TDEE +10% (superávit máximo de 300 kcal), demais objetivos = TDEE; nunca abaixo do TMB nem acima de TDEE + 300. O mesmo cálculo alimenta o mock.
- **Limites de validação** (iguais aos do backend): altura 80 a 250 cm; peso e peso-alvo 25 a 400 kg; nome de exibição até 100; usuário de 3 a 50 caracteres (o app já grava em minúsculas, `[a-z0-9_]`); restrições alimentares até 1000; idade de 18 a 120; busca de alimento de 2 a 100 letras; refeição com 1 a 50 itens. O app é mais estrito em quantidade (5000 g contra 9999,99 g) e no nome da refeição (60 contra 100 caracteres).
- **Busca:** com menos de 2 letras a tela avisa e não chama a API (no mock também). As sugestões (modo real) vêm só do que já está no banco do backend; a busca completa, ao tocar em "Buscar", também consulta fontes externas. O histórico de buscas (até 10) fica só no aparelho, por usuário (AsyncStorage).
- **Versão da API:** `EXPO_PUBLIC_API_URL` não leva `/v1`; ele é acrescentado a toda rota (`v1()` em `src/api/paths.ts`; auth e users o escrevem na mão). As variáveis `EXPO_PUBLIC_*` são gravadas no app na hora do build: trocar a URL exige gerar um novo APK.
- **Fila offline:** a refeição guardada usa o formato novo de `createMeal` (sem `plannedMealId`; entradas antigas com esse campo são aceitas e o campo é descartado). Depois do reenvio, `sync.ts` atualiza progresso, gamificação e a lista de refeições do dia.

## 5. O que o backend NÃO fornece (e como o app lida)

| Falta no backend | Como o app lida hoje |
|---|---|
| Marca do alimento | Junta ao nome ao cadastrar; na leitura a marca vem como `null` |
| Tipo da refeição como campo | Vai dentro de `name` ("Tipo - Nome") |
| `memberCount` do grupo | Campo opcional, não exibido nem inventado |
| Sequência por membro e iniciais no ranking | Iniciais calculadas a partir do nome |
| Metas de macros por dia | Divisão 50/25/25 da meta de calorias |
| TMB, TDEE e meta para `NOT_INFORMED` | Fallback local (`nutritionFallback`, constante -78) |
| `userId` na refeição | Campo opcional no tipo |
| Ajuste da meta pelo prazo e peso-alvo | Não reproduzido no cálculo local (limitação) |

## 6. Provisório e sugestões ao Back (sem urgência)

- A constante -78 (TMB para "Prefiro não informar") e a regra de meta local aguardam validação da Nutrição. O ideal é o backend calcular também para `NOT_INFORMED`.
- Campo próprio `mealType` na refeição (API e banco), para tirar o tipo de dentro do `name`. Quando existir, trocar só `encodeMealName` e `decodeMealName`.
- Devolver `memberCount` nos grupos e metas de macros no progresso do dia.
- Documentar o formato do `meta` das listas (para o app paginar) e publicar o Swagger.
- `getMealsByDateRange` e a sequência calculada no app dependem de `from`/`to` (AAAA-MM-DD); confirmar o limite de `limit`.
- A lista do dia só é buscada de novo ao salvar uma refeição ou reabrir a tela; não há atualização automática na virada da meia-noite.
