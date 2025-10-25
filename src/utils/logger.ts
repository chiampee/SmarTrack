/**
 * logger.ts
 * -------------
 * Tiny utility for consistent error reporting across the client code-base.
 *
 * • Accepts a `scope` string (typically "module.function") so logs are searchable.
 * • Accepts any thrown value – prints message & stack when it is an Error instance.
 * • Silences all output when Vite is running in test mode to keep test output clean.
 */
export function logError(scope: string, error: unknown) {
  if (import.meta.env.MODE === 'test') return; // silence during tests
  if (error instanceof Error) {
    console.error(`[${scope}]`, error.message, error.stack);
  } else {
    console.error(`[${scope}]`, error);
  }
} 