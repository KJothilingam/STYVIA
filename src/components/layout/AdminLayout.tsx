import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LogOut,
  HeartHandshake,
  Store,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';
import adminService from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { donationQueryKeys } from '@/lib/donationQueryKeys';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useStore();

  const { data: pendingDonations = 0 } = useQuery({
    queryKey: donationQueryKeys.adminPendingSummary(),
    queryFn: async () => (await adminService.getDonationPendingSummary()).totalPending,
    refetchInterval: 12_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
  });

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out successfully' });
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: HeartHandshake, label: 'Donations', path: '/admin/donations' },
  ];

  return (
    <div className="flex h-screen bg-slate-100/90 dark:bg-slate-950">
      <div className="relative flex w-64 flex-col border-r border-border/60 bg-card shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-semibold tracking-tight text-primary">Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm">{user?.name}</p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 pb-24">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0 opacity-90" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/admin/donations' && pendingDonations > 0 ? (
                <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 text-[10px] tabular-nums">
                  {pendingDonations > 99 ? '99+' : pendingDonations}
                </Badge>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 space-y-2 p-3 border-t bg-white">
          <Button variant="secondary" className="w-full justify-start" size="sm" asChild>
            <Link to="/admin">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Admin dashboard
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm" asChild>
            <Link to="/">
              <Store className="h-4 w-4 mr-2" />
              Back to store
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start mt-2"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

