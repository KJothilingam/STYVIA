import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthNavigate } from '@/lib/authPrompt';

/** Registers react-router navigate for `promptLogin` (must render inside BrowserRouter). */
const AuthNavigationRegistrar = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setAuthNavigate(navigate);
    return () => setAuthNavigate(null);
  }, [navigate]);
  return null;
};

export default AuthNavigationRegistrar;
