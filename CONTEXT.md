# Batalla de Titulares — Documentacion Tecnica

> Documento de contexto tecnico para desarrolladores. Para una vista general del proyecto, ver [`README.md`](./README.md).
> Para requisitos de producto, ver [`PRD.md`](./PRD.md).

**Proyecto:** Batalla de Titulares — F\*cks News Noticreo  
**Desarrollado por:** Jhonatan Lopez Conde — Bogota, Colombia  
**Ultima actualizacion:** Abril 2026

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
| **Real-time** | Server-Sent Events (SSE) | nativo |
| **QR** | qrcode | 1.5 (server-side) |
| **Auth** | Bcrypt (Bun.password) + nanoid sessions | — |

---

## Arquitectura del Proyecto

```
batalla-titulares-fcknews/
├── server/                          # === BACKEND (Fastify) ===
│   ├── index.ts                     # Entry point, CORS, static serve, health check
│   ├── config.ts                    # Configuracion env vars centralizada
│   ├── sse.ts                       # Utilidad SSE: addClient, removeClient, broadcast
│   ├── db/
│   │   ├── schema.ts               # Esquema Drizzle ORM (5 tablas con JSDoc)
│   │   └── index.ts                # Conexion SQLite + migraciones inline
│   └── routes/
│       ├── auth.ts                  # Auth: login, logout, setup, CRUD usuarios
│       ├── battles.ts              # CRUD batallas + timer + auto-cierre + QR
│       ├── votes.ts                # Registro/cambio votos + SSE broadcast
│       └── sse.ts                  # Endpoint SSE por batalla
│
├── src/                             # === FRONTEND (React 18) ===
│   ├── App.tsx                      # Router principal + ThemeProvider + AuthProvider
│   ├── main.tsx                     # Entry point React
│   ├── types.ts                     # Interfaces compartidas (con JSDoc completo)
│   ├── index.css                    # CSS custom: tema dark F*cks News
│   │
│   ├── constants/
│   │   └── index.ts                # Endpoints API, rutas, defaults, storage keys
│   │
│   ├── services/
│   │   └── api.ts                  # Capa de servicios: authService, battleService,
│   │                                #   voteService, userService (tipado fuerte)
│   ├── context/
│   │   ├── AuthContext.tsx          # Estado de autenticacion global
│   │   └── ThemeContext.tsx         # Tema claro/oscuro
│   │
│   ├── hooks/
│   │   ├── useSSE.ts               # SSE con reconexion automatica
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
│   │   ├── VoterIdentificationForm.tsx # Formulario identificacion votante
│   │   ├── Header.tsx               # Header reutilizable
│   │   ├── ProtectedRoute.tsx       # Guard de rutas admin
│   │   ├── ResultsChart.tsx         # Grafico de resultados
│   │   ├── BattleCard.tsx           # Card de batalla
│   │   ├── CountdownTimer.tsx       # Timer visual
│   │   ├── VoteOption.tsx           # Opcion de voto
│   │   ├── ThemeToggle.tsx          # Toggle tema claro/oscuro
│   │   ├── TieManager.tsx           # Gestion de empates
│   │   ├── AdminTieControls.tsx     # Controles de empate admin
│   │   └── ui/                      # Componentes shadcn/ui base
│   │
│   └── pages/
│       ├── LandingPage.tsx          # Landing publica de bienvenida
│       ├── LoginPage.tsx            # Login admin + setup inicial
│       ├── AdminPage.tsx            # Panel admin (usa CreateBattleDialog, QRDialog, AdminTimer)
│       ├── UserManagementPage.tsx   # CRUD usuarios administradores
│       ├── VotePage.tsx             # Votacion publica (usa VoterIdentificationForm, BattleStatusScreen, VoteTimer)
│       └── ResultsPage.tsx          # Resultados en vivo + countdown
│
├── public/
│   └── logo_fn.png                  # Logo F*cks News Noticreo
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

**Indice unico:** `(battle_id, fingerprint)` — previene votos duplicados por dispositivo.

---

## Flujo de Uso

### Admin
1. Accede a `/login` → se autentica (o crea admin si es primera vez via auto-setup)
2. En `/admin` crea una batalla con titulo, descripcion, timer opcional, y participantes
   - **Defaults:** Camilo Pardo 'El Mago' y Camilo Sanchez 'El Inquieto'
3. Activa la batalla → inicia countdown automatico
4. Muestra el QR al publico (proyector/pantalla)
5. Ve resultados en tiempo real con countdown visible
6. La batalla se auto-cierra al expirar → detecta empate automaticamente
7. Si hay empate, puede iniciar ronda de desempate
8. Gestiona usuarios admin desde `/admin/usuarios`

### Publico (Votante)
1. Escanea QR → llega a `/votar/:code`
2. Ingresa nombre (obligatorio), documento y celular (opcionales)
3. Selecciona titular favorito → voto registrado con confirmacion visual
4. Puede cambiar su voto mientras el timer siga activo
5. Ve porcentajes en tiempo real via SSE
6. Al expirar el timer, redirige automaticamente a resultados

---

## Rutas Frontend

| Ruta | Acceso | Componente | Descripcion |
|------|--------|-----------|-------------|
| `/` | Publico | `LandingPage` | Landing page |
| `/login` | Publico | `LoginPage` | Login / Setup inicial |
| `/votar/:code` | Publico | `VotePage` | Votacion (destino QR) |
| `/resultados/:code` | Publico | `ResultsPage` | Resultados en vivo |
| `/admin` | Protegido | `AdminPage` | Panel de administracion |
| `/admin/usuarios` | Protegido | `UserManagementPage` | Gestion de admins |

---

## API Endpoints

Documentacion completa en la tabla de [`README.md`](./README.md#api-reference).
Documentacion JSDoc en `server/routes/*.ts`.

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
- **Constantes:** Endpoints, rutas, defaults en `src/constants/index.ts`
- **Tipos:** Interfaces documentadas con JSDoc en `src/types.ts`
- **Componentizacion:** Paginas delegated a componentes especializados
- **Hooks:** SSE con reconexion, countdown reactivo, monitor de estado

### Backend
- **Rutas documentadas:** Cada archivo de rutas tiene JSDoc con lista de endpoints
- **Config centralizada:** `server/config.ts` con validacion de produccion
- **SSE modular:** Utilidad de broadcast separada del endpoint
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
