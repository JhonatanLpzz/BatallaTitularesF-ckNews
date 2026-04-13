# Product Requirements Document (PRD)
# Batalla de Titulares — F*cks News Noticreo

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Desarrollado por:** Jhonatan Lopez Conde — Bogotá, Colombia  
**Cliente:** F*cks News Noticreo

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Producto
Sistema de votación interactiva en tiempo real para la **Batalla de Titulares** de **F*cks News Noticreo**, comediantes colombianos. Permite crear competencias donde los participantes compiten con titulares absurdos y el público vota en vivo escaneando un código QR desde su dispositivo móvil.

### 1.2 Objetivos del Producto
- **Primario:** Facilitar votación en tiempo real durante shows en vivo
- **Secundario:** Crear experiencia interactiva entre comediantes y audiencia  
- **Terciario:** Recopilar datos de participación del público

### 1.3 Métricas de Éxito
- **Participación:** >70% de la audiencia vota por batalla
- **Usabilidad:** Proceso de votación <30 segundos
- **Confiabilidad:** 99.9% uptime durante shows en vivo
- **Performance:** Actualizaciones en tiempo real <2 segundos

---

## 2. Contexto y Justificación

### 2.1 Problema a Resolver
Los shows de comedia interactivos necesitan sistemas de votación rápidos, intuitivos y confiables que no requieran aplicaciones adicionales ni registros complejos para el público.

### 2.2 Audiencia Objetivo
- **Usuarios Primarios:** Público asistente a shows (18-45 años, móvil-nativos)
- **Usuarios Secundarios:** Administradores de F*cks News (comediantes, staff técnico)
- **Contexto de Uso:** Teatros, bares, eventos en vivo, iluminación reducida

### 2.3 Restricciones
- **Técnicas:** Sin instalación de apps, compatible con cualquier dispositivo
- **Operativas:** Funcionar sin internet estable (modo offline local)
- **Presupuesto:** Solución costo-efectiva usando tecnologías open source

---

## 3. Funcionalidades del Producto

### 3.1 Funcionalidades Core

#### 3.1.1 Sistema de Votación Pública ⭐
**Prioridad:** P0 (Crítica)
- **Descripción:** Votación sin registro vía QR scanning
- **Flujo de Usuario:**
  1. Escanear QR → Llegar a `/votar/:code`
  2. Ingresar nombre (obligatorio) + documento/celular (opcional)
  3. Seleccionar titular favorito → Confirmación
  4. Ver resultados actualizados en tiempo real
- **Validaciones:** Un voto por dispositivo (fingerprint único)
- **Criterios de Aceptación:**
  - [ ] QR funcional desde cualquier app de cámara
  - [ ] Formulario responsive en móvil
  - [ ] Prevención de votos duplicados
  - [ ] Confirmación visual de voto registrado

#### 3.1.2 Panel de Administración ⭐
**Prioridad:** P0 (Crítica)
- **Descripción:** Gestión completa de batallas por administradores
- **Funcionalidades:**
  - Crear batallas (título, descripción, participantes, timer)
  - Activar/desactivar batallas
  - Generar códigos QR únicos
  - Monitor de resultados en tiempo real
  - Gestión de usuarios administradores
- **Criterios de Aceptación:**
  - [ ] CRUD completo de batallas
  - [ ] QR generation automática
  - [ ] Dashboard con métricas en vivo
  - [ ] Multi-admin support con roles

#### 3.1.3 Timer Automático ⭐
**Prioridad:** P0 (Crítica)
- **Descripción:** Control temporal de batallas con auto-cierre
- **Características:**
  - Duración configurable (ej: 5 minutos)
  - Countdown visible MM:SS
  - Auto-cierre al expirar
  - Bloqueo de votos tardíos
- **Criterios de Aceptación:**
  - [ ] Timer sincronizado servidor-cliente
  - [ ] UI countdown prominente
  - [ ] Cierre automático confiable
  - [ ] Estados clara (activa/expirada)

