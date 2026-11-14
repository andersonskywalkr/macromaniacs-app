# Executar o aplicativo integrado localmente

Os comandos assumem os dois repositórios em diretórios irmãos chamados
`backend` e `frontend`. O PostgreSQL abaixo usa `tmpfs`: é descartável e não
compartilha o volume de desenvolvimento.

## 1. Backend

No PowerShell:

```powershell
cd backend
npm ci
$env:POSTGRES_PASSWORD = 'apenas-para-interpolacao-do-compose'
docker compose -f infra/docker/compose.yaml --profile test up -d --wait postgres-test

Copy-Item .env.example .env
# Edite .env e use os valores abaixo para esta instância descartável:
# APP_ENV=development
# APP_PORT=3000
# DATABASE_URL=postgresql://user:password@127.0.0.1:55433/validation
# JWT_SECRET=<segredo local aleatório com 32+ caracteres>
# JWT_EXPIRES_IN=1h

npm run migration:run
npm run seed
npm run start:dev
```

Confirme `http://localhost:3000/health/ready` e abra o Swagger em
`http://localhost:3000/docs`.

## 2. Frontend

Em outro terminal:

```powershell
cd frontend
corepack pnpm install --frozen-lockfile
Copy-Item .env.integration.example .env
corepack pnpm start --clear
```

A URL já configurada no exemplo (`http://10.0.2.2:3000`) serve ao emulador
Android. Para iOS Simulator/Web use `http://localhost:3000`. Em dispositivo
físico use `http://IP_DA_MAQUINA:3000` e permita a porta no firewall local.

Cadastre uma conta nova; o fluxo esperado é cadastro → login → onboarding →
Home. Depois registre uma refeição, confira progresso/pontos, crie ou entre em
um grupo e abra “Conquistas e recompensas” no Perfil.

## 3. Verificações reproduzíveis

Frontend:

```powershell
corepack pnpm test
corepack pnpm run type-check
corepack pnpm run lint
corepack pnpm exec expo-doctor
corepack pnpm exec expo install --check
```

Backend, inclusive PostgreSQL real:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test -- --runInBand
$env:TEST_ADMIN_DATABASE_URL = 'postgresql://user:password@127.0.0.1:55433/validation'
npm run test:integration
```

## 4. Encerrar o banco descartável

```powershell
$env:POSTGRES_PASSWORD = 'apenas-para-interpolacao-do-compose'
docker compose -f infra/docker/compose.yaml --profile test down
```

O `down` remove somente o container/`tmpfs` do perfil de teste. Não use esse
procedimento em um banco que precise ser preservado.

## Builds EAS reais

Os perfis `preview` e `preview-real` leem `EXPO_PUBLIC_API_URL` do ambiente EAS
`preview`; `production` lê do ambiente EAS `production`. Cadastre a URL pública
no EAS antes do build. Nenhuma URL provisória ou segredo é versionado no
repositório, e esta integração não faz deploy automaticamente.
