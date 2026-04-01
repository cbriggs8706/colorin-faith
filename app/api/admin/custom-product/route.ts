import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getCustomProduct, saveCustomProduct } from "@/lib/custom-product-store";
import type { CustomProductInput } from "@/lib/types";

export async function GET() {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await getCustomProduct());
}

export async function PUT(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as CustomProductInput;
    const product = await saveCustomProduct(payload);
    return NextResponse.json(product);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save custom product.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
