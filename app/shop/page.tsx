import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/store";

export const metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-8 py-6 sm:py-8">
      <section className="card-surface rounded-[2rem] px-5 py-8 sm:px-8">
        <p className="pill-label w-fit text-[var(--brand-coral)]">Digital shop</p>
        <h1 className="section-title mt-3 text-4xl font-extrabold text-[var(--brand-ink)] sm:text-5xl">
          Printable coloring pages for joyful, screen-free moments.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Every product here is an instant digital download. Use these pages for
          family devotion time, Sunday school, Christian classrooms, party tables,
          and everyday creative encouragement.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </section>
    </div>
  );
}
