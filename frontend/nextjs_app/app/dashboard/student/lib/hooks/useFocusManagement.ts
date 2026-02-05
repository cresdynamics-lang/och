'use client';

import { useEffect, useRef } from 'react';

export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        lastFocusedElement.current = event.target;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        // Add visual focus indicators
        document.body.classList.add('keyboard-navigation');
      }

      // Escape to return focus to main content
      if (event.key === 'Escape') {
        const mainContent = document.querySelector('main');
        if (mainContent instanceof HTMLElement) {
          mainContent.focus();
        }
      }
    };

    const handleMouseDown = () => {
      // Remove keyboard navigation class on mouse interaction
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return {
    restoreFocus: () => {
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    }
  };
}