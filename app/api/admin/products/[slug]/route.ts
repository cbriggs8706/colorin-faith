import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/store";
import type { ProductInput } from "@/lib/types";

type ProductRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PUT(request: Request, { params }: ProductRouteProps) {
  try {
    const { slug } = await params;
    const payload = (await request.json()) as ProductInput;
    const product = await updateProduct(slug, payload);

    return NextResponse.json(product);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update product.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: ProductRouteProps,
) {
  try {
    const { slug } = await params;
    await deleteProduct(slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete product.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
