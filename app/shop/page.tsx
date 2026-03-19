import { redirect } from "next/navigation";

export const metadata = {
  title: "Shop",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const selectedCategory = (await searchParams).category;
  const firstCategory = Array.isArray(selectedCategory) ? selectedCategory[0] : selectedCategory;

  redirect(firstCategory ? `/?category=${encodeURIComponent(firstCategory)}#shop` : "/#shop");
}
