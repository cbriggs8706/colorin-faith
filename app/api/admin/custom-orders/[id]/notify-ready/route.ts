import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { sendCustomOrderReadyEmail } from "@/lib/custom-order-email";
import {
  getCustomOrderWithUrls,
  markCustomOrderReadyEmailSent,
  updateCustomOrderStatus,
} from "@/lib/custom-orders";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await getCustomOrderWithUrls(id);

    if (!order) {
      return NextResponse.json({ error: "Custom order not found." }, { status: 404 });
    }

    if (order.deliverables.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one finished file before sending the ready email." },
        { status: 400 },
      );
    }

    await sendCustomOrderReadyEmail(order);
    await markCustomOrderReadyEmailSent(id);
    await updateCustomOrderStatus(id, "delivered");

    const updatedOrder = await getCustomOrderWithUrls(id);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send ready email.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
