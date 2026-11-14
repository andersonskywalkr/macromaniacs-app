# Integração com o backend

Este caminho foi preservado para não quebrar links antigos. O contrato foi
revalidado contra o Swagger, o código dos dois repositórios e PostgreSQL real.

- [Contrato definitivo frontend ↔ backend](integration/frontend-backend-contract.md)
- [Execução local do full stack](integration/local-full-stack.md)

O modo integrado usa `EXPO_PUBLIC_USE_MOCK=false` e
`EXPO_PUBLIC_USE_AUTH_MOCK=false`. Metas nutricionais são canônicas no backend,
listas usam paginação, e criações sensíveis preservam `Idempotency-Key`.
