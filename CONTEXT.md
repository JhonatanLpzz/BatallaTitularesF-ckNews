# Batalla de Titulares — Documentacion Tecnica

> Documento de contexto tecnico para desarrolladores. Para una vista general del proyecto, ver [`README.md`](./README.md).
> Para requisitos de producto, ver [`PRD.md`](./PRD.md).

**Proyecto:** Batalla de Titulares  
**Desarrollado por:** Jhonatan Lopez Conde — Bogota, Colombia  
**Ultima actualizacion:** Abril 2026 — Arquitectura WebSocket, Ranking Global, N+1 fixes

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| **Runtime** | Bun | >= 1.0 |
| **Frontend** | React + TypeScript + Vite | 18 / 5.7 / 6.0 |
| **Animación** | Framer Motion | 11.18 |
| **Estilos** | TailwindCSS + shadcn/ui | 3.4 / custom |
| **Backend** | Fastify | 5.2 |
| **ORM** | Drizzle ORM | 0.38 |
| **Base de datos** | SQLite (bun:sqlite) | embedded |
| **Real-time** | Socket.IO (WebSockets) | 4.8 |
| **Confetti** | canvas-confetti | 1.9 |
| **QR** | qrcode | 1.5 (server-side) |
| **Auth** | Bcrypt (Bun.password) + nanoid sessions | — |

---

## Arquitectura del Proyecto

```
batalla-titulares/
├── server/                          # === BACKEND (Fastify) ===
│   ├── index.ts                     # Entry point, CORS, static serve, health check
│   ├── config.ts                    # Configuracion env vars centralizada
│   ├── sse.ts                       # Legado SSE (heartbeat 25s, limpieza de conexiones)
│   ├── realtime/
│   │   ├── websocket.ts            # Servidor Socket.IO con rooms por battleCode
│   │   └── publisher.ts            # Publisher desacoplado (adaptador de transporte)
│   ├── db/
│   │   ├── schema.ts               # Esquema Drizzle ORM (5 tablas con JSDoc)
│   │   └── index.ts                # Conexion SQLite + migraciones inline + 4 indices
│   └── routes/
│       ├── auth.ts                  # Auth: login, logout, setup, CRUD usuarios
│       ├── battles.ts              # CRUD batallas + timer + auto-cierre + QR (N+1 fixed)
│       ├── votes.ts                # Registro/cambio votos + rate limiting + WS publish
│       ├── rankings.ts             # Endpoint ranking global agregado
│       └── sse.ts                  # Endpoint SSE legado (mantenido por compatibilidad)
│
├── src/                             # === FRONTEND (React 18) ===
│   ├── App.tsx                      # Router principal + ThemeProvider + AuthProvider
│   ├── main.tsx                     # Entry point React
│   ├── types.ts                     # Interfaces compartidas (con JSDoc completo)
│   ├── index.css                    # CSS custom: tema dark
│   │
│   ├── constants/
│   │   └── index.ts                # Endpoints API, rutas, defaults, storage keys
│   │
│   ├── services/
│   │   └── api.ts                  # Capa de servicios: authService, battleService,
│   │                                #   voteService, rankingService, userService
│   ├── context/
│   │   ├── AuthContext.tsx          # Estado de autenticacion global
│   │   └── ThemeContext.tsx         # Tema claro/oscuro
│   │
│   ├── hooks/
│   │   ├── useWebSocket.ts         # Socket.IO con rooms, join/leave, reconexion
│   │   ├── useSSE.ts               # SSE legado (no usado activamente)
│   │   ├── useCountdown.ts         # Countdown reactivo MM:SS
│   │   └── useBattleStatusMonitor.ts # Polling de estado para batallas activas
│   │
│   ├── lib/
│   │   └── utils.ts                # cn(), generateFingerprint(), formatNumber()
│   │
│   ├── components/
│   │   ├── AdminTimer.tsx           # Countdown panel admin + auto-update estado
│   │   ├── BattleStatusScreen.tsx   # Pantalla error/draft/closed/tied
│   │   ├── CreateBattleDialog.tsx   # Modal crear batalla
│   │   ├── QRDialog.tsx             # Modal mostrar QR
│   │   ├── VoteTimer.tsx            # Countdown publico + redirect al expirar
│   │   ├── VoterIdentificationForm.tsx # Formulario identificacion (legacy, no requerido)
│   │   ├── Header.tsx               # Header reutilizable
│   │   ├── ProtectedRoute.tsx       # Guard de rutas admin
│   │   ├── ResultsChart.tsx         # Grafico de resultados
│   │   ├── BattleCard.tsx           # Card de batalla
│   │   ├── CountdownTimer.tsx       # Timer visual
│   │   ├── VoteOption.tsx           # Opcion de voto
│   │   ├── ThemeToggle.tsx          # Toggle tema claro/oscuro
│   │   ├── TieManager.tsx           # Gestion de empates
│   │   ├── AdminTieControls.tsx     # Controles de empate admin
│   │   ├── AccessibilityMenu.tsx    # Menu flotante de accesibilidad (alto contraste, fuentes)
│   │   └── ui/                      # Componentes shadcn/ui base
│   │
│   └── pages/
│       ├── LandingPage.tsx          # Landing publica + boton ranking global
│       ├── LoginPage.tsx            # Login admin + setup inicial
│       ├── AdminPage.tsx            # Panel admin (CreateBattleDialog, QRDialog, AdminTimer)
│       ├── UserManagementPage.tsx   # CRUD usuarios administradores
│       ├── VotePage.tsx             # Votacion publica (nombre opcional, confetti, haptic)
│       ├── ResultsPage.tsx          # Resultados en vivo + countdown
│       └── RankingPage.tsx          # Ranking global de participantes (/ranking)
│
├── public/
├── PRD.md                           # Product Requirements Document
├── CONTEXT.md                       # Este archivo
├── Dockerfile                       # Build Docker
├── railway.json                     # Config Railway
├── .env.example                     # Plantilla de variables de entorno
└── package.json
```

