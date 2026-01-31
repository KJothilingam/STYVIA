import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { categories } from '@/data/categories';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const { cartItemsCount, wishlist, isLoggedIn } = useStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      {/* Top banner */}
      <div className="bg-styvia-pink text-primary-foreground text-center py-1.5 text-xs font-medium">
        Free Shipping on orders above ₹799 | Use code: STYVIA100
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              STYVIA
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative group"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  to={`/products?category=${category.slug}`}
                  className="flex items-center gap-1 py-5 text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary"
                >
                  {category.name}
                  <ChevronDown className="w-3 h-3" />
                </Link>

                {/* Dropdown */}
                {activeCategory === category.id && (
                  <div className="absolute top-full left-0 bg-background border rounded-lg shadow-lg py-4 px-6 min-w-[200px] animate-fade-in">
                    <ul className="space-y-2">
                      {category.subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link
                            to={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <Link
              to="/products"
              className="py-5 text-sm font-semibold uppercase tracking-wide text-foreground hover:text-primary transition-colors"
            >
              Studio
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-0 focus-visible:ring-1"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link to={isLoggedIn ? '/profile' : '/login'}>
              <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-1">
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium hidden sm:block">Profile</span>
              </Button>
            </Link>

            <Link to="/wishlist" className="relative">
              <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-1">
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium hidden sm:block">Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm" className="flex flex-col items-center gap-0.5 h-auto py-1">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-[10px] font-medium hidden sm:block">Bag</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-0"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[108px] bg-background z-40 overflow-y-auto animate-slide-in-right">
          <nav className="container mx-auto px-4 py-4">
            {categories.map((category) => (
              <div key={category.id} className="border-b">
                <Link
                  to={`/products?category=${category.slug}`}
                  className="block py-3 font-semibold text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
                <div className="pb-3 pl-4 space-y-2">
                  {category.subcategories.slice(0, 5).map((sub) => (
                    <Link
                      key={sub.slug}
                      to={`/products?category=${category.slug}&subcategory=${sub.slug}`}
                      className="block text-sm text-muted-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
