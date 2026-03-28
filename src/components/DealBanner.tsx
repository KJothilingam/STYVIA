import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DealBannerProps {
  deal: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
  };
}

const DealBanner = ({ deal }: DealBannerProps) => {
  return (
    <Link
      to={deal.link}
      className={cn(
        'group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-secondary',
        'shadow-lg transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10',
      )}
    >
      <img
        src={deal.image}
        alt={deal.title}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-500 group-hover:from-black/95" />

      <div
        className="pointer-events-none absolute inset-0 translate-x-[-100%] skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[100%] group-hover:opacity-100"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 p-4 text-center md:p-5">
        <h3 className="text-xl font-bold text-white drop-shadow-md transition-transform duration-300 group-hover:scale-[1.02] md:text-2xl">
          {deal.title}
        </h3>
        <p className="mt-1 text-sm text-white/85">{deal.subtitle}</p>
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/95 ring-1 ring-white/25 backdrop-blur-sm transition group-hover:bg-white/25">
          Explore
        </span>
      </div>
    </Link>
  );
};

export default DealBanner;
