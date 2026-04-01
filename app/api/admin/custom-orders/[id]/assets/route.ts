import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  CUSTOM_ORDER_BUCKET,
  createCustomOrderStoragePath,
  isAllowedCustomOrderFile,
} from "@/lib/custom-order-assets";
import {
  addCustomOrderDeliverable,
  getCustomOrderById,
  getCustomOrderWithUrls,
  removeCustomOrderDeliverable,
} from "@/lib/custom-orders";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured for this environment." },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const order = await getCustomOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Custom order not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const label = String(formData.get("label") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!isAllowedCustomOrderFile(file)) {
      return NextResponse.json({ error: "Upload a supported file type." }, { status: 400 });
    }

    const path = createCustomOrderStoragePath(id, "deliverable", file.name);
    const supabase = createSupabaseServiceRoleClient();
    const upload = await supabase.storage
      .from(CUSTOM_ORDER_BUCKET)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    await addCustomOrderDeliverable(id, {
      path,
      label: label || file.name,
    });

    const updatedOrder = await getCustomOrderWithUrls(id);

    if (!updatedOrder) {
      return NextResponse.json({ error: "Custom order not found." }, { status: 404 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload deliverable.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured for this environment." },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { path?: string };

    if (!body.path) {
      return NextResponse.json({ error: "Path is required." }, { status: 400 });
    }

    const supabase = createSupabaseServiceRoleClient();
    const removal = await supabase.storage.from(CUSTOM_ORDER_BUCKET).remove([body.path]);

    if (removal.error) {
      throw new Error(removal.error.message);
    }

    await removeCustomOrderDeliverable(id, body.path);
    const updatedOrder = await getCustomOrderWithUrls(id);

    if (!updatedOrder) {
      return NextResponse.json({ error: "Custom order not found." }, { status: 404 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove deliverable.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