#### 3.1.4 Actualizaciones en Tiempo Real ⭐
**Prioridad:** P0 (Crítica)
- **Descripción:** Resultados y countdown vía Server-Sent Events
- **Implementación:** SSE streams por batalla
- **Datos en Vivo:**
  - Porcentajes de votación
  - Countdown timer
  - Número total de votos
  - Estado de la batalla
- **Criterios de Aceptación:**
  - [ ] Updates instantáneos (<2s latencia)
  - [ ] Reconexión automática en pérdida de conexión
  - [ ] Sincronización multi-dispositivo
  - [ ] Performance estable con 100+ usuarios concurrentes

### 3.2 Funcionalidades Secundarias

#### 3.2.1 Gestión de Usuarios Admin 🔸
**Prioridad:** P1 (Alta)
- Multiple administradores con CRUD completo
- Cambio de credenciales
- Setup automático primer admin

#### 3.2.2 Datos de Votantes 🔸
**Prioridad:** P1 (Alta)
- Captura opcional de documento/teléfono
- Almacenamiento para análisis posterior
- Exportación de resultados (futura)

#### 3.2.3 Branding Personalizado 🔸
**Prioridad:** P1 (Alta)
- Logo F*cks News integrado
- Paleta de colores corporativa
- Participantes predeterminados (Camilo Pardo, Camilo Sanchez)

### 3.3 Funcionalidades Futuras

#### 3.3.1 Analytics Avanzado 🔹
**Prioridad:** P2 (Media)
- Estadísticas históricas
- Métricas de participación
- Reportes por evento

#### 3.3.2 Mejoras de UX 🔹
**Prioridad:** P2 (Media)
- Modo fullscreen para proyección
- Tema oscuro
- Notificaciones push

---

## 4. Especificaciones Técnicas

### 4.1 Arquitectura del Sistema

#### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS 3 + shadcn/ui
- **Router:** React Router v7
- **State Management:** React Context

#### Backend
- **Runtime:** Bun (JavaScript runtime)
- **Framework:** Fastify 5
- **Database:** SQLite + Drizzle ORM
- **Real-time:** Server-Sent Events (SSE)
- **Authentication:** JWT + Bcrypt

#### Infrastructure
- **Development:** Local Bun server
- **Production:** VPS + Nginx reverse proxy
- **Database:** File-based SQLite (no external dependencies)

### 4.2 Esquema de Base de Datos

```sql
-- Administradores del sistema
admin_users (id, username, password_hash, created_at)

-- Sesiones de administradores  
sessions (id, token, user_id, expires_at)

-- Batallas/competencias
battles (id, code, title, description, status, duration_minutes, activated_at, created_at)

-- Participantes por batalla
participants (id, battle_id, name, headline, avatar_url, color, position)

-- Votos del público
votes (id, battle_id, participant_id, voter_name, voter_document, voter_phone, fingerprint, voted_at)
```

### 4.3 API Endpoints

#### Públicos
```
GET  /api/battles/:code          # Detalle batalla + timer
POST /api/votes                  # Registrar voto
GET  /api/votes/check/:code?fp=  # Verificar voto existente
GET  /api/sse/:battleId          # SSE stream
```

#### Protegidos (Admin)
```
GET/POST    /api/battles         # CRUD batallas
PATCH       /api/battles/:id/status # Activar/desactivar
DELETE      /api/battles/:id/votes  # Reiniciar votos
GET         /api/battles/:code/qr   # Generar QR
GET/POST    /api/users           # Gestión administradores
```

---

## 5. Diseño y UX

### 5.1 Paleta de Colores F*cks News

| Color | Valor | Uso |
|-------|-------|-----|
| **Primary Blue** | `#1a56a8` | Botones, enlaces, branding |
| **Accent Red** | `#dc2626` | Alertas, ganador, CTAs |
| **Background** | `#fafafa` | Fondo general |
| **Card** | `#ffffff` | Contenedores |
| **Text** | `#141a26` | Texto principal |

