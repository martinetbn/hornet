// Hook for handling application keyboard shortcuts

import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onSave?: () => void;
  onCloseTab?: () => void;
}

export function useKeyboardShortcuts({ onSave, onCloseTab }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      // Ctrl/Cmd + W: Close tab
      else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        onCloseTab?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onCloseTab]);
}
