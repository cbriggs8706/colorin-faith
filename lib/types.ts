export const STANDARD_VARIANT_PAGE_COUNTS = [1, 4, 9, 16, 25, 36] as const;
export const CUSTOM_PRODUCT_PAGE_COUNTS = [
  1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48,
] as const;
export const CUSTOM_PRODUCT_COLOR_COUNTS = [12, 24, 36, 48] as const;
export const CUSTOM_PRODUCT_HEX_WIDTH_MIN = 20;
export const CUSTOM_PRODUCT_HEX_WIDTH_MAX = 46;
export const CUSTOM_ORDER_STATUSES = [
  "received",
  "in_review",
  "in_progress",
  "completed",
  "delivered",
] as const;

export type VariantPricing = {
  pageCount: number;
  price: number;
};

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
  relatedProducts: string[];
  featured: boolean;
  listingImagePath: string;
  images: ProductImage[];
  downloads: ProductDownload[];
  variants: ProductVariant[];
};

export type ProductInput = Product;

export type CartItem = {
  slug: string;
  variantId: string;
  quantity: number;
};

export type ProductImage = {
  path: string;
  alt: string;
};

export type ProductDownload = {
  path: string;
  label: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  stripePriceId: string;
  pageCount: number;
  imagePath?: string;
  downloads: ProductDownload[];
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
  related_products?: string[];
  featured: boolean;
  listing_image_path: string;
  images: ProductImage[];
  downloads: ProductDownload[];
  variants?: ProductVariant[];
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
  homepage: {
    shop: {
      eyebrow: string;
      title: string;
      description: string;
      emptyState: string;
    };
    howItWorks: {
      eyebrow: string;
      title: string;
    };
    newsletter: {
      eyebrow: string;
      title: string;
      description: string;
      formHeading: string;
      formSubheading: string;
    };
  };
  productPage: {
    aboutPrintableEyebrow: string;
    perfectForEyebrow: string;
    afterPurchaseTitle: string;
    afterPurchaseDescription: string;
    browseMoreLabel: string;
    newsletterHeading: string;
    newsletterSubheading: string;
  };
  contactPage: {
    profileEyebrow: string;
    profileTitle: string;
    profileDescription: string;
    profileImagePath: string;
    profileImageAlt: string;
  };
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
  variantPricing: VariantPricing[];
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

export type PurchasedItem = {
  slug: string;
  name: string;
  variantId: string;
  variantName: string;
  pageCount: number;
  quantity: number;
  amountTotal: number | null;
  downloads: Array<{ label: string; path: string; signedUrl: string }>;
};

export type CustomProductPagePrice = {
  pageCount: number;
  stripePriceId: string;
  unitAmount: number | null;
  currency: string | null;
};

export type CustomProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredDescription: string;
  ctaLabel: string;
  gradient: string;
  active: boolean;
  listingImagePath: string;
  images: ProductImage[];
  pagePrices: CustomProductPagePrice[];
};

export type CustomProductInput = CustomProduct;

export type CustomProductRecord = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  featured_eyebrow: string;
  featured_title: string;
  featured_description: string;
  cta_label: string;
  gradient: string;
  active: boolean;
  listing_image_path: string;
  images: ProductImage[];
  page_prices: CustomProductPagePrice[];
};

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

export type CustomOrderDeliverable = {
  path: string;
  label: string;
};

export type CustomOrderRecord = {
  id: string;
  stripe_session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  product_slug: string;
  product_name: string;
  page_count: number;
  color_count: number;
  hex_width: number;
  source_file_path: string;
  source_file_name: string;
  source_file_content_type: string | null;
  permission_confirmed: boolean;
  status: CustomOrderStatus;
  deliverables: CustomOrderDeliverable[];
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  paid_at: string | null;
  admin_notified_at: string | null;
  ready_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomOrderWithUrls = {
  order: CustomOrderRecord;
  sourceFileUrl: string | null;
  deliverables: Array<CustomOrderDeliverable & { signedUrl: string }>;
};

export const PRODUCT_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export const PRODUCT_REVIEW_TYPES = ["standard", "custom"] as const;

export type ProductReviewStatus = (typeof PRODUCT_REVIEW_STATUSES)[number];
export type ProductReviewType = (typeof PRODUCT_REVIEW_TYPES)[number];

export type ProductReviewRecord = {
  id: string;
  customer_email: string;
  customer_name: string | null;
  review_type: ProductReviewType;
  order_id: string;
  product_slug: string;
  product_name: string;
  variant_id: string | null;
  rating: number;
  title: string;
  review: string;
  photo_paths: string[];
  status: ProductReviewStatus;
  created_at: string;
  updated_at: string;
};

export type ProductReviewWithUrls = {
  review: ProductReviewRecord;
  photoUrls: Array<{
    path: string;
    signedUrl: string;
  }>;
};
