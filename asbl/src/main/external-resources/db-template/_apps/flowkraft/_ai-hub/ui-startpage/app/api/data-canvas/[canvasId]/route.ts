import { NextRequest, NextResponse } from "next/server";
import { getCanvas, updateCanvas, deleteCanvas } from "@/lib/db";

type RouteContext = { params: Promise<{ canvasId: string }> };

// GET /api/data-canvas/[canvasId]
export async function GET(_request: NextRequest, context: RouteContext) {
  const { canvasId } = await context.params;
  const canvas = getCanvas(canvasId);
  if (!canvas) {
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }
  return NextResponse.json(canvas);
}

// PUT /api/data-canvas/[canvasId]
export async function PUT(request: NextRequest, context: RouteContext) {
  const { canvasId } = await context.params;
  const body = await request.json();

  const updated = updateCanvas(canvasId, {
    name: body.name,
    description: body.description,
    connectionId: body.connectionId,
    state: body.state,
  });

  if (!updated) {
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

// DELETE /api/data-canvas/[canvasId]
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { canvasId } = await context.params;
  deleteCanvas(canvasId);
  return NextResponse.json({ ok: true });
}
