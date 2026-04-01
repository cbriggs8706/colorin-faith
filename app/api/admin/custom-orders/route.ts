import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getAllCustomOrdersWithUrls } from "@/lib/custom-orders";

export async function GET() {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await getAllCustomOrdersWithUrls());
}
