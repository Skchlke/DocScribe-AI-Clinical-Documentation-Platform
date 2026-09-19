import { useState, useCallback, useRef } from 'react';

// Extracted from the app's original inline show-error/show-success pattern:
// sets a message, auto-clears it after a delay.
export function useToast(duration = 4000) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const errorTimer = useRef(null);
  const successTimer = useRef(null);

  const showError = useCallback((message) => {
    setError(message);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(''), duration);
  }, [duration]);

  const showSuccess = useCallback((message) => {
    setSuccess(message);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), duration);
  }, [duration]);

  return { error, success, showError, showSuccess };
}