### 5.2 Componentes UI
- **Button:** Estados hover/active, variantes primary/secondary
- **Card:** Bordes redondeados, sombras sutiles
- **Badge:** Indicadores de estado, contadores
- **Dialog:** Modales para confirmaciones
- **Input:** Campos de formulario responsivos

### 5.3 Responsive Design
- **Mobile First:** Optimizado para smartphones
- **Breakpoints:** sm(640px), md(768px), lg(1024px)
- **Touch Targets:** Mínimo 44px para botones
- **QR Scanning:** Compatible con cámaras nativas

---

## 6. Casos de Uso Detallados

### 6.1 UC01: Administrador Crea Batalla
**Actor:** Administrador de F*cks News  
**Precondición:** Usuario autenticado en `/admin`

**Flujo Principal:**
1. Click "Nueva Batalla"
2. Completar formulario:
   - Título (ej: "Batalla #5 - Noticias Absurdas")
   - Descripción opcional
   - Duración (ej: 5 minutos)
   - Participantes (pre-llenados: Camilo Pardo, Camilo Sanchez)
3. Guardar como "Draft"
4. Activar batalla → inicia countdown
5. Generar QR para proyectar

**Resultado:** Batalla activa con QR público

### 6.2 UC02: Público Vota en Vivo
**Actor:** Asistente al show  
**Precondición:** Batalla activa, QR visible

**Flujo Principal:**
1. Escanear QR con cámara del móvil
2. Abrir link → llegar a `/votar/:code`
3. Ver información de la batalla + countdown
4. Completar formulario:
   - Nombre (obligatorio)
   - Documento (opcional) 
   - Teléfono (opcional)
5. Seleccionar titular favorito
6. Confirmar voto
7. Ver resultados en tiempo real

**Flujos Alternativos:**
- **6A:** Batalla expirada → mostrar "Votación cerrada"
- **6B:** Ya votó → mostrar resultados únicamente

---

## 7. Criterios de Aceptación

### 7.1 Performance
- [ ] **Carga inicial:** <3 segundos en móvil 3G
- [ ] **Actualizaciones SSE:** <2 segundos latencia
- [ ] **Procesamiento voto:** <1 segundo confirmación
- [ ] **Concurrencia:** Soporte 100+ votantes simultáneos

### 7.2 Usabilidad  
- [ ] **Votación móvil:** Completable en <30 segundos
- [ ] **QR scanning:** Compatible con iOS/Android nativos
- [ ] **Countdown:** Visible y sincronizado en todas las pantallas
- [ ] **Resultados:** Actualizaciones fluidas sin parpadeo

### 7.3 Confiabilidad
- [ ] **Anti-duplicate:** Prevención votos múltiples efectiva
- [ ] **Timer precision:** Variación <5 segundos en auto-cierre
- [ ] **Data persistence:** Sin pérdida de votos en reconexiones
- [ ] **Error handling:** Mensajes claros para errores de red

### 7.4 Seguridad
- [ ] **Admin auth:** Sesiones JWT con expiración
- [ ] **Input validation:** Sanitización de datos de votantes
- [ ] **Rate limiting:** Prevención de spam/ataques
- [ ] **CORS policy:** Restricciones de origen apropiadas

---

## 8. Plan de Implementación

### 8.1 Fases de Desarrollo ✅ COMPLETADO

#### Fase 1: Core Backend (Completado)
- ✅ Setup Bun + Fastify + SQLite
- ✅ Autenticación y gestión usuarios
- ✅ CRUD batallas con timer automático  
- ✅ Sistema de votación + SSE

#### Fase 2: Frontend React (Completado)
- ✅ Componentes UI con TailwindCSS
- ✅ Páginas: Login, Admin, Vote, Results
- ✅ Context para autenticación
- ✅ Hooks para SSE y countdown

#### Fase 3: Integración y UX (Completado)
- ✅ QR generation y scanning
- ✅ Branding F*cks News
- ✅ Responsive design móvil
- ✅ Testing en dispositivos reales

### 8.2 Roadmap Futuro

#### Q2 2026: Analytics y Reporting
- Exportación de resultados (CSV/PDF)
- Dashboard de estadísticas históricas
- Métricas de participación por evento

