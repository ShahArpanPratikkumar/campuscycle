import "server-only";

/**
 * Escapes user input before it is compiled into a `RegExp`.
 *
 * A raw search term like `c++` or `(casio)` would otherwise be interpreted as a
 * regex pattern — at best returning nothing, at worst allowing catastrophic
 * backtracking. Escaping keeps `?q=` a literal substring search.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
