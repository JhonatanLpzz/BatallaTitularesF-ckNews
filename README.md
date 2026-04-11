# Batalla de Titulares — F*ck News

Aplicacion de votacion en vivo para la **Batalla de Titulares** de F*ck News, comediantes colombianos.

Desarrollado por **Jhonatan Lopez Conde** — Bogota, Colombia.

## Stack

- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS + shadcn/ui + Framer Motion
- **Backend**: Fastify + Drizzle ORM + better-sqlite3
- **QR**: qrcode (generacion de codigos QR)
- **Real-time**: Server-Sent Events (SSE)
- **DB**: SQLite (archivo local, sin servidor externo)

## Desarrollo

```bash
npm install
npm run dev
```

Esto inicia:
- **Frontend** (Vite): http://localhost:5173
- **API** (Fastify): http://localhost:3001

## Produccion

```bash
npm run build
npm start
```

## Flujo

1. **Admin** (`/admin`): Crea una batalla con 2+ participantes y sus titulares
2. **Activar**: Cambia el estado a "En Vivo"
3. **QR**: Muestra el QR en pantalla para que el publico escanee
4. **Votar** (`/votar/:code`): El publico vota desde su celular
5. **Resultados** (`/resultados/:code`): Muestra votos en tiempo real con graficas animadas
