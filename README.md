# SIGME-UTP — Panel Web

Panel de administración del sistema de gestión de estacionamientos de la UTP.
React 19 + TypeScript + Vite + Tailwind 4, con datos simulados por MSW para
poder desarrollarlo sin backend.

## Requisitos

| Herramienta | Versión                                   |
| ----------- | ----------------------------------------- |
| Node.js     | `^20.19` o `>=22.12` (probado en 24.19.0) |
| npm         | 10 o superior                             |

El mínimo lo exige Vite 8. Verificá tu versión con `node -v`.

## Instalación

```bash
git clone <url-del-repo>
cd sigme-utp-panel-web
npm install
```

`npm install` dispara `prepare`, que instala los hooks de husky para que el
lint corra antes de cada commit. Si clonás y no querés los hooks:

```bash
npm install --ignore-scripts
```

## Variables de entorno

Copiá `.env.example` a `.env`. En desarrollo no hace falta cambiar nada: ya
trae los valores por defecto.

```bash
cp .env.example .env    # macOS / Linux
copy .env.example .env  # Windows
```

| Variable            | Por defecto                     | Para qué sirve                                            |
| ------------------- | ------------------------------- | --------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`                          | Base del REST. En producción, la real                     |
| `VITE_SOCKET_URL`   | `ws://localhost:5173/socket.io` | WebSocket de eventos en tiempo real (RNF02)               |
| `VITE_ENABLE_MOCK`  | `true`                          | `false` desactiva MSW y usa la API real                   |
| `VITE_APP_ENV`      | `development`                   | Se muestra en la UI para no confundir demo con producción |

## Correr el proyecto

```bash
npm run dev
```

Abrí **http://localhost:5173**.

### Credenciales de prueba

MSW responde siempre el mismo administrador, sin importar qué se escriba:

```
Usuario:     admin
Contraseña:  utp2026
```

La sesión se guarda en `localStorage` bajo `sigme-sesion` y dura 8 horas
(RNF05). Para volver al login: botón **Cerrar sesión** del sidebar, o borrar esa
clave en DevTools → Application → Local Storage.

## Comandos

| Comando                 | Qué hace                               |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                 |
| `npm run build`         | Compila a `dist/`                      |
| `npm run preview`       | Sirve `dist/` como en producción       |
| `npm test`              | Tests (Vitest)                         |
| `npm run test:watch`    | Tests en modo watch                    |
| `npm run test:coverage` | Tests con cobertura                    |
| `npm run typecheck`     | `tsc` sin emitir                       |
| `npm run lint`          | oxlint                                 |
| `npm run lint:fix`      | oxlint corrigiendo lo que puede        |
| `npm run format`        | Prettier                               |
| `npm run format:check`  | Verifica formato sin escribir          |
| `npm run mock:init`     | Regenera `public/mockServiceWorker.js` |

Antes de dar por terminado:

```bash
npm run typecheck && npm run lint && npm test
```

## Estructura

```
src/
  app/          rutas, guards, layouts, configuracion de navegacion
  components/
    ui/         design system, sin dominio
    shared/     piezas reusables que ya saben de SIGME
    layout/     menu, cabecera, estructura de pagina
  features/     un dominio por carpeta, autosuficiente
  lib/          utilidades puras: cn, formatters, cliente HTTP, hooks, tipos
  mocks/        MSW: handlers y fixtures
  styles/       globals.css, tokens UTP
```

Las reglas de modularidad están en **[AGENTS.md](./AGENTS.md)**. Leelo antes de
escribir código: ahí está el porqué de cada decisión.

## Estado actual

- **Tres vistas terminadas**: la lista de usuarios (RFA01), su perfil con el
  historial de accesos y reservas (RFA02) y el historial global de accesos
  (RFA07). El resto de secciones del menú sigue como `PlaceholderPage`. Lo que ya
  está terminado en todas es lo que comparten: design system, tokens UTP, layout
  con menú, sesión, guards y rutas protegidas.
- **Un solo rol** en el MVP: `ADMINISTRADOR` (RFA09).
- **1 cochera con 8 plazas.** RNF11 pide que nada quede amarrado a una sola
  cochera.
- **Los datos vienen de MSW.** Al entrar la API real, se borra `src/mocks/` y se
  pone `VITE_ENABLE_MOCK=false`: ningún componente cambia.