#### Q3 2026: Experiencia Mejorada  
- Modo fullscreen para proyección
- Tema oscuro / modo presentación
- Notificaciones push para nuevas batallas

#### Q4 2026: Escalabilidad
- Soporte multi-tenant
- API pública para integraciones
- Mobile app nativa (opcional)

---

## 9. Riesgos y Mitigaciones

### 9.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Conexión inestable en venues** | Alta | Alto | Modo offline + sincronización diferida |
| **Concurrencia SSE limits** | Media | Alto | Load testing + connection pooling |
| **QR scanning failures** | Baja | Medio | URLs cortas de respaldo + soporte manual |

### 9.2 Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación |  
|--------|--------------|---------|------------|
| **Baja adopción del público** | Baja | Alto | UX testing + flujo simplificado |
| **Cambios en formato de show** | Media | Medio | Arquitectura flexible + configuración |
| **Competencia con soluciones existentes** | Baja | Bajo | Funcionalidades específicas para F*cks News |

---

## 10. Métricas y KPIs

### 10.1 Métricas de Producto
- **Engagement Rate:** % audiencia que vota por show
- **Completion Rate:** % usuarios que completan votación
- **Session Duration:** Tiempo promedio en la plataforma
- **Return Usage:** Administradores que reutilizan el sistema

### 10.2 Métricas Técnicas
- **Response Time:** Latencia promedio de API calls
- **SSE Reliability:** % uptime de conexiones en tiempo real
- **Error Rate:** % requests fallidos durante shows
- **Mobile Performance:** Core Web Vitals en dispositivos móviles

### 10.3 Dashboard de Monitoreo
- Votos por minuto en vivo
- Dispositivos conectados simultáneamente  
- Distribución geográfica de votantes
- Performance del servidor durante picos

---

## 11. Documentación Técnica

### 11.1 Setup y Despliegue
```bash
# Desarrollo
bun install
bun run dev  # Frontend + Backend paralelo

# Producción  
bun run build
NODE_ENV=production bun start
```

### 11.2 Variables de Entorno
```env
JWT_SECRET=your-256-bit-secret
NODE_ENV=production
DATABASE_URL=./data/battles.db
```

### 11.3 Estructura de Directorios
```
batalla-titulares/
├── server/           # Backend Fastify
│   ├── index.ts      # Entry point
│   ├── db/           # Database schema + connection
│   └── routes/       # API endpoints
├── src/              # Frontend React  
│   ├── pages/        # Componentes de página
│   ├── components/   # UI components reutilizables
│   ├── hooks/        # Custom hooks (SSE, countdown)
│   └── context/      # Estado global (Auth)
└── public/           # Assets estáticos
```

---

## 12. Conclusiones

### 12.1 Estado Actual: ✅ PRODUCTO COMPLETAMENTE FUNCIONAL

El sistema **Batalla de Titulares** ha sido desarrollado completamente y está listo para uso en producción durante shows en vivo de F*cks News Noticreo.

**Funcionalidades Implementadas:**
- ✅ Sistema completo de votación en tiempo real
- ✅ Panel de administración con gestión de usuarios
- ✅ Timer automático con countdown visual
- ✅ Interfaz móvil optimizada con QR scanning
- ✅ Branding personalizado F*cks News
- ✅ Arquitectura escalable y mantenible

### 12.2 Valor Entregado
- **Para F*cks News:** Herramienta profesional que mejora la interacción con su audiencia
- **Para el Público:** Experiencia intuitiva y divertida de participación
- **Para el Negocio:** Datos de participación y engagement measurable

### 12.3 Próximos Pasos Recomendados
1. **Testing en producción** durante próximo show
2. **Recopilación feedback** de comediantes y audiencia  
3. **Optimizaciones** basadas en métricas reales de uso
4. **Roadmap** de mejoras según necesidades emergentes

---

**© 2026 F*cks News Noticreo - Desarrollado por Jhonatan Lopez Conde, Bogotá, Colombia**
