# 🚀 WorkPlace App

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vue.js-4FC08D?logo=vue.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Build_Tool-Vite-646CFF?logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/State_Management-Pinia-FFD859?logo=pinia&logoColor=black"/>
  <img src="https://img.shields.io/badge/Routing-Vue_Router-4FC08D?logo=vuedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/HTTP_Client-Axios-5A29E4?logo=axios&logoColor=white"/>
  <img src="https://img.shields.io/badge/Charts-Chart.js-FF6384?logo=chartdotjs&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/REST_API-Express-000000?logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/ORM-Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black"/>
  <img src="https://img.shields.io/badge/Validation-Zod-3E67B1?logo=zod&logoColor=white"/>
  <img src="https://img.shields.io/badge/AI_Model-Gemini_3.1_Flash--Lite-4285F4?logo=googlegemini&logoColor=white"/>
  <img src="https://img.shields.io/badge/Authentication-JWT-000000?logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Password_Hashing-bcryptjs-003A70?logo=npm&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Database_Hosting-Neon-00E599?logo=neon&logoColor=black"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Testing-Vitest-6E9F18?logo=vitest&logoColor=white"/>
  <img src="https://img.shields.io/badge/Frontend_Deployment-Vercel-000000?logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/Backend_Deployment-Render-46E3B7?logo=render&logoColor=black"/>
</p>

> Plataforma web para la **gestión y reserva de espacios de coworking**, con panel administrativo y asistente virtual con IA para clientes.

Aplicación full-stack: catálogo de espacios con filtros, pre-reserva y confirmación con facturación básica, roles `ADMIN` / `STAFF` / `CLIENT`, dashboard con métricas y un **chat de IA** que guía a los clientes en la búsqueda y reserva.

## ✨ Features

- 🔐 **Autenticación JWT** en cookie `httpOnly` (registro, login, logout)
- 👥 **Roles y permisos**: `ADMIN`, `STAFF`, `CLIENT` con guardias en frontend y backend
- 🏢 **Catálogo de espacios** con búsqueda, filtros y paginación
- 📅 **Disponibilidad** por fecha y franja horaria
- 📝 **Flujo de reserva** en dos pasos: pre-reserva → confirmación con facturación (nombre, RUC/CI, email, teléfono, dirección)
- ❌ **Cancelación de reservas** y validación anti choques de horario
- 📊 **Panel de administración**: dashboard con métricas, CRUD de usuarios, espacios, recursos y reservas
- 🤖 **Asistente virtual con IA** para clientes, con flujo conversacional de búsqueda y reserva
- 🔄 **API REST** validada con Zod y manejo centralizado de errores
- 🗄️ **Persistencia** en PostgreSQL (Neon) vía Drizzle ORM con soft-delete

## 🚀 Instalación

```bash
git clone https://github.com/Dev-Portfolio-Projects/coworking-web-app.git
cd coworking-web-app
```

**Backend** (API en `http://localhost:3000`):

```bash
cd backend
pnpm install
cp .env.example .env   # configura DATABASE_URL y JWT_SECRET
pnpm run db:push       # crea las tablas
pnpm run db:seed       # datos iniciales
pnpm run dev
```

**Frontend** (app en `http://localhost:5173`):

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm run dev
```

> ¿Usas npm? Reemplaza `pnpm` por `npm`. Verifica el backend: `curl http://localhost:3000/api/health`.

**Seed** crea roles (`ADMIN`/`STAFF`/`CLIENT`), el usuario **`admin@workplace.com` / `admin123`**, 6 recursos y franjas horarias de ejemplo.

## 🔐 Variables de entorno

