import { Category, Banner } from '@/types';

export const categories: Category[] = [
  {
    id: 'men',
    name: 'Men',
    slug: 'men',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop',
    subcategories: [
      { name: 'T-Shirts', slug: 'tshirts' },
      { name: 'Shirts', slug: 'shirts' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Trousers', slug: 'trousers' },
      { name: 'Blazers', slug: 'blazers' },
      { name: 'Shoes', slug: 'shoes' },
      { name: 'Watches', slug: 'watches' },
      { name: 'Wallets', slug: 'wallets' },
      { name: 'Sweatshirts', slug: 'sweatshirts' },
    ],
  },
  {
    id: 'women',
    name: 'Women',
    slug: 'women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop',
    subcategories: [
      { name: 'Dresses', slug: 'dresses' },
      { name: 'Tops', slug: 'tops' },
      { name: 'Kurtis', slug: 'kurtis' },
      { name: 'Sarees', slug: 'sarees' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Heels', slug: 'heels' },
      { name: 'Sneakers', slug: 'sneakers' },
      { name: 'Handbags', slug: 'handbags' },
      { name: 'Jewellery', slug: 'jewellery' },
      { name: 'Ethnic Wear', slug: 'ethnic' },
    ],
  },
  {
    id: 'kids',
    name: 'Kids',
    slug: 'kids',
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=500&fit=crop',
    subcategories: [
      { name: 'T-Shirts', slug: 'tshirts' },
      { name: 'Dresses', slug: 'dresses' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Ethnic Wear', slug: 'ethnic' },
      { name: 'Shoes', slug: 'shoes' },
      { name: 'Tops', slug: 'tops' },
      { name: 'Bags', slug: 'bags' },
    ],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=500&fit=crop',
    subcategories: [
      { name: 'Sunglasses', slug: 'sunglasses' },
      { name: 'Watches', slug: 'watches' },
      { name: 'Belts', slug: 'belts' },
      { name: 'Bags', slug: 'bags' },
      { name: 'Caps', slug: 'caps' },
      { name: 'Scarves', slug: 'scarves' },
      { name: 'Jewellery', slug: 'jewellery' },
    ],
  },
];

export const heroBanners: Banner[] = [
  {
    id: 'b1',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
    title: 'End of Season Sale',
    subtitle: 'Up to 70% Off on Top Brands',
    link: '/products?discount=50',
  },
  {
    id: 'b2',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=400&fit=crop',
    title: 'New Arrivals',
    subtitle: 'Fresh Styles for the Season',
    link: '/products?sort=newest',
  },
  {
    id: 'b3',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop',
    title: 'Premium Brands',
    subtitle: 'Exclusive Collection',
    link: '/products?category=women',
  },
  {
    id: 'b4',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    title: 'Kids Special',
    subtitle: 'Adorable Fashion for Little Ones',
    link: '/products?category=kids',
  },
];

export const dealBanners = [
  {
    id: 'd1',
    title: 'Min 50% Off',
    subtitle: 'Top Brands',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    link: '/products?discount=50',
  },
  {
    id: 'd2',
    title: 'Under ₹999',
    subtitle: 'Budget Finds',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=200&fit=crop',
    link: '/products?maxPrice=999',
  },
  {
    id: 'd3',
    title: 'Best Sellers',
    subtitle: 'Customer Favorites',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=200&fit=crop',
    link: '/products?sort=popular',
  },
  {
    id: 'd4',
    title: 'New In',
    subtitle: 'Latest Arrivals',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=200&fit=crop',
    link: '/products?sort=newest',
  },
];

export const brands = [
  { id: 'nike', name: 'Nike', logo: 'N' },
  { id: 'adidas', name: 'Adidas', logo: 'A' },
  { id: 'puma', name: 'Puma', logo: 'P' },
  { id: 'levis', name: "Levi's", logo: 'L' },
  { id: 'hrx', name: 'HRX', logo: 'H' },
  { id: 'roadster', name: 'Roadster', logo: 'R' },
];
