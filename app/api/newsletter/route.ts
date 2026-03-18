import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      firstName?: string;
    };

    if (!body.email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await addSubscriber({
      email: body.email,
      firstName: body.firstName ?? "",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save subscriber.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
