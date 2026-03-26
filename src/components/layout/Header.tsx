import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  MapPin,
  HeartHandshake,
  UserRound,
  Shirt,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { categories } from '@/data/categories';
import { cn } from '@/lib/utils';

/** Highlighted “you are here” treatment for the compact feature links (xl strip). */
const featureNavActiveClass =
  'rounded-lg border border-primary/40 bg-primary/[0.1] shadow-sm ring-1 ring-primary/15 dark:bg-primary/15 dark:ring-primary/25';
const featureNavActiveDonateClass =
  'rounded-lg border border-emerald-600/45 bg-emerald-500/[0.14] shadow-sm ring-1 ring-emerald-500/25 dark:border-emerald-400/40 dark:bg-emerald-500/15';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItemsCount, wishlist, isLoggedIn } = useStore();

  const routeSearch = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const categoryParam = routeSearch.get('category');
  const subcategoryParam = routeSearch.get('subcategory');
  const viewFit = routeSearch.get('view') === 'fit';
  const donationsTabBoxes = routeSearch.get('tab') === 'boxes';
  const { pathname } = location;

  const onStudioHome = pathname === '/products' && !categoryParam && !subcategoryParam && !viewFit;
  const onSmartFit = pathname === '/products' && viewFit;
  const onProfile = pathname.startsWith('/profile');
  const onWardrobe = pathname.startsWith('/wardrobe');
  const onDonations = pathname.startsWith('/donations');
  const onShops = pathname.startsWith('/shops');
  const onOrders = pathname.startsWith('/orders');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-header supports-[backdrop-filter]:bg-background/70">
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white text-center py-2 text-xs font-semibold tracking-wide">
        Free shipping over ₹799 · Code <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded-md">STYVIA100</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 w-full min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 group inline-block">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              STYVIA
            </h1>
            <span className="block h-0.5 w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 scale-x-90 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden shrink-0 lg:flex lg:items-center lg:gap-4 xl:gap-5">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative group"
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  to={`/products?category=${category.slug}`}
                  className={cn(
                    'flex items-center gap-1 py-5 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2',
                    categoryParam === category.slug
                      ? 'text-primary border-primary'
                      : 'text-foreground border-transparent hover:text-primary hover:border-primary'
                  )}
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
              className={cn(
                'py-5 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2',
                onStudioHome
                  ? 'text-primary border-primary'
                  : 'text-foreground border-transparent hover:text-primary hover:border-primary'
              )}
            >
              Studio
            </Link>
            <div
              className="hidden shrink-0 self-stretch items-center gap-4 border-l border-border/80 pl-3 ml-1 xl:flex xl:gap-5 xl:pl-4 xl:ml-2"
              role="navigation"
              aria-label="Style and community"
            >
              <Link
                to="/products?view=fit"
                className={cn(
                  'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  onSmartFit
                    ? cn(featureNavActiveClass, 'rounded-full border-intelligence-mid/40 bg-intelligence-deep/20 ring-intelligence-mid/20')
                    : 'bg-intelligence-deep/10 text-intelligence-mid hover:bg-intelligence-deep/18'
                )}
                aria-current={onSmartFit ? 'page' : undefined}
              >
                <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="leading-none pt-px">Smart fit</span>
              </Link>
              <Link
                to={isLoggedIn ? '/profile' : '/login?next=%2Fprofile'}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  onProfile
                    ? featureNavActiveClass
                    : 'text-intelligence-mid hover:text-intelligence-accent'
                )}
                aria-current={onProfile ? 'page' : undefined}
              >
                <UserRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="leading-none pt-px">Body</span>
              </Link>
              <Link
                to={isLoggedIn ? '/wardrobe' : '/login?next=%2Fwardrobe'}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  onWardrobe
                    ? featureNavActiveClass
                    : 'text-intelligence-mid hover:text-intelligence-accent'
                )}
                aria-current={onWardrobe ? 'page' : undefined}
              >
                <Shirt className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="leading-none pt-px">Wardrobe</span>
              </Link>
              <Link
                to={isLoggedIn ? '/donations' : '/login?next=%2Fdonations'}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  onDonations
                    ? featureNavActiveDonateClass
                    : 'text-emerald-700/90 hover:text-emerald-600 dark:text-emerald-400'
                )}
                aria-current={onDonations ? 'page' : undefined}
              >
                <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
                <span className="leading-none pt-px">Donate</span>
              </Link>
              <Link
                to={isLoggedIn ? '/shops' : '/login?next=%2Fshops'}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
                  onShops ? featureNavActiveClass : 'text-intelligence-mid hover:text-intelligence-accent'
                )}
                aria-current={onShops ? 'page' : undefined}
              >
                <MapPin className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="leading-none pt-px">Shops</span>
              </Link>
            </div>
          </nav>

          {/* Search + actions: one flex group so gap always separates field from icons (no overlap) */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4 md:gap-5 lg:pl-2">
            <form
              onSubmit={handleSearch}
              className="hidden min-w-[10rem] flex-1 items-center md:flex md:max-w-md lg:max-w-[min(22rem,100%)] xl:max-w-md"
            >
              <div className="relative isolate w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="text"
                  placeholder="Search for products, brands and more"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 border-0 bg-secondary pl-10 pr-3 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-offset-0"
                />
              </div>
            </form>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link to={isLoggedIn ? '/profile' : '/login'} className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'flex h-9 w-11 flex-col items-center justify-center gap-0.5 rounded-lg p-0 sm:h-10 sm:w-12',
                  /* inset highlight so ring/border never paints over the search field */
                  onProfile
                    ? 'bg-primary/12 ring-inset ring-2 ring-primary/30 hover:bg-primary/15'
                    : 'hover:bg-accent'
                )}
                aria-current={onProfile ? 'page' : undefined}
              >
                <User className="!h-[1.125rem] !w-[1.125rem] shrink-0" />
                <span className="hidden text-[10px] font-medium leading-none sm:block">Profile</span>
              </Button>
            </Link>

            <Link to="/wishlist" className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="flex h-9 w-11 flex-col items-center justify-center gap-0.5 rounded-lg p-0 hover:bg-accent sm:h-10 sm:w-12"
              >
                <Heart className="!h-[1.125rem] !w-[1.125rem] shrink-0" />
                <span className="hidden text-[10px] font-medium leading-none sm:block">Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/cart" className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="flex h-9 w-11 flex-col items-center justify-center gap-0.5 rounded-lg p-0 hover:bg-accent sm:h-10 sm:w-12"
              >
                <ShoppingBag className="!h-[1.125rem] !w-[1.125rem] shrink-0" />
                <span className="hidden text-[10px] font-medium leading-none sm:block">Bag</span>
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
              className="shrink-0 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            </div>
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
            <div className="mb-4 rounded-xl border border-intelligence-mid/25 bg-intelligence-deep/[0.06] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-intelligence-mid mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden />
                Body intelligence
              </p>
              <div className="flex flex-col gap-1.5">
                <Link
                  to="/products?view=fit"
                  className={cn(
                    'text-sm font-medium rounded-lg px-2 py-2 transition-colors',
                    onSmartFit
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'text-foreground hover:bg-muted/80'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Smart fit — browse products
                </Link>
                <Link
                  to={isLoggedIn ? '/profile' : '/login?next=%2Fprofile'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onProfile
                      ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Body profile
                </Link>
                <Link
                  to={isLoggedIn ? '/wardrobe' : '/login?next=%2Fwardrobe'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onWardrobe
                      ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Wardrobe
                </Link>
                <Link
                  to={isLoggedIn ? '/orders' : '/login?next=%2Forders'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onOrders
                      ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders &amp; fit feedback
                </Link>
                <Link
                  to={isLoggedIn ? '/donations' : '/login?next=%2Fdonations'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onDonations && !donationsTabBoxes
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium ring-1 ring-emerald-500/25'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Donations &amp; sustainability
                </Link>
                <Link
                  to={isLoggedIn ? '/donations?tab=boxes' : '/login?next=%2Fdonations%3Ftab%3Dboxes'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onDonations && donationsTabBoxes
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium ring-1 ring-emerald-500/25'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Donation box (QR drop)
                </Link>
                <Link
                  to={isLoggedIn ? '/shops' : '/login?next=%2Fshops'}
                  className={cn(
                    'text-sm rounded-lg px-2 py-2 transition-colors',
                    onShops
                      ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Nearby shops
                </Link>
              </div>
            </div>
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
