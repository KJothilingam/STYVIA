import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  LogOut,
  ChevronRight,
  Ruler,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/context/StoreContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function ProfileBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-1/4 top-0 h-[min(68vh,520px)] w-[min(88vw,680px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(270_65%_58%/0.22)_0%,transparent_66%)] blur-3xl motion-safe:animate-wardrobe-ambient dark:bg-[radial-gradient(ellipse_at_center,hsl(270_55%_45%/0.2)_0%,transparent_64%)]" />
      <div className="absolute -right-1/4 bottom-0 h-[min(58vh,480px)] w-[min(82vw,600px)] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(330_70%_58%/0.14)_0%,transparent_60%)] blur-3xl motion-safe:animate-wardrobe-ambient [animation-delay:-6s] dark:bg-[radial-gradient(ellipse_at_center,hsl(330_50%_45%/0.12)_0%,transparent_58%)]" />
      <div className="absolute left-1/2 top-1/3 h-[min(42vh,380px)] w-[min(62vw,480px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(220_80%_60%/0.1)_0%,transparent_55%)] blur-3xl motion-safe:animate-body-zone-float dark:bg-[radial-gradient(ellipse_at_center,hsl(220_60%_50%/0.08)_0%,transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(270_40%_45%/0.06)_48px,hsl(270_40%_45%/0.06)_49px)] dark:opacity-[0.09] dark:[background-image:repeating-linear-gradient(90deg,transparent,transparent_48px,hsl(0_0%_100%/0.06)_48px,hsl(0_0%_100%/0.06)_49px)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent dark:via-violet-400/30" />
    </div>
  );
}

