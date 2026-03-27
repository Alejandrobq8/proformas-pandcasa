# Proformas P&C Casa

Aplicacion para crear proformas (cotizaciones) con PDF pixel-perfect usando
Next.js App Router, Prisma y Puppeteer en Vercel.

## Arquitectura (local + Vercel)
- Frontend: Next.js App Router + React + TypeScript + TailwindCSS + CSS print.
- Backend: Route Handlers en runtime Node.js (API REST).
- Auth: NextAuth Credentials con Prisma (session JWT).
- DB: PostgreSQL local para desarrollo, portable a remoto via `DATABASE_URL` o Supabase.
- PDF: `puppeteer-core` + `@sparticuz/chromium` desde `/api/proformas/[id]/pdf`.
- Print: `/proformas/[id]/print` sirve el HTML exacto para la generacion PDF.

## Estructura del proyecto
- `app/`: rutas de Next.js. Los modulos autenticados viven en `app/(dashboard)` y el acceso publico en `app/(public)`.
- `app/api/`: route handlers de Next.js.
- `features/`: codigo por dominio (`auth`, `clientes`, `menu`, `proformas`, `settings`).
- `shared/`: piezas reutilizables entre dominios (`components` y `lib`).
- `prisma/`: schema, migraciones y seed.

## Variables de entorno
Ver `.env.example`.

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `PDF_TOKEN_SECRET`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`
- `SEED_USER_NAME`

Con la configuracion final en Supabase:
- `DATABASE_URL`: usa la URL pooled de Supavisor para runtime.
- `DIRECT_URL`: usa el session pooler en puerto `5432` para migraciones y seed desde entornos con IPv4.

Variables opcionales de migracion:
- `SOURCE_DATABASE_URL`: fuerza la base origen al migrar datos desde otro Postgres.
- `TARGET_DATABASE_URL`: URL del destino usada por los scripts de restauracion y verificacion.

## Scripts
- `npm run dev`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run db:backup`
- `npm run db:restore -- <ruta-del-backup>`
- `npm run db:verify`

## Prisma
1. Copiar `.env.example` -> `.env`
2. Configurar `DATABASE_URL` y `DIRECT_URL`
3. Ejecutar:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Rutas principales
- UI
  - `/clientes`
  - `/proformas`
  - `/proformas/new`
  - `/proformas/[id]/edit`
  - `/proformas/[id]/print`
- API
  - `POST /api/clientes`
  - `GET /api/clientes`
  - `GET /api/clientes/:id`
  - `PUT /api/clientes/:id`
  - `DELETE /api/clientes/:id`
  - `POST /api/proformas`
  - `GET /api/proformas`
  - `GET /api/proformas/:id`
  - `PUT /api/proformas/:id`
  - `DELETE /api/proformas/:id`
  - `POST /api/proformas/:id/duplicate`
  - `GET /api/proformas/:id/pdf`

## Decisiones clave
- Autocompletado de clientes guarda `clientId` y snapshot
  (`clientNombre`, `clientEmpresa`, `clientCedulaJuridica`). Esto evita que la
  proforma cambie si el cliente se edita luego.
- Numero de proforma: `PF-YYYY-####` unico por usuario con secuencia anual.

## Troubleshooting
### PostgreSQL local
- Verifica que el servicio este activo y la DB exista.
- Confirma que `DATABASE_URL` use el puerto correcto.

### Prisma
- Si falla `migrate`, revisa permisos de usuario en Postgres.
- Usa `npx prisma studio` para inspeccionar datos.
- Con Supabase, deja `DATABASE_URL` apuntando al pooler y `DIRECT_URL` al session pooler.

## Migracion de datos a Supabase
1. Crea el schema en Supabase con `npm run prisma:deploy` usando `DIRECT_URL` apuntando a Supabase.
2. Genera un respaldo del origen con `npm run db:backup`.
3. Importa el respaldo al destino con `TARGET_DATABASE_URL="..." npm run db:restore -- db-backups/<archivo>.json`.
4. Verifica origen vs destino con `TARGET_DATABASE_URL="..." npm run db:verify`.

Notas:
- `db:restore` falla si la base destino no esta vacia.
- Si `DIRECT_URL` apunta temporalmente a Supabase, deja `DATABASE_URL` o `SOURCE_DATABASE_URL` apuntando al origen.
- En operacion normal no ocupas `TARGET_DATABASE_URL`; es solo para scripts de migracion.
- Los backups JSON se guardan en `db-backups/` y estan ignorados por git.

### Puppeteer en Vercel
- Asegura que `NEXT_PUBLIC_SITE_URL` este configurado en Vercel.
- Si falla localmente, define `PUPPETEER_EXECUTABLE_PATH` con la ruta de Chrome.
- La ruta PDF espera fuentes y recursos usando `networkidle0`.
