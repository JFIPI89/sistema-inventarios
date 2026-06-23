# Despliegue gratuito: Vercel + Neon

Guía paso a paso para subir **Sistema de Inventarios Horus** a la nube sin costo.

## Arquitectura

```
Usuario → Vercel (Next.js) → Neon (PostgreSQL)
```

- **Vercel Hobby** — hosting de la app (gratis)
- **Neon Free** — base de datos PostgreSQL (gratis)

No uses Netlify para este proyecto: Next.js con Server Actions + Prisma funciona mejor en Vercel.

---

## 1. Base de datos (Neon)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. **New Project** → elegir región cercana (ej. `us-east-1`)
3. En **Connection details**, copiar:
   - **Pooled connection** → `DATABASE_URL` (host con `-pooler`)
   - **Direct connection** → `DIRECT_URL` (host sin `-pooler`)

4. En tu PC, crear `.env` (copiar desde `.env.example`):

```env
DATABASE_URL="postgresql://...-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://....neon.tech/neondb?sslmode=require"
AUTH_SECRET="genera-un-secreto-aleatorio-de-32-caracteres-minimo"
```

5. Sincronizar esquema y datos demo:

```bash
npm run db:setup
```

---

## 2. GitHub

1. Crear repo vacío en GitHub (sin README ni .gitignore)
2. En la carpeta del proyecto:

```powershell
git init
git add .
git commit -m "Initial commit: Sistema de Inventarios Horus"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sistema-inventarios.git
git push -u origin main
```

**Importante:** `.env` está en `.gitignore` — nunca subas credenciales.

---

## 3. Vercel

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repo de GitHub
3. **Environment Variables** (Production):

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL **pooled** de Neon |
| `DIRECT_URL` | URL **direct** de Neon |
| `AUTH_SECRET` | Secreto nuevo (distinto al de desarrollo) |

Montos siempre en **MXN**; `CURRENCY_CODE` en Vercel es opcional y se ignora.

4. **Deploy** — Vercel detecta Next.js automáticamente (`vercel.json` ya configurado)

### Deploy desde CLI (opcional)

```powershell
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL
npx vercel env add DIRECT_URL
npx vercel env add AUTH_SECRET
npx vercel --prod
```

---

## 4. Post-deploy

1. Abrir **https://sistema-inventarios-seven.vercel.app/login**
2. Probar login: `alpha@inventarios.local` / `alpha123`
3. Verificar dashboard, productos, ventas
4. **Cambiar contraseñas demo** antes de uso real

### URLs en producción

| Recurso | URL |
|---------|-----|
| App | https://sistema-inventarios-seven.vercel.app |
| GitHub | https://github.com/JFIPI89/sistema-inventarios |
| Vercel dashboard | https://vercel.com/juanfcoarmenta89-8094s-projects/sistema-inventarios |

> Conecta GitHub en Vercel (Account → Login Connections) para deploys automáticos en cada push.

---

## Límites free tier

| Servicio | Límite | Nota |
|----------|--------|------|
| Vercel Hobby | Builds y tráfico moderado | Suficiente para equipo pequeño |
| Neon Free | ~512 MB | Cold start 1–3 s tras inactividad |

---

## Desarrollo local (alternativa sin Neon)

```powershell
docker compose up -d
# .env con localhost:5432 (ver README.md)
npm run db:setup
npm run dev
```

Acceso LAN: `http://TU_IP:3000` (celular en misma WiFi).

---

## Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin Alpha | alpha@inventarios.local | alpha123 |
| Admin Beta | beta@inventarios.local | beta123 |
| Admin Gama | gama@inventarios.local | gama123 |
| Almacén | almacen@inventarios.local | almacen123 |
| Vendedor | vendedor@inventarios.local | vendedor123 |
