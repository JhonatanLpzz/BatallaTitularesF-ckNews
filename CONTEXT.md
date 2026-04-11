# Batalla de Titulares — F*cks News Noticreo

## Resumen

Aplicativo web de votacion en vivo para la **Batalla de Titulares** de **F*cks News Noticreo**, comediantes colombianos. Permite crear batallas donde los participantes compiten con titulares absurdos y el publico vota en tiempo real escaneando un QR desde su celular.

**Desarrollado por:** Jhonatan Lopez Conde — Bogota, Colombia

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| **Runtime** | Bun |
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | TailwindCSS 3 + shadcn/ui (custom) |
| **Backend** | Fastify 5 |
| **Base de datos** | SQLite (bun:sqlite) + Drizzle ORM |
| **QR** | qrcode (generacion server-side) |
| **Real-time** | Server-Sent Events (SSE) |
| **Autenticacion** | Bcrypt (Bun.password) + tokens de sesion |

---

## Arquitectura

```
windsurf-project-3/
├── server/                  # Backend Fastify
│   ├── index.ts             # Entry point del servidor
│   ├── sse.ts               # Utilidad SSE (broadcast)
│   ├── db/
│   │   ├── schema.ts        # Esquema Drizzle (admin_users, sessions, battles, participants, votes)
│   │   └── index.ts         # Conexion SQLite + creacion de tablas
│   └── routes/
│       ├── auth.ts          # Login, logout, setup, CRUD usuarios
│       ├── battles.ts       # CRUD batallas + timer + auto-cierre
│       ├── votes.ts         # Votar (con info votante) + validar timer
│       └── sse.ts           # Endpoint SSE por batalla
├── src/                     # Frontend React
│   ├── main.tsx             # Entry point React
│   ├── App.tsx              # Router + AuthProvider
│   ├── index.css            # Paleta F*cks News (azul/rojo/blanco) flat
│   ├── types.ts             # Interfaces TypeScript
│   ├── context/
│   │   └── AuthContext.tsx   # Estado de autenticacion global
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/              # Button, Card, Input, Badge, Dialog, Textarea
│   ├── hooks/
│   │   ├── useSSE.ts        # Hook para actualizaciones en tiempo real
│   │   └── useCountdown.ts   # Hook para countdown timer
│   ├── lib/
│   │   └── utils.ts         # cn(), generateFingerprint(), formatNumber()
│   └── pages/
│       ├── LandingPage.tsx   # Pagina publica de bienvenida
│       ├── LoginPage.tsx     # Login admin + setup inicial
│       ├── AdminPage.tsx     # Panel admin (crear, activar, QR, timer)
│       ├── UserManagementPage.tsx # Gestión de usuarios admin
│       ├── VotePage.tsx      # Formulario votante + countdown + seleccion
│       └── ResultsPage.tsx   # Resultados en vivo + countdown
├── public/
│   ├── logo_fn.png           # Logo F*cks News Noticreo
│   └── favicon.svg
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

---

## Flujo de Uso

### Admin
1. Accede a `/login` → se autentica (o crea admin si es primera vez)
2. En `/admin` crea una batalla con titulo, descripcion, timer opcional (ej: 5 min), y participantes
   - **Por defecto:** Camilo Pardo 'El mago' y Camilo Sanchez 'El Inquieto'
   - **Headlines:** `[Titular sera dado en vivo]` (para cambiar durante el show)
3. Activa la batalla → inicia countdown automático si tiene timer
4. Muestra el QR al publico (proyector/pantalla)
5. Ve resultados en tiempo real con countdown visible
6. La batalla se auto-cierra cuando expira el timer, o se cierra manualmente
7. Gestiona usuarios admin desde `/admin/usuarios`

### Publico (Votante)
1. Escanea el QR con su celular → llega a `/votar/:code`
2. Ingresa su nombre (obligatorio), documento y celular (opcionales)
3. Selecciona el titular que mas le gusta → voto registrado
4. Ve porcentajes en tiempo real despues de votar

---

### Rutas

### Publicas
- `GET /` — Landing page
- `GET /login` — Login / Setup admin
- `GET /votar/:code` — Pagina de votacion (QR destination)
- `GET /resultados/:code` — Resultados en vivo

### Privadas (requieren auth)
- `GET /admin` — Panel de administracion
- `GET /admin/usuarios` — Gestión de usuarios admin

### API Publicas
- `GET /api/battles/:code` — Detalle de batalla con votos y timer
- `POST /api/votes` — Registrar voto (con info del votante)
- `GET /api/votes/check/:code?fp=` — Verificar si ya voto
- `GET /api/sse/:battleId` — SSE stream de actualizaciones
- `GET /api/auth/needs-setup` — Verificar si necesita setup
- `POST /api/auth/setup` — Crear primer admin
- `POST /api/auth/login` — Iniciar sesion
- `GET /api/auth/me` — Verificar sesion

### API Protegidas (Bearer token)
- `GET /api/battles` — Listar batallas
- `POST /api/battles` — Crear batalla (con timer opcional)
- `PATCH /api/battles/:id/status` — Cambiar estado (auto-cierre por timer)
- `DELETE /api/battles/:id` — Eliminar batalla
- `DELETE /api/battles/:id/votes` — Reiniciar votos
- `GET /api/battles/:code/qr` — Generar QR
- `GET /api/users` — Listar administradores
- `POST /api/users` — Crear nuevo administrador
- `PATCH /api/users/:id/username` — Cambiar username
- `PATCH /api/users/:id/password` — Cambiar contraseña
- `DELETE /api/users/:id` — Eliminar administrador

---

## Paleta de Colores (F*cks News)

| Token | HSL | Hex aprox. | Uso |
|-------|-----|-----------|-----|
| `--primary` (fn-blue) | 217 78% 41% | #1a56a8 | Botones, enlaces, branding |
| `--accent` (fn-red) | 0 72% 51% | #dc2626 | Barra superior, acentos, ganador |
| `--background` | 0 0% 98% | #fafafa | Fondo general |
| `--card` | 0 0% 100% | #ffffff | Cards, navbars |
| `--foreground` | 220 20% 10% | #141a26 | Texto principal |
| `--muted-foreground` | 220 9% 46% | #6b7280 | Texto secundario |

---

## Esquema de Base de Datos

### admin_users
- `id`, `username` (unique), `password_hash`, `created_at`

### sessions
- `id`, `token` (unique), `user_id` (FK), `expires_at`

### battles
- `id`, `code` (unique), `title`, `description`, `status` (draft/active/closed), `duration_minutes` (nullable), `activated_at` (nullable), `created_at`

### participants
- `id`, `battle_id` (FK), `name`, `headline`, `avatar_url`, `color`, `position`

### votes
- `id`, `battle_id` (FK), `participant_id` (FK), `voter_name`, `voter_document`, `voter_phone`, `fingerprint`, `voted_at`
- UNIQUE INDEX: `(battle_id, fingerprint)`

---

## Estado Actual

### Completado
- [x] Estructura del proyecto con Bun + Vite + React + Fastify
- [x] Base de datos SQLite con bun:sqlite + Drizzle ORM
- [x] CRUD completo de batallas (crear, activar, cerrar, eliminar, reiniciar votos)
- [x] **Timer de batalla:** campo duration_minutes, auto-cierre al expirar
- [x] **Countdown UI:** timer MM:SS visible en votacion y resultados
- [x] **Bloqueo por tiempo:** no permite votar si la batalla expiro
- [x] Generacion de QR por batalla
- [x] Sistema de votacion publica con identificacion del votante
- [x] **Info del votante:** nombre (obligatorio), documento/celular (opcionales)
- [x] Actualizaciones en tiempo real via SSE
- [x] Autenticacion admin (login, sesiones, setup inicial)
- [x] **Gestión de usuarios:** crear, editar, cambiar contraseñas, eliminar admins
- [x] Rutas protegidas (admin, usuarios) vs publicas (votar, resultados)
- [x] UI flat minimalista con paleta F*cks News (azul/rojo/blanco)
- [x] Logo F*cks News Noticreo integrado en todas las paginas
- [x] **Nombres por defecto:** Camilo Pardo 'El mago' y Camilo Sanchez 'El Inquieto'
- [x] **Mensajes de agradecimiento:** fans messages a F*cks News en todos los footers

### Pendiente (Futuras Mejoras)
- [ ] Exportar resultados (CSV/PDF) con datos de votantes
- [ ] Vista fullscreen para proyectar resultados en shows
- [ ] Soporte para multiples rondas consecutivas
- [ ] Notificaciones push cuando se activa una batalla
- [ ] Tema oscuro (modo cine/presentacion)
- [ ] Estadisticas históricas de batallas anteriores
- [ ] Backup/restore de base de datos
- [ ] Roles de usuario (admin vs moderador)

---

## Funcionalidades Clave Implementadas

### 🔐 Autenticación Completa
- Setup automático del primer admin (`/login` detecta si no hay usuarios)
- Login/logout con tokens JWT y sesiones persistentes
- Protección de rutas admin con middleware
- Gestión completa de usuarios: crear, editar, cambiar contraseñas, eliminar
- Prevenciones: no auto-eliminarse, mantener al menos 1 admin

### ⏱️ Timer de Batalla
- Campo opcional "Duración" al crear batalla (ej: 5 minutos)
- Al activar: guarda timestamp y calcula expiración automática
- Countdown en tiempo real `MM:SS` visible en votación y resultados
- Auto-cierre cuando expira + bloqueo de votos tardíos
- API responde `expiresAt` para sincronización frontend

### 🗳️ Votación Pública con Info
- Sin autenticación requerida para votar
- Formulario obligatorio: **nombre** (requerido), documento/celular (opcional)
- Un voto por dispositivo usando fingerprint único
- Resultados en tiempo real vía Server-Sent Events

### 🎨 Branding F*cks News
- Paleta azul/rojo/blanco flat minimalista
- Logo integrado en todas las páginas
- Mensajes de agradecimiento: *"Gracias por esa comedia ácida y bien pensada"*
- Participantes por defecto: **Camilo Pardo 'El mago'** y **Camilo Sanchez 'El Inquieto'**

---

## Comandos

```bash
# Instalar dependencias
bun install

# Desarrollo (API + Frontend en paralelo)
bun run dev

# Solo frontend
bun run dev:client

# Solo backend
bun run dev:server

# Build produccion
bun run build

# Produccion
bun start
```

**Frontend:** http://localhost:5173  
**API:** http://localhost:3001

---

## Credenciales Actuales

**Admin Principal:** `admin` / `admin123`  
**Usuario Adicional:** `editor` / `editor123`

*Nota: Puedes crear más usuarios desde `/admin/usuarios` o cambiar estas credenciales.*

---

## Estado del Proyecto: ✅ COMPLETO

Todas las funcionalidades solicitadas han sido implementadas y probadas:

- ✅ **Autenticación** — Login, sesiones, gestión de usuarios
- ✅ **Enrutamiento** — Rutas públicas y privadas
- ✅ **Votación sin auth** — Solo requiere nombre del votante
- ✅ **Timer automático** — Duración configurable + auto-cierre
- ✅ **Countdown en vivo** — MM:SS visible en todas las páginas
- ✅ **Branding F*cks News** — Logo, colores, mensajes de fans
- ✅ **Participantes listos** — Camilo Pardo y Camilo Sanchez por defecto

**El aplicativo está 100% funcional para usar en shows en vivo.**
