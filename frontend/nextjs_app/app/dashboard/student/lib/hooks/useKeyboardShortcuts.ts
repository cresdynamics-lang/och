'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // TODO: Open search modal
        console.log('Search shortcut triggered');
      }

      // Navigation shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            router.push('/dashboard/student');
            break;
          case '2':
            event.preventDefault();
            router.push('/dashboard/student/missions');
            break;
          case '3':
            event.preventDefault();
            router.push('/dashboard/student/curriculum');
            break;
          case '4':
            event.preventDefault();
            router.push('/dashboard/student/coaching');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}