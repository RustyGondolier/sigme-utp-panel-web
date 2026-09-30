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

El login de MSW valida contra las cuentas sembradas, así que no cualquier
combinación entra: cada una tiene la misma contraseña temporal.

| Usuario    | Contraseña | Estado    | Nota                      |
| ---------- | ---------- | --------- | ------------------------- |
| `admin`    | `utp2026`  | Activo    | La cuenta en sesión (E2)  |
| `mgomez`   | `utp2026`  | Activo    | Tiene reserva activa (E3) |
| `rsoto`    | `utp2026`  | Activo    | Se puede desactivar       |
| `lparedes` | `utp2026`  | Bloqueado | Al iniciar sesión da 403  |

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

- **Cuatro vistas terminadas**: la lista de usuarios (RFA01), su perfil con el
  historial de accesos y reservas (RFA02), el historial global de accesos
  (RFA07) y la gestión de cuentas de administrador (RFA12). El resto de secciones
  del menú sigue como `PlaceholderPage`. Lo que ya está terminado en todas es lo
  que comparten: design system, tokens UTP, layout con menú, sesión, guards y
  rutas protegidas.
- **RFA12 es la primera vista que escribe.** Sus mutaciones son el patrón a
  seguir: la vista no hace `fetch`, la mutación invalida la consulta y el error
  del servidor se muestra con `useAvisos`. Como hay escritura, los mocks ya no
  son solo de lectura: `src/mocks/estado.ts` guarda el estado vivo y
  `setup.ts` lo reinicia antes de cada test.
- **Un solo rol** en el MVP: `ADMINISTRADOR` (RFA09).
- **1 cochera con 8 plazas.** RNF11 pide que nada quede amarrado a una sola
  cochera.
- **Los datos vienen de MSW.** Al entrar la API real, se borra `src/mocks/` y se
  pone `VITE_ENABLE_MOCK=false`: ningún componente cambia.

### RFA12: lo que NO quedó implementado

Léase antes de retomar esta historia o de usarla en una demo. La pantalla de
cuentas está completa en su flujo (listar, crear, editar, desactivar con motivo,
reactivar), pero hay puntos del requerimiento que el mock no puede sostener y
otros que quedaron fuera a propósito.

| #   | Qué pide el requerimiento                                                  | Por qué no está                                                                                                                                                                                                                   | Dónde tocarlo                                         |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Paso 3: el administrador ingresa la contraseña temporal de la cuenta nueva | `POST /api/cuentas-admin` recibe `contrasena` pero **no la registra**: el login compara contra `CLAVES_ADMIN_MOCK`, que es estático. Una cuenta creada desde la pantalla existe en la lista pero **no puede iniciar sesión**.     | `handlers.ts`: guardar la clave en el alta            |
| 2   | Criterio 6: desactivar una cuenta invalida su sesión activa                | No hay revocación de token en el mock. Peor: `GET /api/auth/sesion` devuelve siempre la sesión sembrada de `admin`, así que **recargar la página devuelve la identidad de `admin`** aunque se haya entrado con `mgomez`.          | `handlers.ts`: sesión viva en `estado.ts`             |
| 3   | Pasos 3 y 5: asignar y cambiar el **rol**                                  | Con un solo rol en el MVP (RFA09) se muestra como texto fijo; no hay control. La API ya acepta `rol` en alta y edición.                                                                                                           | `CuentasAdminPage.tsx`: `Select` cuando exista el rol |
| 4   | E3: no desactivar una cuenta con **reserva de plaza activa**               | `CuentaAdmin.reservaActiva` es un **booleano sembrado**, no la reserva real: en este modelo las cuentas del panel no reservan plazas (las reservan los usuarios de la app móvil).                                                 | Requiere el backend; el campo está listo              |
| 5   | E4: no desactivar la **última** cuenta activa                              | Implementada en la vista y en el handler, y cubierta por tests, pero **no se puede provocar desde la pantalla**: `admin` siempre está activa, así que E2 (cuenta propia) gana siempre. Solo se ve falseando la respuesta del GET. | `cuentas.api.test.ts` la cubre                        |
| 6   | "Todas las acciones deben quedar registradas"                              | El audit log registra acción, elemento y motivo, pero **no el valor anterior ni el nuevo**. Una edición de correo queda registrada con el correo **viejo** (`handlers.ts` usa `cuenta.correo`, el previo al cambio).              | `handlers.ts`: guardar `detalle`                      |
| 7   | —                                                                          | **Sin filtros ni paginación** en la lista (decisión tomada: el paso 2 pide la lista completa y son pocas cuentas).                                                                                                                | `cuentas.api.ts` si hace falta                        |
| 8   | —                                                                          | **No hay cambio de contraseña en el primer ingreso.** El texto del modal describe el proceso, pero el panel no tiene esa pantalla: no está en el alcance de RFA12.                                                                | Historia aparte                                       |
| 9   | —                                                                          | **La vista del audit log (RFA10) no existe.** RFA12 solo escribe entradas; la pantalla es de otra historia (Dev C).                                                                                                               | `features/auditoria/`                                 |

Aparte, y esperable en MSW: las cuentas creadas y el audit log viven **en
memoria** (`src/mocks/estado.ts`), así que se pierden al recargar la página.
Reiniciar el dev server deja las cuatro cuentas sembradas otra vez.
