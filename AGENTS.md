# AGENTS.md — SIGME-UTP Panel Web

Reglas del panel de administration. Leer antes de tocar codigo. Si una regla
contradice un requerimientos (RFA/RNF), gana el requerimiento y se actualiza
este archivo.

## Instalacion

Node `^20.19.0 || >=22.12.0` (lo exige Vite 8), luego `npm install`. El
detalle completo, las variables de entorno y las credenciales del mock estan en
el [README](./README.md). No los dupliques aqui: si divergen, el README es el
que se lee primero.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run typecheck  # tsc -b, sin emitir. Debe salir en 0.
npm run lint       # oxlint. Debe salir en 0 errores.
npm test           # vitest run
npm run build      # tsc -b && vite build
```

Antes de dar por terminado: `npm run typecheck && npm run lint && npm test`.

## Donde va cada cosa

| Carpeta                  | Que va ahi                                                     | Que NO va ahi                                 |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| `src/lib`                | Utilidades puras: `cn`, formatters, cliente HTTP, hooks, tipos | JSX, nada de dominio                          |
| `src/components/ui`      | Primitivas del design system                                   | Palabras del dominio (plaza, reserva, sensor) |
| `src/components/shared`  | Piezas reusables que ya saben de SIGME                         | Logica de fetching                            |
| `src/components/layout`  | Menu, cabecera, estructura de pagina                           | Decisiones de sesion o de rol                 |
| `src/app`                | Rutas, guards, layouts y configuracion de navegacion           | Vistas de negocio                             |
| `src/features/<dominio>` | Todo lo de un dominio: vistas, api, store, tests               | Imports de otro dominio                       |

`src/features/<dominio>` es **autosuficiente**: no se importa entre dominios. Si
dos dominios necesitan lo mismo, esa pieza sube a `components/shared` o a
`components/ui`, y ahi se decide cual de las dos corresponde.

## Reglas que no se negocian

1. **Una sola fuente de verdad para la navegacion.** Todo menu, permiso y titulo
   sale de `src/app/navItems.tsx`. Nunca se escribe una lista de items en una
   vista.

2. **Los paths de `src/app/routes.tsx` estan congelados.** Se anade una ruta una
   sola vez, al empezar la historia. Nadie reordena ni cambia un path existente.
   Los paths no coinciden con las secciones del menu: por ejemplo
   `/contenido/faq` cuelga del grupo Contenido y `/usuarios/:id` no aparece en el
   menu. Eso es intencional.

3. **Ningun componente hace `fetch`.** Todo pasa por `src/lib/api-client.ts` y las
   funciones de `features/<dominio>/*.api.ts`. Asi el cambio de MSW a la API real
   no toca ninguna vista.

4. **Un archivo con componente no exporta funciones.** Si un `.tsx` necesita
   exportar una funcion o un mapa de estilos, eso va a un `.ts` al lado
   (`estadoPlaza.ts`, `avisos-context.ts`). Es lo que mantiene el fast refresh.

5. **Nada de logica de negocio en un `useEffect` con `setState`.** Si el estado
   depende de otro valor, se deriva durante el render. Para stores externos
   (como `matchMedia`) se usa `useSyncExternalStore`.

6. **El color nunca es el unico portador de significado.** Todo estado de plaza
   lleva icono y texto. La tinta de un texto sobre fondo de color se elige para
   pasar 4.5:1; por eso los textos usan las variantes `-ink`, no el color de
   marca.

7. **La validacion destructiva se centraliza.** Si una accion pide motivo, se
   usa `ConfirmDialog`, que ya exige 10 caracteres y avisa que queda en el audit
   log. Cada vista no reimplementa esa regla.

8. **Lo que decide el servidor no se recalcula en el front.** El limite de
   intentos del login (RNF07) y la expiracion del token (RNF05) se muestran tal
   cual llegan. Recalcularlo permitiria saltarselo recargando la pagina.

## Convenciones

- Codigo, comentarios y textos de interfaz **sin tildes ni eneses**. Se evita el
  problema de codificacion entre editors y el motor de busqueda de la app movil.
- Nombres de dominio en espanol y en el vocabulario de la matriz: `RFA01`,
  `usuario`, `cochera`, `plaza`, `sensor`, `reserva`, `auditoria`.
- Un archivo exporta lo que others necesitan y nada mas. Si exportas algo "por
  si acaso", no lo exportes.
- Comentarios que explican **por que**, no que hace el codigo. Si el por que es
  una regla del requerimiento, se cita el codigo: `// RFA03 pide 4 estados`.
- Tipos del dominio en `src/lib/types/dominio.ts`, no duplicados en la vista.

## Al agregar una vista nueva

1. Si es una seccion del menu: agrega el item a `src/app/navItems.tsx` con su
   `path`, `rfa`, `grupo` y `roles`. El test de `navItems` te va a exigir el orden
   correcto.
2. Registra el path en `src/app/routes.tsx` dentro del bloque `ProtectedLayout`.
3. Si la accion es destructiva o pide motivo, reutiliza `ConfirmDialog`.
4. Agrega el test de la regla que la vista debe cumplir, no solo un test de
   render.

## Estados del proyecto

- Un solo rol en el MVP: `ADMINISTRADOR` (RFA09). El filtro por rol ya esta
  implemented, asi que agregar `ADMINISTRADOR_GENERAL` es tocar el union `Rol` y
  el `roles` de los items, no reescribir el menu.
- 1 cochera con 8 plazas. RNF11 pide que el sistema no quede amarrado a una
  cochera ni a un numero fijo de plazas: por eso `PlazaGrid` acepta listas de
  varias y el grid no se estira para llenar el ancho.
- `@tanstack/react-table` esta instalada pero en la version 9, que reescribio la
  API. `DataTable` no la usa a proposito: las vistas ordenan y filtran en el
  servidor. No la uses sin confirmar la API de la version instalada.
- Se quitaron los scripts `test:e2e` y `types:api` porque sus dependencias
  (`@playwright/test`, `openapi-typescript`) y sus archivos de apoyo
  (`playwright.config.ts`, `openapi.yaml`) no existen. Un script que falla es
  peor que un script ausente. Cuando los necesites: instala la dependencia y
  vuelve a agregar el script.
