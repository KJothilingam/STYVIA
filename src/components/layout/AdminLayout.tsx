import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LogOut,
  ArrowLeft,
  HeartHandshake,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/hooks/use-toast';
import adminService from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { donationQueryKeys } from '@/lib/donationQueryKeys';

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="relative w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">ADMIN PANEL</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
        </div>

        <nav className="px-3 space-y-1 flex-1 pb-24">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/admin/donations' && pendingDonations > 0 ? (
                <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 text-[10px] tabular-nums">
                  {pendingDonations > 99 ? '99+' : pendingDonations}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </Link>
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

