import Header from './Header';
import Footer from './Footer';
import IntelligenceStrip from '@/components/intelligence/IntelligenceStrip';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <IntelligenceStrip />
      <main className="flex-1 relative">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