Cada carpeta usa su propio `.env`. Los prefijos `VITE_` quedan embebidos en el build del frontend.

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/db?sslmode=require
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
```

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Cadena de conexión a PostgreSQL/Neon. |
| `JWT_SECRET` | ✅ (prod) | Firma del JWT. En producción el backend **no inicia** si falta. |
| `PORT` | ❌ | Puerto HTTP (default `3000`; Render lo inyecta). |
| `CORS_ORIGIN` | ✅ | Orígenes permitidos separados por coma. |
| `GEMINI_API_KEY` | ✅ | API key de Gemini (sin ella el chat devuelve 500). |
| `GEMINI_MODEL` | ❌ | Modelo de Gemini (default `gemini-3.1-flash-lite`). |

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | Base URL de la API (en producción: URL de Render). |

## 📡 API

Todas las rutas cuelgan de `/api`. La columna **Auth** indica el rol mínimo requerido.

| Método | Endpoint | Descripción | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Health check | — |
| POST | `/auth/register` `/auth/login` `/auth/logout` | Registro / login / logout | — |
| GET | `/catalog/spaces` | Catálogo con filtros y paginación | — |
| GET | `/catalog/spaces/:id` `/catalog/spaces/:id/availability` | Detalle y disponibilidad | — |
| GET | `/catalog/amenities` | Recursos (amenities) | — |
| GET / PATCH | `/users/profile` | Perfil propio | ✔️ |
| GET | `/users` | Lista de usuarios | ADMIN |
| POST / PATCH / DELETE | `/users` `/users/:id` | CRUD de usuarios | ADMIN |
| POST | `/bookings/pre` | Pre-reserva | ✔️ |
| POST | `/bookings` | Confirma reserva con facturación | ✔️ |
| PATCH | `/bookings/:id/complete` `/bookings/:id/cancel` | Completar / cancelar | ✔️ |
| GET | `/bookings/my` `/bookings/:id` `/bookings/availability/check` | Mis reservas / detalle / verificación | ✔️ |
| GET | `/bookings` | Todas las reservas | ADMIN, STAFF |
| POST / PATCH / DELETE | `/spaces` `/spaces/:id` | CRUD de espacios | ADMIN |
| GET / PUT | `/spaces/:id/availability` | Disponibilidad del espacio | ADMIN |
| GET / POST / PATCH / DELETE | `/amenities` `/amenities/:id` | CRUD de recursos | ADMIN |
| GET | `/dashboard` | Métricas del dashboard | ADMIN |
| POST | `/chat` | Mensaje al asistente de IA | CLIENT |

**Autenticación:** JWT de 7 días en cookie `httpOnly` (`token`), aceptando también `Authorization: Bearer <token>`. En producción (`NODE_ENV=production`) la cookie usa `SameSite=None; Secure` porque frontend y backend están en dominios distintos. Contraseñas con bcrypt.

## 📁 Estructura

```text
coworking-web-app/
├── backend/                    # API Node.js + Express (TypeScript)
│   └── src/
│       ├── application/        #   DTOs (Zod) + casos de uso
│       ├── domain/             #   Entidades, repositorios, servicios de negocio
│       ├── infrastructure/     #   Config, DB (Drizzle + seed), bcrypt, Gemini
│       ├── interfaces/         #   Rutas, controllers, middlewares (auth/roles/errores)
│       └── shared/             #   Errores, respuestas, paginación, tipos
├── frontend/                   # SPA Vue 3 + Vite + Pinia (TypeScript)
│   └── src/
│       ├── components/         #   Modales, nav, chat widget, …
│       ├── composables/        #   useBackendWake, useRealtimeSync, useRetryButton
│       ├── router/             #   Rutas y guardias de autenticación/roles
│       ├── services/           #   Cliente axios + servicios por módulo
│       ├── stores/             #   Stores de Pinia
│       └── views/              #   Páginas (públicas + panel admin)
└── README.md
```

## ☁️ Deployment

| Capa | Plataforma | Configuración clave |
| --- | --- | --- |
| **Frontend** | **Vercel** | Root `frontend` · Build `pnpm build` · Output `dist` · Env `VITE_API_URL` |
| **Backend** | **Render** | Root `backend` · Build `pnpm install && pnpm build` · Start `pnpm start` · Env `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `GEMINI_API_KEY` |
| **Base de datos** | **Neon** | `DATABASE_URL` + `db:push` + `db:seed` |

> ⚠️ **Render no define `NODE_ENV` solo**: configúralo como `production` o la cookie de sesión fallará en Vercel (cross-site). `vercel.json` ya reescribe la SPA a `index.html`.

## 📜 Scripts

| Comando (en `backend/`) | Descripción |
| --- | --- |
| `pnpm run dev` | Dev server con recarga (`tsx watch`) |
| `pnpm start` | Arranque en producción (Render) |
| `pnpm run build` | Compila TypeScript |
| `pnpm test` / `pnpm run test:watch` | Tests (Vitest) |
| `pnpm run db:generate` / `db:push` / `db:migrate` | Migraciones Drizzle |
| `pnpm run db:seed` | Datos iniciales |

| Comando (en `frontend/`) | Descripción |
| --- | --- |
| `pnpm run dev` | Dev server Vite (puerto 5173) |
| `pnpm run build` | `vue-tsc` (type-check) + `vite build` |
| `pnpm run build-only` | Solo `vite build` |
| `pnpm run type-check` | Solo `vue-tsc --build` |
| `pnpm run preview` | Previsualiza el build |

## 🧪 Testing

**47 tests** con **Vitest** (solo backend):

| Archivo | Tests |
| --- | --- |
| `chat.use-case.test.ts` | 22 |
| `booking.service.test.ts` | 11 |
| `create-booking.use-case.test.ts` | 6 |
| `pagination.test.ts` | 4 |
| `gemini.service.test.ts` | 4 |

```bash
cd backend && pnpm test
```

<div align="center">
  Made with ❤️ using Vue.js + Express + PostgreSQL
</div>
