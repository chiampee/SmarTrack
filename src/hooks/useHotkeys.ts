import { useEffect } from 'react';

export function useHotkeys(bindings: Record<string, (e: KeyboardEvent) => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [e.metaKey || e.ctrlKey ? 'Mod+' : '', e.shiftKey ? 'Shift+' : '', e.key.toLowerCase()].join('');
      const cb = bindings[key];
      if (cb) {
        e.preventDefault();
        cb(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bindings]);
} 