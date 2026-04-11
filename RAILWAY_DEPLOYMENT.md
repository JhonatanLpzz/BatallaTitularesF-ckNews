# 🚂 Railway Deployment Guide - Batalla de Titulares

## 🚀 Pasos para Deploy en Railway

### **1. Preparación del Proyecto** ✅
```bash
# Ya está listo con:
- railway.json configurado
- server/config.ts con variables de entorno
- .env.example con todas las variables
- Dockerfile optimizado para Railway
- package.json con scripts correctos
```

### **2. Crear Cuenta en Railway**
1. Ve a **https://railway.app**
2. **"Login with GitHub"** → autorizar acceso
3. Dashboard estará listo para deployments

### **3. Deploy desde GitHub**
1. **"New Project"** → **"Deploy from GitHub repo"**
2. Selecciona: **`JhonatanLpzz/BatallaTitularesF-ckNews`**
3. Railway auto-detecta: **Bun project** ✅
4. **Deploy automático** iniciará inmediatamente

### **4. Configurar Variables de Entorno** (CRÍTICO)

En Railway Dashboard → tu proyecto → **"Variables"**:

```bash
# === OBLIGATORIAS ===
NODE_ENV=production
JWT_SECRET=967f6e74c3590a39576681beacee7af63fdbac1de0ff50608e4b45c0513682c3
CORS_ORIGIN=${{RAILWAY_STATIC_URL}}

# === SERVIDOR ===
PORT=${{PORT}}
HOST=0.0.0.0
LOG_LEVEL=info

# === RATE LIMITING ===
RATE_LIMIT_VOTES=10
RATE_LIMIT_WINDOW=300000
RATE_LIMIT_ADMIN=100

# === SESIONES ===
SESSION_DURATION=86400000
SESSION_CLEANUP_INTERVAL=3600000

# === VOTACIÓN ===
MAX_VOTERS_PER_BATTLE=1000
VOTE_TIMEOUT_MS=30000

# === FEATURES ===
ENABLE_ANALYTICS=true
ENABLE_VOTE_EXPORT=false
```

**⚡ Tip:** `${{RAILWAY_STATIC_URL}}` y `${{PORT}}` son variables automáticas de Railway

### **5. SQLite Persistence Setup** ✅

Railway volumen persistente ya configurado:

1. **✅ Volume creado** → Mount Path: `/storage/`
2. **✅ Variables configuradas:**
   - `DB_PATH=/storage/data/batalla.db`
   - `DB_BACKUP_PATH=/storage/data/backups`
3. **Auto-creation:** App crea directorios automáticamente
4. **Persistence:** Base de datos sobrevive redeploys

### **6. Custom Domain (Opcional)**
```bash
# Railway genera: https://tu-app.up.railway.app
# Para dominio custom:
Settings → Custom Domain → batalla.fucksnews.com
```

---

## ⚡ Deploy Automático

### **Build Process**
```bash
# Railway ejecuta automáticamente:
1. bun install          # Instalar dependencias
2. bun run build        # Build frontend (Vite)
3. bun start           # Iniciar servidor
```

### **Auto-Deploy**
- **Push a GitHub** → **Deploy automático** en Railway
- **Rollback** disponible en dashboard
- **Logs en tiempo real** durante deploy

---

## 🔍 Verificación Post-Deploy

### **1. Health Check**
```bash
# Debe responder 200 OK:
curl https://tu-app.up.railway.app/health

# Respuesta esperada:
{
  "status": "healthy",
  "timestamp": "2026-04-10T22:15:30.123Z",
  "environment": "production"
}
```

### **2. Flujo Completo**
```bash
# 1. Landing page
https://tu-app.up.railway.app/

# 2. Admin setup (primera vez)  
https://tu-app.up.railway.app/login
→ Crear primer admin automáticamente

# 3. Panel admin
https://tu-app.up.railway.app/admin
→ Login con credenciales creadas

# 4. Crear batalla de prueba
→ 2 participantes + timer 1 min

# 5. Generar QR + probar votación
→ Scan QR desde phone → voting flow completo
```

---

## 📊 Monitoring en Railway

### **Built-in Metrics**
- **CPU/Memory usage** en tiempo real
- **Request logs** con timestamps
- **Error tracking** automático
- **Deploy history** con rollbacks

