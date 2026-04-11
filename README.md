# 🎭 Batalla de Titulares — F*cks News Noticreo

Sistema de votación interactiva en tiempo real para la **Batalla de Titulares** de **F*cks News Noticreo**, comediantes colombianos.

**Desarrollado por:** Jhonatan Lopez Conde — Bogotá, Colombia  
**Repositorio:** https://github.com/JhonatanLpzz/BatallaTitularesF-ckNews

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Runtime** | Bun (JavaScript runtime ultrarrápido) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | TailwindCSS 3 + shadcn/ui (custom dark theme) |
| **Backend** | Fastify 5 + middleware de autenticación |
| **Base de datos** | SQLite (bun:sqlite) + Drizzle ORM |
| **Tiempo real** | Server-Sent Events (SSE) |
| **QR Codes** | qrcode (generación server-side) |
| **Autenticación** | Bcrypt + JWT sessions |

---

## ⚡ Inicio Rápido

### **Instalación**
```bash
# Instalar Bun (si no lo tienes)
curl -fsSL https://bun.sh/install | bash

# Clonar repositorio
git clone https://github.com/JhonatanLpzz/BatallaTitularesF-ckNews.git
cd BatallaTitularesF-ckNews

# Instalar dependencias
bun install
```

### **Desarrollo**
```bash
# Ejecutar frontend + backend simultáneamente
bun run dev

# O por separado:
bun run dev:client   # Solo frontend → http://localhost:5173
bun run dev:server   # Solo backend → http://localhost:3001
```

### **Producción**
```bash
# Build optimizado
bun run build

# Servidor de producción
bun start
```

---

## 🎪 Características Principales

### ✅ **Sistema Completo**
- **🔐 Autenticación:** Login admin, gestión de usuarios, sesiones JWT
- **⏱️ Timer Automático:** Duración configurable, auto-cierre, countdown en vivo
- **🗳️ Votación Pública:** Sin registro, solo nombre del votante requerido  
- **📱 Mobile-First:** QR scanning, interfaz táctil optimizada
- **📊 Tiempo Real:** Resultados via Server-Sent Events
- **🎨 Diseño Profesional:** Estilo campaña F*cks News (dark + gold gradients)

### ✅ **Flujo de Uso**

#### **👨‍💼 Admin**
1. Accede a `/login` → configura primer admin o inicia sesión
2. Crea batalla en `/admin` → título, descripción, timer opcional, participantes
3. Activa la batalla → inicia countdown automático  
4. Genera QR → proyecta en pantalla para el público
5. Monitor resultados → `/resultados/:code` en tiempo real
6. Gestiona usuarios → `/admin/usuarios` para múltiples admins

#### **👥 Público**
1. Escanea QR → redirige a `/votar/:code`
2. Ingresa nombre (obligatorio) + documento/celular (opcional)
3. Selecciona titular favorito → voto registrado
4. Ve resultados actualizados en tiempo real

---

## 🗂️ Estructura del Proyecto

```
batalla-titulares/
├── 📁 server/           # Backend Fastify
│   ├── index.ts         # Entry point + CORS + routes
│   ├── sse.ts           # Server-Sent Events utility
│   ├── 📁 db/
│   │   ├── schema.ts    # Drizzle schema (5 tablas)
│   │   └── index.ts     # SQLite connection + init
│   └── 📁 routes/
│       ├── auth.ts      # Auth + user management
│       ├── battles.ts   # CRUD battles + timer logic  
│       ├── votes.ts     # Voting + timer validation
│       └── sse.ts       # SSE endpoints
├── 📁 src/              # Frontend React
│   ├── App.tsx          # Router + AuthProvider
│   ├── index.css        # Campaign dark theme
│   ├── types.ts         # TypeScript interfaces
│   ├── 📁 pages/        # 6 páginas principales
│   ├── 📁 components/   # UI + ProtectedRoute
│   ├── 📁 context/      # AuthContext global
│   └── 📁 hooks/        # useSSE + useCountdown
└── 📁 public/
    └── logo_fn.png      # Logo F*cks News
```

---

## 🔑 Configuración Inicial

### **Primera Vez**
1. Ejecuta `bun run dev`
2. Ve a http://localhost:5173/login
3. Crea el primer administrador (se detecta automáticamente)
4. ¡Listo para crear batallas!

### **Credenciales de Prueba**
```
Usuario: admin
Contraseña: admin123
```

---

## 🌐 Rutas de la Aplicación

### **Públicas**
- `/` — Landing page con estilo campaña  
- `/votar/:code` — Página de votación (destino QR)
- `/resultados/:code` — Resultados en tiempo real
- `/login` — Login admin / setup inicial

### **Protegidas** (requieren autenticación)
- `/admin` — Panel de administración de batallas
- `/admin/usuarios` — Gestión de usuarios administradores

### **API Endpoints**
```
GET  /api/battles/:code     # Obtener batalla + timer info
POST /api/votes            # Registrar voto + info votante
GET  /api/sse/:battleId    # Stream tiempo real
POST /api/auth/login       # Autenticación
GET  /api/users           # Gestión de usuarios (admin)
... [ver CONTEXT.md para lista completa]
```

---

## 🎯 Características Técnicas

- **⚡ Ultrarrápido:** Bun runtime, builds en segundos
- **📱 Mobile-optimized:** Responsive, táctil, QR scanning
- **⏱️ Timer inteligente:** Auto-cierre, bloqueo de votos tardíos  
- **🔒 Seguro:** Hashing bcrypt, sesiones JWT, validaciones
- **📊 Real-time:** SSE para updates instantáneos
- **💾 Zero-config DB:** SQLite, sin servidor externo
- **🎨 Modern UI:** Dark theme profesional, gradientes, animaciones

---

## 📖 Documentación Completa

Ver `CONTEXT.md` para:
- Arquitectura detallada
- Esquema de base de datos  
- Flujo completo de usuario
- Plan de mejoras futuras
- Guía de despliegue en producción

---

## 🚀 Deploy en Producción

```bash
# Build optimizado
bun run build

# Variables de entorno requeridas
JWT_SECRET=your-256-bit-secret
NODE_ENV=production

# Ejecutar en servidor
bun start
```

**Recomendado:** VPS con Nginx como reverse proxy + PM2 para process management.

---

## 📄 Licencia

Este proyecto fue desarrollado específicamente para **F*cks News Noticreo** por **Jhonatan Lopez Conde**.

**© 2026 F*cks News Noticreo - Todos los derechos reservados**
