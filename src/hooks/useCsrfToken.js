import { useEffect } from 'react';
import { useCsrfStore } from '../store/useCsrfStore';
import { getCsrfToken } from '../services/api/api';

/**
 * Hook to fetch and initialize CSRF token
 * Should be called at the root level of the application
 */
export const useCsrfToken = () => {
  const { setCsrfToken, csrfToken } = useCsrfStore();

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await getCsrfToken();
        const token = response.data?.csrfToken || response.data?.token;

        if (token) {
          setCsrfToken(token);
          console.log('CSRF token initialized successfully');
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        // Retry after 5 seconds if failed
        setTimeout(fetchCsrfToken, 5000);
      }
    };

    // Only fetch if we don't have a token
    if (!csrfToken) {
      fetchCsrfToken();
    }

    // Refresh token every 30 minutes
    const interval = setInterval(fetchCsrfToken, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [setCsrfToken, csrfToken]);

  return csrfToken;
};
