import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

type LegalVariant = 'terms' | 'privacy';

const copy: Record<
  LegalVariant,
  { title: string; lead: string; bullets: string[] }
> = {
  terms: {
    title: 'Terms of use',
    lead:
      'STYVIA is a demo fashion discovery experience. By using the site you agree to use it responsibly and not to misuse accounts, uploads, or APIs.',
    bullets: [
      'Product and pricing information may be illustrative.',
      'Accounts and orders may depend on the backend being available.',
      'We may update these terms as the product evolves.',
    ],
  },
  privacy: {
    title: 'Privacy',
    lead:
      'This demo stores session tokens in your browser when you log in so the app can call protected APIs. Do not use real secrets on shared devices.',
    bullets: [
      'Cart and wishlist data may be kept in local storage per account.',
      'Review backend configuration for production data handling.',
      'Contact the project owner for a full privacy policy when you go live.',
    ],
  },
};

export default function LegalInfo({ variant }: { variant: LegalVariant }) {
  const { title, lead, bullets } = copy[variant];
  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/login">← Back to sign in</Link>
        </Button>
        <h1 className="font-display-hero text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">{lead}</p>
        <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-foreground/90">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
