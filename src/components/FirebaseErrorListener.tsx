'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Listens for globally emitted Firestore permission errors.
 * Logs them silently — does NOT throw, so a permission error
 * on one query never crashes the entire page.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log quietly — don't throw into React's error boundary
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Firestore permission error]", error?.message ?? error);
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => { errorEmitter.off('permission-error', handleError); };
  }, []);

  return null;
}
