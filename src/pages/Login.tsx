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
import { ArrowRight, Lock, Mail, Sparkles, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden md:min-h-[calc(100dvh-6rem)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,hsl(330_60%_90%/0.35),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,hsl(330_40%_30%/0.2),transparent_50%)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-0 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12 xl:max-w-7xl xl:grid-cols-[1.1fr_minmax(0,440px)]">
          {/* Brand panel — desktop */}
          <div className="hidden flex-col justify-center px-6 py-12 lg:flex lg:px-10 xl:px-14">
            <Link
              to="/"
              className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
              Back to store
            </Link>
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Members
            </div>
            <h1 className="font-display-hero text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
              Style that knows{' '}
              <span className="bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">you</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Save your body profile, build your wardrobe, and get fit guidance tailored to what you buy.
            </p>
            <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
              {['Personalized fit checks', 'Order history & easy returns', 'Donations & sustainability tools'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Form column */}
          <div className="flex flex-col justify-center px-4 py-10 sm:px-6 lg:py-16 lg:pr-8 lg:pl-0">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center lg:hidden">
                <Link to="/" className="mb-6 inline-block">
                  <span className="font-display-hero text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
                    STYVIA
                  </span>
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account to continue.</p>
              </div>

              <div
                className={cn(
                  'rounded-2xl border border-border/60 bg-card/90 p-6 shadow-lg shadow-black/[0.04] backdrop-blur-md',
                  'dark:border-border/40 dark:bg-card/80 dark:shadow-black/20',
                  'sm:p-8',
                )}
              >
                <div className="mb-6 hidden text-center lg:block">
                  <Link to="/" className="inline-block">
                    <span className="font-display-hero text-2xl font-semibold tracking-tight bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
                      STYVIA
                    </span>
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">Welcome — use your email to continue.</p>
                </div>

                <Tabs defaultValue="login">
                  <TabsList className="mb-8 grid h-12 w-full grid-cols-2 rounded-full bg-muted/70 p-1.5">
                    <TabsTrigger
                      value="login"
                      className="rounded-full text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      Sign in
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-full text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      Create account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0 outline-none">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10 transition-colors focus-visible:border-primary"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10 transition-colors focus-visible:border-primary"
                            autoComplete="current-password"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline underline-offset-4"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Button
                        type="submit"
                        className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in…' : 'Sign in'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0 outline-none">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">
                          Full name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Your name"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10"
                            autoComplete="name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-sm font-medium">
                          Phone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="+91 …"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10"
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            className="h-11 rounded-xl border-border/80 pl-10"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="mt-2 h-12 w-full rounded-xl text-base font-semibold shadow-md"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account…' : 'Create account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Demo admin</p>
                <p className="mt-1 font-mono text-xs text-foreground/90">
                  admin@stylediscovery.com <span className="text-muted-foreground">·</span> admin123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
