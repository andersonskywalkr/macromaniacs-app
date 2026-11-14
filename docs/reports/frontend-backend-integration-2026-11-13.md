# Relatório de integração frontend + backend — 13/11/2026

## Escopo e bases

- Frontend oficial: `andersonskywalkr/macromaniacs-app`, base `master`
  (`71b5c94cf02af86e52911b36935b24af073f93e3`).
- Backend oficial: `NickyyLotusS/macromaniacs-backend`, base `main`
  (`3887910aea3d3ea7bcabe1ebf519b395b8561ee0`).
- Nenhuma branch principal foi mesclada e nenhum ambiente externo foi
  implantado.

## Entrega frontend

- Idempotência obrigatória e fila offline por usuário, sem apagar operações de
  resultado incerto.
- Edição/exclusão de refeições e paginação de alimentos, refeições e feed.
- Missões, conquistas, loja, saldo, compra, inventário e equipamento reais.
- Criação/saída de grupos e reações no chat/feed real; remoção da aba fictícia
  de desafios sem endpoint.
- Limpeza de cache/rascunho na troca de sessão e distinção entre cancelamento e
  erro de rede.
- Remoção do cálculo nutricional local divergente; backend é a fonte canônica.
- Tipos OpenAPI gerados do `/docs-json` real e perfis EAS sem URL provisória.
- Atualizações transitivas eliminam vulnerabilidades críticas/altas conhecidas
  sem sair das linhas compatíveis do Expo/React Navigation.

## Evidências

| Verificação | Resultado |
|---|---|
| `pnpm run lint` | passou |
| `pnpm run type-check` | passou |
| `pnpm test` | 58 suítes, 390 testes, todos passaram |
| `pnpm dlx expo-doctor` | 20/20 checks |
| `pnpm exec expo install --check` | dependências compatíveis |
| `pnpm audit --prod` | 0 crítica, 0 alta; 2 moderadas e 2 baixas transitivas em ferramentas React Native/Expo |
| Backend HTTP + PostgreSQL 15 | 10 testes de integração passaram |

Os avisos restantes do audit são `fast-xml-parser`, `minimatch` e `deepmerge`
em ferramentas transitivas do React Native/Expo. As correções publicadas de
duas delas exigem troca de major; forçá-las por override quebraria o contrato do
toolchain. Devem ser absorvidas por uma atualização compatível do Expo.

## Limites que não foram mascarados

Reset de senha, Google, notificações, captura de código/foto, desafios de grupo,
WebSocket dedicado e URL pública de produção continuam sem contrato concluído.
O modo real informa/omite esses recursos em vez de simular sucesso.

Contrato e execução: `docs/integration/frontend-backend-contract.md` e
`docs/integration/local-full-stack.md`.
