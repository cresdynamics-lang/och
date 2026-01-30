'use client';

import { useEffect } from 'react';

export const SkipNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        // Focus management for skip links
        const skipLink = document.querySelector('[data-skip-to="main-content"]') as HTMLElement;
        if (skipLink && document.activeElement === skipLink) {
          e.preventDefault();
          const mainContent = document.querySelector('[data-main-content]') as HTMLElement;
          mainContent?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
      <a
        href="#main-content"
        data-skip-to="main-content"
        className="bg-och-defender-blue text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <a
        href="#sidebar"
        className="bg-och-defender-blue text-white px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white ml-2"
      >
        Skip to navigation
      </a>
    </div>
  );
};
