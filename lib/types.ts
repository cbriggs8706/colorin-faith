export type Product = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stripePriceId: string;
  category: string;
  pageCount: number;
  tagline: string;
  gradient: string;
  audience: string[];
  features: string[];
  featured: boolean;
  images: ProductImage[];
  downloads: ProductDownload[];
};

export type ProductInput = Product;

export type ProductImage = {
  path: string;
  alt: string;
};

export type ProductDownload = {
  path: string;
  label: string;
};

export type Subscriber = {
  email: string;
  firstName: string;
  createdAt: string;
};

export type ProductRecord = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stripe_price_id: string;
  category: string;
  page_count: number;
  tagline: string;
  gradient: string;
  audience: string[];
  features: string[];
  featured: boolean;
  images: ProductImage[];
  downloads: ProductDownload[];
};

export type SubscriberRecord = {
  email: string;
  first_name: string;
  created_at: string;
};

export type SiteContentRecord = {
  key: string;
  value: SiteContent;
};

export type SiteContent = {
  heroHighlight: {
    title: string;
    description: string;
    pages: number;
    price: string;
  };
  valueProps: Array<{
    icon: string;
    title: string;
    description: string;
    accent: string;
  }>;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export type ContactSubmission = {
  name: string;
  email: string;
  message: string;
  createdAt: string;
};