### **Logs Útiles**
```bash
# Ver logs en Railway Dashboard:
- Build logs: errores durante deployment
- Runtime logs: errores de servidor
- Access logs: requests HTTP

# Filtros útiles:
- "level":50 → errores críticos
- "POST /api/votes" → votación logs  
- "SSE" → real-time connection logs
```

---

## ⚠️ Troubleshooting Common Issues

### **Build Fails**
```bash
# Error: "Bun not found"
Solución: Verificar package.json → "type": "module"

# Error: "Cannot find module"  
Solución: Verificar imports en server/config.ts
```

### **Runtime Errors**
```bash
# Error: "JWT_SECRET missing"
Solución: Verificar variables de entorno en Railway

# Error: "CORS blocked"
Solución: Verificar CORS_ORIGIN=${{RAILWAY_STATIC_URL}}

# Error: "Database locked"
Solución: Verificar volumen persistente mounted correctamente
```

### **SSE Not Working**
```bash
# Error: "Connection timeout"
Solución: Railway soporta WebSockets/SSE nativo ✅
Verificar: no hay reverse proxy bloqueando
```

---

## 💰 Costos Railway

### **Free Tier**
- **$5 crédito/mes** gratis
- **Suficiente para:** desarrollo + testing
- **Límites:** 500 horas/mes, shared CPU

### **Hobby Plan** ($5/mes)
- **CPU:** 0.5 vCPU guaranteed  
- **RAM:** 512MB guaranteed
- **Storage:** 1GB included
- **Perfecto para:** shows en vivo con <100 votantes

### **Pro Plan** ($20/mes)
- **CPU:** 1 vCPU guaranteed
- **RAM:** 1GB guaranteed  
- **Storage:** 10GB included
- **Para:** events grandes con >200 votantes

---

## 🔄 CI/CD Workflow

### **Development → Production**
```bash
# 1. Local development
bun run dev → test changes

# 2. Push to GitHub  
git push → triggers Railway deploy

# 3. Auto-deployment
Railway builds + deploys automatically

# 4. Live in ~2-3 minutes
https://tu-app.up.railway.app
```

### **Hotfixes**
```bash
# Emergency fixes:
1. Fix code locally
2. git commit + git push  
3. Railway auto-deploys in 2min
4. Or rollback via Railway dashboard
```

---

## 🎯 Performance Optimizations

### **Already Implemented**
- ✅ **Bun runtime** (3x faster than Node)
- ✅ **Vite build** (optimized bundles)
- ✅ **SQLite** (no external DB latency)
- ✅ **Static assets** served efficiently
- ✅ **Rate limiting** prevents spam

### **Railway-Specific**
- **Edge locations:** Railway auto CDN
- **HTTP/2:** Enabled by default  
- **Compression:** gzip/brotli automatic
- **Keep-alive:** Connection pooling

---

## 🚨 Pre-Launch Checklist

### **Before First Show**
- [ ] **Deploy successful** → app loads correctly
- [ ] **Admin login** → crear primer administrador  
- [ ] **Create test battle** → 2 participants, 1min timer
- [ ] **QR generation** → código válido
- [ ] **Mobile voting** → iPhone + Android test
- [ ] **Real-time updates** → results update live
- [ ] **Timer accuracy** → auto-close works
- [ ] **Volume persistence** → database survives restarts

### **Day of Show**
- [ ] **Backup plan** → local server ready si falla
- [ ] **Multiple admin logins** → 2+ devices ready
- [ ] **QR pre-generated** → printed copies backup
- [ ] **Monitor logs** → Railway dashboard open
- [ ] **Hotspot ready** → 4G backup internet

---

## 📞 Soporte Railway

### **Documentation**
- **Docs:** https://docs.railway.app
- **Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

### **Emergency Contact**
- **Twitter:** @Railway
- **Email:** team@railway.app  
- **Response time:** Usually <2 hours

---

## ✅ RESUMEN

**Railway está configurado y listo para:**
1. **Auto-deploy** desde GitHub pushes
2. **Bun runtime** nativo optimizado  
3. **Environment variables** completas
4. **SQLite persistence** con volumen
5. **Health monitoring** integrado
6. **Rollback** instantáneo si needed

**Next step:** Push código → Railway deploy automático → test completo → **listo para shows! 🎭**
