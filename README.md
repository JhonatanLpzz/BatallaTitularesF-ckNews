<div align="center">

# Batalla de Titulares — F\*cks News Noticreo

**Sistema de votación interactiva en tiempo real para shows de comedia en vivo**

[![Bun](https://img.shields.io/badge/runtime-Bun-f9a8d4?logo=bun&logoColor=white)](https://bun.sh)
[![React 18](https://img.shields.io/badge/frontend-React_18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Fastify 5](https://img.shields.io/badge/backend-Fastify_5-000000?logo=fastify&logoColor=white)](https://fastify.dev)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/db-SQLite-003b57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#licencia)
[![Live Demo](https://img.shields.io/badge/DEMO_EN_VIVO-Probar_Ahora-ff6b35?style=for-the-badge&logo=railway&logoColor=white)](https://batallatitularesf-cknews-production.up.railway.app/)

**[Probalo en vivo](https://batallatitularesf-cknews-production.up.railway.app/)** — Escanea, vota y juzga por vos mismo la calidad del software.

</div>

---

## Tabla de Contenidos

- [Resumen](#resumen)
- [Stack Tecnologico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Inicio Rapido](#inicio-rapido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo de Uso](#flujo-de-uso)
- [API Reference](#api-reference)
- [Configuracion](#configuracion)
- [Deploy en Produccion](#deploy-en-produccion)
- [Documentacion Adicional](#documentacion-adicional)
- [Licencia](#licencia)

---

## Resumen

Plataforma web que permite a **F\*cks News Noticreo** (comediantes colombianos) crear competencias de titulares absurdos donde el publico vota en tiempo real escaneando un QR desde su celular. Sin instalacion de apps, sin registro — solo escanea, vota y ve los resultados en vivo.

**Desarrollado por:** [Jhonatan Lopez Conde](https://github.com/JhonatanLpzz) — Bogota, Colombia

---

## Stack Tecnologico

| Capa | Tecnologia | Proposito |
|------|-----------|-----------|
| **Runtime** | Bun | Ejecucion ultrarapida de JS/TS |
| **Frontend** | React 18 + TypeScript + Vite | SPA con tipado fuerte y HMR |
| **Estilos** | TailwindCSS 3 + shadcn/ui | Design system con dark theme custom |
| **Backend** | Fastify 5 | API REST de alto rendimiento |
| **Base de Datos** | SQLite + Drizzle ORM | Persistencia sin servidor externo |
| **Tiempo Real** | Server-Sent Events (SSE) | Updates de votos instantaneos |
| **QR** | qrcode (server-side) | Generacion de codigos QR |
| **Autenticacion** | Bcrypt (Bun.password) + Sessions | Hashing seguro + tokens de sesion |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTES                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │  Publico  │  │  Admin   │  │  Pantalla/Proyector│ │
│  │ /votar/:c │  │  /admin  │  │  /resultados/:c   │ │
│  └─────┬─────┘  └────┬─────┘  └────────┬──────────┘ │
└────────┼──────────────┼─────────────────┼────────────┘
         │              │                 │
         │    REST API  │     SSE Stream  │
         ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              SERVIDOR (Bun + Fastify)               │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────────┐  │
│  │  Auth    │ │ Battles  │ │ Votes│ │  SSE      │  │
│  │ Routes   │ │ Routes   │ │Routes│ │ Broadcast │  │
│  └────┬─────┘ └────┬─────┘ └──┬───┘ └─────┬─────┘  │
│       └─────────────┴──────────┴───────────┘        │
│                       │                              │
│              ┌────────▼─────────┐                    │
│              │  SQLite + Drizzle │                    │
│              │  (5 tablas)       │                    │
│              └──────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## Inicio Rapido

### Prerequisitos

- [Bun](https://bun.sh) >= 1.0

### Instalacion

```bash
# Clonar repositorio
git clone https://github.com/JhonatanLpzz/BatallaTitularesF-ckNews.git
cd BatallaTitularesF-ckNews

# Instalar dependencias
bun install
```

### Desarrollo

```bash
# Frontend + Backend en paralelo
bun run dev

# O por separado:
bun run dev:client   # Frontend → http://localhost:5173
bun run dev:server   # Backend  → http://localhost:3001
```

### Build de Produccion

```bash
bun run build        # Build optimizado del frontend
bun start            # Servidor de produccion (API + SPA)
```

### Primera Ejecucion

1. Ejecuta `bun run dev`
2. Navega a `http://localhost:5173/login`
3. El sistema detecta que no hay admins y muestra el formulario de setup
4. Crea el primer administrador — listo para crear batallas

### Acceso Demo (Solo Lectura)

Quieres ver como funciona el panel admin sin tocar nada? Usa las credenciales demo:

| Campo | Valor |
|-------|-------|
| **Usuario** | `demo` |
| **Contrasena** | `demo123` |

> El usuario demo puede navegar por todo el panel de administracion y ver batallas, resultados, usuarios y QRs, pero **no puede crear, editar ni eliminar nada**. Perfecto para que los fans vean la calidad del software sin riesgo.

**[Probar ahora](https://batallatitularesf-cknews-production.up.railway.app/login)** con las credenciales demo.

---

## Estructura del Proyecto

```
batalla-titulares-fcknews/
├── server/                     # Backend Fastify
│   ├── index.ts                # Entry point, CORS, static serving
│   ├── config.ts               # Configuracion centralizada (env vars)
│   ├── sse.ts                  # Utilidad SSE (broadcast a clientes)
│   ├── db/
│   │   ├── schema.ts           # Esquema Drizzle (5 tablas documentadas)
│   │   └── index.ts            # Conexion SQLite + migraciones inline
│   └── routes/
│       ├── auth.ts             # Login, logout, setup, CRUD usuarios
│       ├── battles.ts          # CRUD batallas + timer + auto-cierre
│       ├── votes.ts            # Registro/cambio de votos + SSE broadcast
│       └── sse.ts              # Endpoint SSE por batalla
├── src/                        # Frontend React + TypeScript
│   ├── App.tsx                 # Router principal + providers
│   ├── main.tsx                # Entry point React
│   ├── types.ts                # Interfaces compartidas (documentadas)
│   ├── index.css               # Tema dark F*cks News
│   ├── constants/
│   │   └── index.ts            # Endpoints, rutas, defaults, storage keys
│   ├── services/
│   │   └── api.ts              # Capa de servicios API centralizada
│   ├── pages/
│   │   ├── LandingPage.tsx     # Landing publica
│   │   ├── LoginPage.tsx       # Login + setup inicial
│   │   ├── AdminPage.tsx       # Panel admin (batallas)
│   │   ├── UserManagementPage.tsx # Gestion de admins
│   │   ├── VotePage.tsx        # Votacion publica
│   │   └── ResultsPage.tsx     # Resultados en vivo
│   ├── components/
│   │   ├── AdminTimer.tsx      # Countdown en panel admin
│   │   ├── BattleStatusScreen.tsx # Estados no-votables
│   │   ├── CreateBattleDialog.tsx # Modal crear batalla
│   │   ├── QRDialog.tsx        # Modal QR
│   │   ├── VoteTimer.tsx       # Countdown publico
│   │   ├── VoterIdentificationForm.tsx # Formulario votante
│   │   ├── Header.tsx          # Header reutilizable
│   │   ├── ProtectedRoute.tsx  # Guard de rutas admin
│   │   └── ui/                 # Componentes shadcn/ui
│   ├── hooks/
│   │   ├── useSSE.ts           # Hook SSE con reconexion automatica
│   │   ├── useCountdown.ts     # Hook countdown reactivo
│   │   └── useBattleStatusMonitor.ts # Monitor de estado
│   ├── context/
│   │   ├── AuthContext.tsx      # Estado de autenticacion global
│   │   └── ThemeContext.tsx     # Tema claro/oscuro
│   └── lib/
│       └── utils.ts            # cn(), generateFingerprint(), formatNumber()
├── public/
│   └── logo_fn.png             # Logo F*cks News Noticreo
├── PRD.md                      # Product Requirements Document
├── CONTEXT.md                  # Documentacion tecnica detallada
├── Dockerfile                  # Build de contenedor
├── railway.json                # Config Railway
└── package.json
```

---

## Flujo de Uso

### Administrador

1. **Login** → `/login` (o setup inicial si es la primera vez)
2. **Crear batalla** → Titulo, descripcion, duracion, participantes
3. **Activar** → Inicia countdown automatico
4. **Proyectar QR** → El publico escanea con su celular
5. **Monitorear** → Resultados en `/resultados/:code` en tiempo real
6. **Gestionar** → Crear/editar admins en `/admin/usuarios`

### Publico (Votante)

1. **Escanear QR** → Redirige a `/votar/:code`
2. **Identificarse** → Nombre (obligatorio), documento/celular (opcional)
3. **Votar** → Seleccionar titular favorito
4. **Ver resultados** → Porcentajes actualizados en tiempo real

---

## API Reference

### Endpoints Publicos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/battles/:code` | Detalle de batalla con votos y timer |
| `POST` | `/api/votes` | Registrar voto (con info del votante) |
| `PUT` | `/api/votes` | Cambiar voto existente |
| `GET` | `/api/votes/check/:code?fp=` | Verificar si ya voto |
| `GET` | `/sse/battles/:code` | Stream SSE de actualizaciones |
| `GET` | `/api/auth/needs-setup` | Verificar si necesita setup |
| `POST` | `/api/auth/setup` | Crear primer admin |
| `POST` | `/api/auth/login` | Iniciar sesion |
| `GET` | `/api/auth/me` | Verificar sesion activa |

### Endpoints Protegidos (Bearer Token)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/battles` | Listar todas las batallas |
| `POST` | `/api/battles` | Crear batalla con participantes |
| `PATCH` | `/api/battles/:id/status` | Activar/cerrar batalla |
| `POST` | `/api/battles/:id/tiebreaker` | Iniciar ronda de desempate |
| `DELETE` | `/api/battles/:id` | Eliminar batalla |
| `DELETE` | `/api/battles/:id/votes` | Reiniciar votos |
| `GET` | `/api/battles/:code/qr` | Generar codigo QR |
| `GET` | `/api/users` | Listar administradores |
| `POST` | `/api/users` | Crear administrador |
| `PATCH` | `/api/users/:id/username` | Cambiar nombre de usuario |
| `PATCH` | `/api/users/:id/password` | Cambiar contrasena |
| `DELETE` | `/api/users/:id` | Eliminar administrador |

### Health Check

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/health` | Estado del servidor (para Railway, etc.) |

---

## Configuracion

### Variables de Entorno

```env
# Servidor
PORT=3001                  # Puerto del servidor
HOST=0.0.0.0              # Host de escucha
NODE_ENV=development       # development | production

# Seguridad (OBLIGATORIO en produccion)
JWT_SECRET=your-256-bit-secret-min-32-chars
CORS_ORIGIN=https://tudominio.com

# Base de datos
DB_PATH=./data/batalla.db
DB_BACKUP_PATH=./data/backups

# Rate limiting
RATE_LIMIT_VOTES=10        # Max votos por ventana
RATE_LIMIT_WINDOW=300000   # Ventana en ms (5 min)

# Sesiones
SESSION_DURATION=86400000  # Duracion en ms (24h)
```

Ver `.env.example` para la plantilla completa.

---

## Deploy en Produccion

### Con Docker

```bash
docker build -t batalla-titulares .
docker run -p 3001:3001 \
  -e JWT_SECRET=tu-secret-seguro-de-32-chars-minimo \
  -e NODE_ENV=production \
  -v batalla-data:/storage/data \
  batalla-titulares
```

### Con Railway

El proyecto incluye `railway.json` preconfigurado. Solo necesitas:
1. Conectar el repositorio en Railway
2. Configurar `JWT_SECRET` en las variables de entorno
3. Agregar un volumen persistente en `/storage/data`

### Manual (VPS)

```bash
bun install --production
bun run build
JWT_SECRET=tu-secret NODE_ENV=production bun start
```

**Recomendado:** Nginx como reverse proxy + PM2/systemd para process management.

---

## Documentacion Adicional

| Documento | Contenido |
|-----------|-----------|
| [`PRD.md`](./PRD.md) | Product Requirements Document completo |
| [`CONTEXT.md`](./CONTEXT.md) | Arquitectura, esquema DB, flujos, estado del proyecto |
| [`src/types.ts`](./src/types.ts) | Interfaces TypeScript documentadas con JSDoc |
| [`src/services/api.ts`](./src/services/api.ts) | Capa de servicios API documentada |
| [`src/constants/index.ts`](./src/constants/index.ts) | Constantes centralizadas |

---

## Licencia

Este proyecto fue desarrollado especificamente para **F\*cks News Noticreo** por **Jhonatan Lopez Conde**.

Todos los derechos reservados. &copy; 2026 F\*cks News Noticreo — Bogota, Colombia
