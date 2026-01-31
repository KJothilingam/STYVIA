import { Link } from 'react-router-dom';

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
      className="group block relative overflow-hidden rounded-lg aspect-[4/3] bg-secondary"
    >
      <img
        src={deal.image}
        alt={deal.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <h3 className="text-2xl font-bold text-white mb-1">{deal.title}</h3>
        <p className="text-sm text-white/80">{deal.subtitle}</p>
      </div>
    </Link>
  );
};

export default DealBanner;
