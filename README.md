# Sistema de Inventarios Web

Aplicación full-stack para gestión de inventario con trazabilidad GS1, ventas, clientes e informes.

## Stack

- **Next.js 16** + TypeScript + Tailwind CSS
- **Prisma** + PostgreSQL (Neon en producción)
- **Auth** JWT con roles: Admin, Vendedor, Almacén

## Diseño Figma

Archivo de diseño: [Sistema de Inventarios en Figma](https://www.figma.com/design/34MKJFXROWFYTzCamlMmEE)

## Inicio rápido (local)

### Opción A — PostgreSQL local con Docker (gratis)

```bash
docker compose up -d
```

Crear `.env`:

```env
DATABASE_URL="postgresql://inventarios:inventarios@localhost:5432/inventarios"
DIRECT_URL="postgresql://inventarios:inventarios@localhost:5432/inventarios"
AUTH_SECRET="dev-secret-change-in-production-min-32-chars!!"
CURRENCY_SYMBOL="$"
CURRENCY_CODE="USD"
```

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Opción B — Neon (misma BD que producción)

1. Crear proyecto gratis en [neon.tech](https://neon.tech)
2. Copiar **direct** connection string a `.env` (ver `.env.example`)
3. En local, `DATABASE_URL` y `DIRECT_URL` deben ser la URL **direct** (sin `-pooler`)
4. En Vercel, `DATABASE_URL` debe ser la URL **pooled** (con `-pooler`)
5. Ejecutar `npm run db:setup` y `npm run dev`

> **Tip:** Si ves `prisma:error ... Connection Closed` en la terminal con el dev server, estás usando el pooler en local. Cambia a la URL direct.

### Solución de problemas (local)

| Problema | Causa | Solución |
|----------|-------|----------|
| `Connection Closed` repetido | URL pooled en `npm run dev` | Usar URL **direct** en `DATABASE_URL` |
| `auditLog.create` undefined | Cliente Prisma desactualizado | Parar dev → `npx prisma generate` → `npm run dev` |
| `EPERM` en prisma generate | Dev server bloquea el DLL | Cerrar `npm run dev` antes de generar |

Guía de operación para usuarios finales: **[MANUAL.md](MANUAL.md)**

### Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin Alpha | alpha@inventarios.local | alpha123 |
| Admin Beta | beta@inventarios.local | beta123 |
| Admin Gama | gama@inventarios.local | gama123 |
| Almacén | almacen@inventarios.local | almacen123 |
| Vendedor | vendedor@inventarios.local | vendedor123 |

## Deploy en la nube

Guía completa paso a paso: **[DEPLOY.md](DEPLOY.md)**

Scripts de ayuda:
- `scripts/push-github.ps1` — push a GitHub
- `scripts/vercel-env-checklist.ps1` — checklist de variables Vercel

## Deploy gratis (Vercel + Neon) — resumen

```mermaid
flowchart LR
  User[Usuario] --> Vercel[Vercel Hobby free]
  Vercel --> Neon[Neon PostgreSQL free]
```

### 1. Base de datos (Neon)

1. Registrarse en [neon.tech](https://neon.tech) (plan free)
2. Crear proyecto y copiar:
   - **Pooled URL** → variable `DATABASE_URL` en Vercel
   - **Direct URL** → solo para migraciones desde tu PC (`DIRECT_URL` en `.env` local)

Desde tu PC (una sola vez):

```bash
npm run db:push
npm run db:seed
```

### 2. Hosting (Vercel)

1. Subir el repo a **GitHub**
2. [vercel.com](https://vercel.com) → **Add New Project** → importar repo
3. Variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL **pooled** de Neon |
| `DIRECT_URL` | URL **direct** de Neon (opcional en runtime, útil en build) |
| `AUTH_SECRET` | String aleatorio de 32+ caracteres |
| `CURRENCY_SYMBOL` | `$` |
| `CURRENCY_CODE` | `USD` o `MXN` |

4. Deploy — Vercel detecta Next.js automáticamente

### 3. Post-deploy

- App en producción: **https://sistema-inventarios-seven.vercel.app**
- Probar login en `/login`
- **Cambiar contraseñas demo** antes de uso real

### Límites capa free

| Servicio | Free tier |
|----------|-----------|
| Vercel Hobby | Suficiente para uso pequeño/mediano |
| Neon | 512 MB; cold start ~1-3 s tras inactividad |

## Módulos

- **Productos** — SKU, GTIN (AI 01), marca, categoría, precios
- **Lotes** — Lote (AI 10), serie (AI 21), fechas GS1, stock por ubicación
- **Clientes** — CRUD con ID fiscal e historial
- **Ventas (POS)** — Descuento FIFO por lote, anulación con reversión de stock
- **Informes** — Ventas, utilidades por rango de fechas, export CSV
- **Dashboard** — KPIs, alertas stock bajo y vencimientos

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build producción
- `npm run db:push` — sincronizar esquema BD
- `npm run db:seed` — datos demo
- `npm run db:setup` — push + seed en un comando
- `npm run verify:users` — comprobar usuarios demo alpha/beta/gama