const Profile = () => {
  const { user, logout, addresses, wishlist, orders } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = () => {
    // TODO: Call API to update user profile
    if (user) {
      // For now, just update local state
      // setUser({ ...user, name, email, phone });
      setIsEditing(false);
      toast({ title: 'Profile updated successfully!' });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out successfully!' });
    navigate('/');
  };

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center justify-between rounded-xl border border-transparent p-3 text-sm transition-all duration-300',
      active
        ? 'border-violet-200/80 bg-violet-50/90 font-medium text-foreground shadow-sm shadow-violet-500/5 ring-1 ring-violet-500/10 dark:border-violet-500/30 dark:bg-violet-500/10 dark:ring-violet-400/20'
        : 'text-muted-foreground hover:border-border/80 hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/40',
    );

  return (
    <Layout>
      <div className="relative min-h-[62vh] overflow-hidden bg-gradient-to-b from-violet-50/95 via-rose-50/25 to-background text-foreground dark:from-[hsl(265_28%_14%)] dark:via-[hsl(280_22%_11%)] dark:to-[hsl(270_32%_8%)]">
        <ProfileBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] space-y-8 px-4 py-8 pb-16 md:px-6 md:py-12 lg:px-8">
          <nav className="text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-colors hover:text-violet-700 dark:hover:text-violet-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="font-medium text-foreground">My account</span>
          </nav>

          <header
            className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
            style={{ animationFillMode: 'both' }}
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200/90 bg-violet-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-900 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-100">
              <User className="h-3 w-3 shrink-0 text-violet-600 dark:text-violet-300" />
              Your space
              <Sparkles className="h-3 w-3 shrink-0 text-amber-600/90 dark:text-amber-200/80" />
            </div>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25 ring-2 ring-violet-200/70 dark:shadow-violet-900/40 dark:ring-white/15 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-105">
                <span className="font-display-hero text-2xl font-semibold">{user.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display-hero text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                  <span className="text-foreground">Hello, </span>
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-violet-300 dark:via-fuchsia-300 dark:to-rose-300">
                    {user.name.split(' ')[0]}
                  </span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Manage your details, addresses, and shortcuts to orders, fit, and wishlist — all in one place.
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-4 lg:gap-8">
            <aside className="lg:col-span-1">
              <div
                className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_-24px_hsl(270_40%_20%/0.12)] backdrop-blur-md dark:border-border dark:bg-card/80 dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500"
                style={{ animationFillMode: 'both', animationDelay: '60ms' }}
              >
                <div
                  className="pointer-events-none absolute inset-x-6 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-violet-400/35 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-violet-400/25"
                  aria-hidden
                />
                <div className="relative flex items-center gap-4 border-b border-border/60 pb-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg font-bold text-white shadow-md ring-2 ring-violet-200/60 dark:ring-white/15">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{user.name}</h2>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">{user.email}</p>
                  </div>
                </div>

                <nav className="relative mt-6 space-y-1.5">
                  <Link to="/profile" className={navLinkClass(true)}>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </Link>
                  <Link to="/orders" className={navLinkClass(false)}>
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 shrink-0" />
                      <span>Orders</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </Link>
                  <Link to="/body" className={navLinkClass(false)}>
                    <div className="flex items-center gap-3">
                      <Ruler className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                      <span>Body measurements</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </Link>
                  <Link to="/wishlist" className={navLinkClass(false)}>
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 shrink-0" />
                      <span>Wishlist</span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left text-sm text-destructive transition-all duration-300 hover:border-destructive/20 hover:bg-destructive/5"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span>Logout</span>
                  </button>
                </nav>
              </div>
            </aside>

            <div className="space-y-6 lg:col-span-3">
              <div
                className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_-24px_hsl(270_40%_20%/0.1)] backdrop-blur-md dark:border-border dark:bg-card/80 dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.4)] md:p-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500"
                style={{ animationFillMode: 'both', animationDelay: '100ms' }}
              >
                <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold tracking-tight">Profile details</h2>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  ) : (
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="flex-1 sm:flex-none" onClick={handleSave}>
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    {isEditing ? (
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-0.5" />
                    ) : (
                      <p className="rounded-lg border border-transparent bg-muted/30 px-3 py-2 text-sm text-foreground dark:bg-muted/20">
                        {user.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-0.5"
                      />
                    ) : (
                      <p className="rounded-lg border border-transparent bg-muted/30 px-3 py-2 text-sm text-foreground dark:bg-muted/20">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 sm:max-w-md">
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-0.5" />
                    ) : (
                      <p className="rounded-lg border border-transparent bg-muted/30 px-3 py-2 text-sm text-foreground dark:bg-muted/20">
                        {user.phone || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_-24px_hsl(270_40%_20%/0.1)] backdrop-blur-md dark:border-border dark:bg-card/80 md:p-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500"
                style={{ animationFillMode: 'both', animationDelay: '140ms' }}
              >
                <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold tracking-tight">Saved addresses</h2>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Add new
                  </Button>
                </div>

                {addresses.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="rounded-xl border border-border/80 bg-muted/20 p-4 transition-all duration-300 hover:border-violet-300/40 hover:shadow-md dark:hover:border-violet-500/25"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                              <span className="text-xs font-bold uppercase tracking-wide text-foreground">{address.type}</span>
                              {address.isDefault ? (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-100">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <p className="font-semibold text-foreground">{address.name}</p>
                            <p className="text-sm text-muted-foreground">{address.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.locality}, {address.city} - {address.pincode}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.state}</p>
                            <p className="mt-2 text-sm text-foreground">Mobile: {address.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-8 rounded-xl border border-dashed border-violet-300/40 bg-violet-50/30 px-6 py-10 text-center dark:border-violet-500/25 dark:bg-violet-500/5">
                    <MapPin className="mx-auto mb-3 h-10 w-10 text-violet-400/70" />
                    <p className="text-sm font-medium text-foreground">No saved addresses</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add one at checkout or tap Add new when available.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
                <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 to-violet-50/30 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-md dark:from-card/90 dark:to-violet-950/20 dark:hover:border-violet-500/30">
                  <p className="font-display-hero text-3xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{orders.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Orders</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 to-rose-50/25 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200/80 hover:shadow-md dark:from-card/90 dark:to-rose-950/15 dark:hover:border-rose-500/25">
                  <p className="font-display-hero text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{wishlist.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Wishlist</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card/95 to-violet-50/20 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/70 hover:shadow-md dark:from-card/90 dark:to-fuchsia-950/15 dark:hover:border-fuchsia-500/25 sm:col-span-1">
                  <p className="font-display-hero text-3xl font-bold tabular-nums text-fuchsia-600 dark:text-fuchsia-400">{addresses.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Addresses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