---

## Esquema de Base de Datos

Documentacion detallada con JSDoc en `server/db/schema.ts`.

### `admin_users`
| Columna | Tipo | Constraint | Descripcion |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO | ID unico |
| `username` | TEXT | NOT NULL, UNIQUE | Nombre de usuario |
| `password_hash` | TEXT | NOT NULL | Hash bcrypt |
| `role` | TEXT | DEFAULT 'admin' | Puede ser 'admin' o 'demo' |
| `created_at` | TEXT | NOT NULL | Timestamp ISO |

### `sessions`
| Columna | Tipo | Constraint | Descripcion |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO | ID unico |
| `token` | TEXT | NOT NULL, UNIQUE | Token nanoid(48) |
| `user_id` | INTEGER | FK → admin_users, CASCADE | Propietario |
| `expires_at` | TEXT | NOT NULL | Expiracion ISO |

### `battles`
| Columna | Tipo | Constraint | Descripcion |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO | ID unico |
| `code` | TEXT | NOT NULL, UNIQUE | Codigo corto nanoid(8) |
| `title` | TEXT | NOT NULL | Titulo visible |
| `description` | TEXT | nullable | Descripcion opcional |
| `status` | TEXT | NOT NULL, DEFAULT 'draft' | draft/active/closed/tied/tiebreaker |
| `duration_minutes` | INTEGER | nullable | Duracion (null = sin limite) |
| `activated_at` | TEXT | nullable | Timestamp activacion |
| `tied_participant_ids` | TEXT | nullable | JSON array de IDs empatados |
| `tiebreak_round` | INTEGER | DEFAULT 0 | Ronda de desempate |
| `winner_id` | INTEGER | nullable | Ganador (al cerrar) |
| `created_at` | TEXT | NOT NULL | Timestamp creacion |

### `participants`
| Columna | Tipo | Constraint | Descripcion |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO | ID unico |
| `battle_id` | INTEGER | FK → battles, CASCADE | Batalla padre |
| `name` | TEXT | NOT NULL | Nombre participante |
| `headline` | TEXT | NOT NULL | Titular/noticia |
| `avatar_url` | TEXT | nullable | URL avatar |
| `color` | TEXT | NOT NULL, DEFAULT '#1a56a8' | Color hex |
| `position` | INTEGER | NOT NULL, DEFAULT 0 | Orden |

### `votes`
| Columna | Tipo | Constraint | Descripcion |
|---------|------|-----------|-------------|
| `id` | INTEGER | PK, AUTO | ID unico |
| `battle_id` | INTEGER | FK → battles, CASCADE | Batalla |
| `participant_id` | INTEGER | FK → participants, CASCADE | Participante elegido |
| `voter_name` | TEXT | NOT NULL | Nombre del votante |
| `voter_document` | TEXT | nullable | Documento |
| `voter_phone` | TEXT | nullable | Celular |
| `fingerprint` | TEXT | NOT NULL | Huella dispositivo |
| `voted_at` | TEXT | NOT NULL | Timestamp voto |

**Indices:**
- `UNIQUE (battle_id, fingerprint)` — previene votos duplicados por dispositivo
- `idx_votes_participant_id` — acelera COUNT por participante
- `idx_votes_battle_participant` — acelera agregaciones JOIN
- `idx_participants_battle_position` — acelera ORDER BY en listados
- `idx_battles_status_created` — acelera filtros por estado

---

## Flujo de Uso

### Admin
1. Accede a `/login` → se autentica (o crea admin si es primera vez via auto-setup)
2. En `/admin` crea una batalla con titulo, descripcion, timer opcional, y participantes
   - **Defaults:** Participante 1 y Participante 2
