import { Link } from 'react-router-dom';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="group block relative overflow-hidden rounded-lg aspect-[3/4]"
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
        <p className="text-sm text-white/80">Explore Now →</p>
      </div>
    </Link>
  );
};

export default CategoryCard;
