/**
 * Utilidades puras del perfil de usuario (RFA02).
 *
 * Van en un `.ts` al lado de la vista y no dentro del `.tsx` por la regla de
 * fast refresh: un archivo con componente no exporta funciones.
 */

/**
 * Iniciales del avatar: las dos primeras palabras del nombre completo.
 *
 * "Ana Quispe Huaman" da "AQ", porque Quispe es el apellido paterno, que es
 * como el usuario escribe y dicta su nombre. La regla es una heuristica y tiene
 * una limitacion conocida: si el usuario tiene segundo nombre, "Jose Luis Ramos
 * Paredes" da "JL" y no "JR". Distinguir un caso del otro exige saber si el
 * segundo nombre existe, y un avatar no vale un parser de nombres.
 */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()

  return (partes[0][0] + partes[1][0]).toUpperCase()
}
