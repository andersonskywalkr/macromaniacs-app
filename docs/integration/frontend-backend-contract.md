# Contrato definitivo frontend ↔ backend

Validado em 13/11/2026 entre:

- frontend `andersonskywalkr/macromaniacs-app` (`master`);
- backend `NickyyLotusS/macromaniacs-backend` (`main`).

Este documento descreve o modo real do aplicativo Expo. Com
`EXPO_PUBLIC_USE_MOCK=false` e `EXPO_PUBLIC_USE_AUTH_MOCK=false`, nenhum fluxo
abaixo usa dados simulados.

## Convenções globais

| Tema | Contrato |
|---|---|
| Base URL | `EXPO_PUBLIC_API_URL` sem `/v1`; o cliente acrescenta a versão. |
| Autenticação | `Authorization: Bearer <accessToken>`; token somente no `expo-secure-store`. |
| Idempotência | `Idempotency-Key` é obrigatório ao criar refeição e comprar recompensa. A mesma operação preserva a mesma chave em todos os retries. |
| Datas | ISO 8601 em trânsito; datas alimentares usam o fuso IANA do perfil. |
| Paginação | `items` + `meta.page`, `meta.limit`, `meta.totalItems` e `meta.totalPages`. O cliente tolera metadados ausentes por compatibilidade, mas percorre as páginas informadas. |
| Erro | `{ statusCode, code/error, message, timestamp, path, correlationId? }`; `message` pode ser texto ou lista. |
| Cancelamento | Requisição cancelada vira `REQUEST_CANCELLED`, não erro de rede. |
| Fonte nutricional | TMB, TDEE e meta calórica vêm somente do backend. `NOT_INFORMED` pode produzir `nutrition: null`; o app não inventa uma meta. |

## Matriz de fluxos

| Área/tela | Operações reais | Comportamento do app |
|---|---|---|
| Cadastro e login | `POST /v1/auth/register`, `POST /v1/auth/login` | Cadastro trata 400/409; login persiste JWT e restaura sessão. |
| Sessão | `GET /v1/auth/me` | 401 limpa token, cache e rascunho local. Logout é local porque não há endpoint de revogação. |
| Onboarding/perfil | `GET/PATCH /v1/users/me` | Navegação usa `onboardingCompleted`; valores nutricionais derivados não são enviados pelo cliente. |
| Alimentos | `GET /v1/foods`, `GET /v1/foods/:id`, `GET /v1/foods/barcode/:barcode`, `POST /v1/foods/manual` | Sugestões usam `external=false`; busca completa pagina e pode consultar provedores. |
| Refeições | `POST /v1/meals/manual`, `GET/PATCH/DELETE /v1/meals/:id`, `GET /v1/meals` | Criação, histórico paginado, edição de quantidades e exclusão lógica. O backend recalcula totais. |
| Fila offline | Mesmo `POST /v1/meals/manual` | Fila é isolada por `userId`, persiste a chave idempotente, serializa flushes e só remove após resposta confirmada. Erros 400/403/404 ficam visíveis e não entram em loop. |
| Progresso | `GET /v1/progress/daily`, `GET /v1/progress/history` | Home e histórico exibem snapshot canônico e meta do perfil/planejamento calculada no servidor. |
| Gamificação | `GET /v1/gamification/summary`, `/achievements`, `/missions` | Pontos, streak, conquistas e missões são lidos do ledger/outbox canônico. |
| Recompensas | `GET /v1/rewards/catalog`, `/balance`, `/inventory`; `POST /purchases/:itemId`; `PUT /inventory/:itemId/equip` | Loja, saldo, inventário, compra idempotente e equipamento. |
| Grupos | `GET/POST /v1/groups`, `POST /v1/groups/join`, `DELETE /v1/groups/:id/members/me` | Lista, criação privada, entrada por convite e saída. Administrador recebe 409 até transferir a função. |
| Ranking | `GET /v1/groups/:id/ranking` | Posição e pontos vêm do backend; iniciais são apenas apresentação local. |
| Chat/feed | `GET/POST /v1/groups/:id/feed`, `PUT/DELETE .../reaction` | O “chat” é deliberadamente o feed textual do grupo, com paginação, atualização a cada 15 s, envio otimista, retry e reação `FIRE`. |

## Estados HTTP esperados

| Status | Tratamento |
|---|---|
| 200/201/204 | Atualiza ou invalida os caches relacionados. |
| 400 | Exibe validação; item offline fica retido para correção, sem retry automático. |
| 401 | Encerra a sessão e remove dados em memória do usuário anterior. |
| 403 | Exibe falta de permissão; nenhum estado otimista é confirmado. |
| 404 | Exibe recurso inexistente. Em progresso diário vazio, o contrato legado é convertido para consumo zero. |
| 409 | Exibe conflito (conta duplicada, administrador tentando sair, saldo/inventário ou chave reutilizada em outra operação). |
| 429/5xx/rede | Mantém operação idempotente pendente; retry posterior usa exatamente a mesma chave. |

## Limites intencionais

- Recuperação de senha, login Google e notificações não possuem contrato no
  backend atual; a interface não simula sucesso no modo real.
- A câmera ainda não cria foto de refeição nem lê código de barras. Consulta por
  código existe na API, mas falta a captura na interface.
- O backend tem tabela legada de `chat_messages`, porém não expõe endpoint. O
  aplicativo usa o feed suportado; não há polling sobre rota inventada.
- Desafios/metas de grupo não têm endpoint. A antiga aba estática foi removida.
- Upload de arquivos e URL pública de produção permanecem decisões de deploy;
  esta integração não realizou deploy.

## Tipos e provas

- `src/api/types/api.d.ts` é gerado do Swagger real com `pnpm run generate:types`
  (`SWAGGER_URL` é opcional; padrão `http://localhost:3000/docs-json`).
- Wrappers/adaptadores reais: `src/api/realMode.test.ts`.
- Fila/idempotência: `src/offline/outbox.test.ts` e `src/offline/sync.test.ts`.
- A prova HTTP + PostgreSQL está em
  `tests/integration/database.spec.ts` no backend.

Veja também [execução local](local-full-stack.md).
