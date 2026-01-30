import { useCallback } from 'react';

interface AuditMetadata {
  [key: string]: any;
}

export const useAuditLog = (userId: string) => {
  const logAction = useCallback(
    (action: string, metadata?: AuditMetadata) => {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        metadata: metadata || {},
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        ipAddress: 'masked', // Would be populated server-side
        sessionId: 'session-' + Date.now() // Would be from auth context
      };

      // In production, this would send to audit service
      console.log('AUDIT:', JSON.stringify(auditEntry, null, 2));

      // Could also send to analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
          custom_parameter_1: userId,
          ...metadata
        });
      }

      // Store in localStorage for debugging (would be removed in production)
      if (typeof window !== 'undefined') {
        const auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
        auditLog.push(auditEntry);
        // Keep only last 100 entries
        if (auditLog.length > 100) {
          auditLog.splice(0, auditLog.length - 100);
        }
        localStorage.setItem('audit_log', JSON.stringify(auditLog));
      }
    },
    [userId]
  );

  return logAction;
};

// Utility function to get audit log (for debugging)
export const getAuditLog = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('audit_log') || '[]');
  } catch {
    return [];
  }
};

// Utility function to clear audit log (for debugging)
export const clearAuditLog = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('audit_log');
  }
};
