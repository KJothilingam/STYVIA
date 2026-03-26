import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import donationService, { type DropVerifyResult } from '@/services/donationService';

export default function DonationDropVerify() {
  const { token } = useParams<{ token: string }>();
  const [res, setRes] = useState<DropVerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    donationService
      .verifyDropTokenPublic(token)
      .then(setRes)
      .catch(() => setRes({ valid: false, status: 'ERROR', message: 'Network error.' }))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying drop code…</p>
          </div>
        )}

        {!loading && res?.valid && (
          <>
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Valid drop code</h1>
            <p className="text-muted-foreground text-sm mb-2">{res.message}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-8">Status: {res.status}</p>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </>
        )}

        {!loading && res && !res.valid && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Code not recognized</h1>
            <p className="text-muted-foreground text-sm mb-8">{res.message}</p>
            <Button asChild>
              <Link to="/donations?tab=boxes">Donation box</Link>
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
