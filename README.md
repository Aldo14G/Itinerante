# Librería Itinerante y Más — Static Site + Backend

## Frontend (existente)

Static Firebase Hosting site. Ver `AGENTS.md` para estructura y convenciones.

Comandos:
- `npm run preview` — sirve el sitio en http://127.0.0.1:8080/
- `firebase emulators:start --only hosting` — sirve con behavior Firebase real
- `firebase deploy --only hosting` — deploy prod
- `npm test` — corre todo el harness (site + rls + schema + lib)

## Backend (Supabase local)

### Prerequisitos

- **Docker Desktop** corriendo (Supabase local usa contenedores).
- **Node.js ≥ 20**.
- **Supabase CLI**:
  - Windows: `winget install Microsoft.WSL` (si no está) y luego descargar el binario oficial de https://github.com/supabase/cli/releases al `~/bin/supabase/` y agregar al PATH del user. (Supabase CLI no está en winget al momento de escribir esto).
  - macOS/Linux: `brew install supabase/tap/supabase`

### Bootstrap primera vez

```bash
supabase start          # arranca Postgres + Auth + Storage + Studio (~10 min primer arranque, descarga imágenes Docker)
supabase db reset       # aplica migrations + seed (10 libros)
```

Ver URLs y keys locales:
```bash
supabase status
```

Studio en http://127.0.0.1:54323 para explorar tablas visualmente.

### Correr tests con backend

Las suites `tests/rls.test.mjs` y `tests/schema.test.mjs` requieren Supabase local corriendo. Si no está, se saltan con warning (no rompen el flow).

Env vars requeridas (una sola vez por terminal):

```powershell
# PowerShell
$env:SUPABASE_LOCAL_ANON_KEY = "<anon key de supabase status>"
$env:SUPABASE_LOCAL_SERVICE_KEY = "<service_role key de supabase status>"
```

```bash
# bash/zsh
export SUPABASE_LOCAL_ANON_KEY="..."
export SUPABASE_LOCAL_SERVICE_KEY="..."
```

Correr:
```bash
npm test
```

### Detener stack local

```bash
supabase stop
```

## Runbooks operativos

Ver `CONTEXT.md` sección Operations para runbooks de:
- Rotación de Supabase anon key
- Rollback de consumidor (BACKEND_FLAGS)
