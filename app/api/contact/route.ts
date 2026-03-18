import { NextResponse } from "next/server";
import { getAdminEmails } from "@/lib/supabase/env";

function validateEmail(email: string) {
  return email.includes("@") && email.includes(".");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const adminEmails = getAdminEmails();
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.CONTACT_FROM_EMAIL ?? "Color in Faith <onboarding@resend.dev>";

    if (adminEmails.length === 0) {
      throw new Error("Missing ADMIN_EMAILS environment variable.");
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: adminEmails,
        reply_to: email,
        subject: `New contact form message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message ?? "Unable to send contact email.");
    }

    return NextResponse.json({
      message: "Thanks for reaching out. Your message has been sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send message.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
