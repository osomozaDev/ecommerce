// Stub de "server-only" para tests: el paquete real lanza un error al
// importarse fuera de React Server Components. En Vitest (Node puro) se
// sustituye por este módulo vacío vía alias en vitest.config.ts.
export {};
