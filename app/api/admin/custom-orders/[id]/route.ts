import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getCustomOrderWithUrls, updateCustomOrderStatus } from "@/lib/custom-orders";
import type { CustomOrderStatus } from "@/lib/types";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteProps) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: CustomOrderStatus };

    if (!body.status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    await updateCustomOrderStatus(id, body.status);
    const order = await getCustomOrderWithUrls(id);

    if (!order) {
      return NextResponse.json({ error: "Custom order not found." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update custom order.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
