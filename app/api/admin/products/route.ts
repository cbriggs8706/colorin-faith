import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { createProduct, getProducts } from "@/lib/store";
import type { ProductInput } from "@/lib/types";

export async function GET() {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const products = await getProducts();

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as ProductInput;
    const product = await createProduct(payload);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create product.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
