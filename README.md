# Proformas P&C Casa

Aplicacion para crear proformas (cotizaciones) con PDF pixel-perfect usando
Next.js App Router, Prisma y Puppeteer en Vercel.

## Arquitectura (local + Vercel)
- Frontend: Next.js App Router + React + TypeScript + TailwindCSS + CSS print.
- Backend: Route Handlers en runtime Node.js (API REST).
- Auth: NextAuth Credentials con Prisma (session JWT).
- DB: PostgreSQL local para desarrollo, portable a remoto via `DATABASE_URL`.
- PDF: `puppeteer-core` + `@sparticuz/chromium-min` desde `/api/proformas/[id]/pdf`.
- Print: `/proformas/[id]/print` sirve el HTML exacto para la generacion PDF.

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

## Scripts
- `npm run dev`
- `npm run prisma:migrate`
- `npm run prisma:seed`

## Prisma (PostgreSQL local)
1. Crear DB local (ej: `proformas_pandcasa`)
2. Copiar `.env.example` -> `.env` y actualizar `DATABASE_URL`
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

### Puppeteer en Vercel
- Asegura que `NEXT_PUBLIC_SITE_URL` este configurado en Vercel.
- Si falla localmente, define `PUPPETEER_EXECUTABLE_PATH` con la ruta de Chrome.
- La ruta PDF espera fuentes y recursos usando `networkidle0`.