3. Activa la batalla → inicia countdown automatico
4. Muestra el QR al publico (proyector/pantalla)
5. Ve resultados en tiempo real con countdown visible
6. La batalla se auto-cierra al expirar → detecta empate automaticamente
7. Si hay empate, puede iniciar ronda de desempate
8. Gestiona usuarios admin desde `/admin/usuarios`

### Publico (Votante)
1. Escanea QR → llega a `/votar/:code`
2. Selecciona titular favorito directamente (**nombre es opcional**, se asigna alias anonimo)
3. Voto registrado → confetti animado + haptic feedback en movil
4. Puede cambiar su voto mientras el timer siga activo
5. Ve porcentajes en tiempo real via **WebSocket (Socket.IO)**
6. Al expirar el timer, redirige automaticamente a resultados
7. Puede explorar el ranking global en `/ranking`

---

## Rutas Frontend

| Ruta | Acceso | Componente | Descripcion |
|------|--------|-----------|-------------|
| `/` | Publico | `LandingPage` | Landing page con batallas activas |
| `/login` | Publico | `LoginPage` | Login / Setup inicial |
| `/ranking` | Publico | `RankingPage` | Ranking global de participantes |
| `/votar/:code` | Publico | `VotePage` | Votacion publica (destino QR) |
| `/resultados/:code` | Publico | `ResultsPage` | Resultados en vivo |
| `/admin` | Protegido | `AdminPage` | Panel de administracion |
| `/admin/usuarios` | Protegido | `UserManagementPage` | Gestion de admins |

---

## API Endpoints

Documentacion completa en la tabla de [`README.md`](./README.md#api-reference).
Documentacion JSDoc en `server/routes/*.ts`.

**Endpoints publicos adicionales:**
- `GET /api/battles/active` — Batallas en estado active/tiebreaker/closed para landing page
- `GET /api/rankings/global` — Ranking global agregado por nombre de participante (votos, wins, batallas)

**Tiempo real (WebSocket):**
- Path: `/ws/socket.io`
- El cliente emite `join_battle(battleCode)` para suscribirse a un room
- El servidor emite `vote_update` con `{ participants, totalVotes }` en cada voto
- Publisher desacoplado en `server/realtime/publisher.ts` — intercambiable por Redis Pub/Sub

---

## Paleta de Colores

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--primary` | `#1a56a8` | Botones, enlaces, branding |
| `--accent` (destructive) | `#dc2626` | Alertas, acentos, ganador |
| `--background` | `Dark Animated` | Fondo dinámico negro ahumado con toques de brillo rojo y dorado |
| `--card` | `#ffffff` | Cards, navbars |
| `--foreground` | `#fafafa` | Texto principal |
| `--muted-foreground` | `#6b7280` | Texto secundario |

---

## Practicas de Desarrollo

### Frontend
- **Capa de servicios:** Todas las llamadas API centralizadas en `src/services/api.ts`
- **Constantes:** Endpoints, rutas, defaults, `WS_PATH` en `src/constants/index.ts`
- **Tipos:** Interfaces documentadas con JSDoc en `src/types.ts` (`WSEvent`, `GlobalRankingEntry`)
- **Componentizacion:** Paginas delegated a componentes especializados
- **Hooks:** `useWebSocket` (Socket.IO con rooms), countdown reactivo, monitor de estado
- **UX:** Nombre votante opcional (alias anonimo), confetti en voto, haptic feedback movil

### Backend
- **Rutas documentadas:** Cada archivo de rutas tiene JSDoc con lista de endpoints
- **Config centralizada:** `server/config.ts` con validacion de produccion
- **WebSocket desacoplado:** `server/realtime/publisher.ts` abstrae el transporte; sustituible por Redis Pub/Sub
- **Rate limiting:** Sliding window en memoria por fingerprint (`Map<string, number[]>`)
- **N+1 eliminado:** Todas las queries de conteo usan `LEFT JOIN + GROUP BY` en lugar de loops
- **Auto-cierre:** Timer verifica expiracion + detecta empates automaticamente

---

## Comandos

```bash
bun install             # Instalar dependencias
bun run dev             # Desarrollo (API + Frontend en paralelo)
bun run dev:client      # Solo frontend → http://localhost:5173
bun run dev:server      # Solo backend  → http://localhost:3001
bun run build           # Build produccion
bun start               # Servidor produccion
bun run db:generate     # Generar migraciones Drizzle
bun run db:migrate      # Ejecutar migraciones
```

---

## Estado: PRODUCTO COMPLETO Y FUNCIONAL

Todas las funcionalidades core implementadas y documentadas. Ver `PRD.md` para el roadmap de mejoras futuras.
