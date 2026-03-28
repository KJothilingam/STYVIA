import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
}

const accents: Record<
  string,
  { ring: string; glow: string; label: string; bar: string }
> = {
  men: {
    ring: 'group-hover:ring-sky-400/50',
    glow: 'bg-sky-500/25',
    label: 'text-sky-100',
    bar: 'from-sky-400 to-cyan-300',
  },
  women: {
    ring: 'group-hover:ring-rose-400/55',
    glow: 'bg-rose-500/25',
    label: 'text-rose-50',
    bar: 'from-rose-400 to-fuchsia-400',
  },
  kids: {
    ring: 'group-hover:ring-amber-400/60',
    glow: 'bg-amber-400/30',
    label: 'text-amber-50',
    bar: 'from-amber-400 to-orange-400',
  },
  accessories: {
    ring: 'group-hover:ring-amber-300/50',
    glow: 'bg-amber-500/20',
    label: 'text-amber-50',
    bar: 'from-yellow-300 to-amber-500',
  },
};

const CategoryCard = ({ category }: CategoryCardProps) => {
  const a = accents[category.id] ?? accents.men;

  return (
    <Link
      to={`/products?category=${category.slug}`}
      className={cn(
        'group relative block aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-500',
        'hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15',
        a.ring,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-2xl transition-all duration-700',
          'opacity-60 group-hover:opacity-100 group-hover:scale-125',
          a.glow,
        )}
        aria-hidden
      />

      <img
        src={category.image}
        alt={category.name}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-500 group-hover:from-black/90" />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <div
          className={cn(
            'mb-2 h-1 w-10 rounded-full bg-gradient-to-r opacity-90 transition-all duration-500 group-hover:w-16',
            a.bar,
          )}
        />
        <div className="flex items-end justify-between gap-2">
          <div>
            <h3 className={cn('text-xl font-bold tracking-tight md:text-2xl', a.label)}>{category.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/75 transition-colors group-hover:text-white">
              Shop the range
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'none',
        }}
        aria-hidden
      />
    </Link>
  );
};

export default CategoryCard;
