import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Online Shopping */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4 text-foreground">
              Online Shopping
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=men" className="text-sm text-muted-foreground hover:text-primary">
                  Men
                </Link>
              </li>
              <li>
                <Link to="/products?category=women" className="text-sm text-muted-foreground hover:text-primary">
                  Women
                </Link>
              </li>
              <li>
                <Link to="/products?category=kids" className="text-sm text-muted-foreground hover:text-primary">
                  Kids
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="text-sm text-muted-foreground hover:text-primary">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Policies */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4 text-foreground">
              Customer Policies
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
                  T&C
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-muted-foreground hover:text-primary">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-muted-foreground hover:text-primary">
                  Shipping
                </Link>
              </li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4 text-foreground">
              Useful Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-muted-foreground hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-sm text-muted-foreground hover:text-primary">
                  Site Map
                </Link>
              </li>
              <li>
                <Link to="/corporate" className="text-sm text-muted-foreground hover:text-primary">
                  Corporate Information
                </Link>
              </li>
            </ul>
          </div>

          {/* Experience STYVIA App */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4 text-foreground">
              Experience STYVIA App
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-background rounded-lg p-2 w-fit cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center text-background text-xs font-bold">
                  ▶
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Get it on</p>
                  <p className="text-xs font-semibold">Google Play</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-background rounded-lg p-2 w-fit cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center text-background text-xs font-bold">
                  
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Download on the</p>
                  <p className="text-xs font-semibold">App Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-4 text-foreground">
              Keep in Touch
            </h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            {/* Guarantee */}
            <div className="mt-6">
              <h4 className="font-bold text-sm mb-2">100% ORIGINAL</h4>
              <p className="text-xs text-muted-foreground">
                guarantee for all products
              </p>
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm mb-2">Return within 14 days</h4>
              <p className="text-xs text-muted-foreground">
                of receiving your order
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 www.styvia.com. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is a demo clone project for learning purposes.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
