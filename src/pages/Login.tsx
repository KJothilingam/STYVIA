import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';
import { isAxiosError } from 'axios';

const Login = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const sessionToastShown = useRef(false);

  useEffect(() => {
    if (searchParams.get('session') !== 'expired' || sessionToastShown.current) return;
    sessionToastShown.current = true;
    const fromAdmin = searchParams.get('from') === 'admin';
    toast({
      title: 'Session ended',
      description: fromAdmin
        ? 'Please sign in again to continue in Admin.'
        : 'Please sign in again to continue.',
    });
    const next = new URLSearchParams(searchParams);
    next.delete('session');
    next.delete('from');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const authData = await authService.login({
        email: loginEmail,
        password: loginPassword,
      });
      
      setUser({
        id: authData.userId.toString(),
        name: authData.name,
        email: authData.email,
        phone: '',
      });
      
      toast({ title: 'Logged in successfully!' });
      
      // Redirect to admin if user is admin
      if (authData.roles.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      const msg = isAxiosError(error) ? (error.response?.data as { message?: string })?.message : undefined;
      toast({
        title: 'Login failed',
        description: msg || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const authData = await authService.signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone,
      });
      
      setUser({
        id: authData.userId.toString(),
        name: authData.name,
        email: authData.email,
        phone: signupPhone,
      });
      
      toast({ title: 'Account created successfully!' });
      navigate('/');
    } catch (error: unknown) {
      const msg = isAxiosError(error) ? (error.response?.data as { message?: string })?.message : undefined;
      toast({
        title: 'Signup failed',
        description: msg || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              STYVIA
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Sign in for cart, fit studio, wardrobe &amp; donations — API at{' '}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}</code>
            </p>
          </div>

          <div className="card-elevated p-6 md:p-8 ring-1 ring-black/[0.03]">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-11 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:shadow-sm">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm">
                  Sign up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold rounded-xl shadow-sm" disabled={isLoading}>
                    {isLoading ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold rounded-xl shadow-sm" disabled={isLoading}>
                    {isLoading ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Use
              </Link>{' '}
              &{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <strong>Demo Admin:</strong> admin@stylediscovery.com / admin123
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
