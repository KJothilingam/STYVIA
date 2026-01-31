import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Heart, LogOut, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/context/StoreContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">My Account</span>
        </nav>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" />
                    <span>Wishlist</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary w-full text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Info */}
            <div className="bg-card border rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Profile Details</h2>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{user.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{user.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-foreground">{user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Saved Addresses</h2>
                <Button variant="outline">Add New</Button>
              </div>

              {addresses.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm uppercase">
                              {address.type}
                            </span>
                            {address.isDefault && (
                              <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-semibold">{address.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.locality}, {address.city} - {address.pincode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.state}
                          </p>
                          <p className="text-sm mt-2">Mobile: {address.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No saved addresses
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-card border rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-primary">{orders.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Orders</p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-primary">{wishlist.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Wishlist</p>
              </div>
              <div className="bg-card border rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-primary">{addresses.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Addresses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
