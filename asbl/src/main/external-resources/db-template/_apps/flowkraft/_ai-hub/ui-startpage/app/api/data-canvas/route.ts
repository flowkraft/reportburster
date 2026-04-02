import { NextRequest, NextResponse } from "next/server";
import { getAllCanvases, createCanvas } from "@/lib/db";

// GET /api/data-canvas — list all canvases
export async function GET() {
  const canvases = getAllCanvases();
  return NextResponse.json(canvases);
}

// POST /api/data-canvas — create a new canvas
export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const canvas = createCanvas({
    id,
    name: body.name || "Untitled Canvas",
    description: body.description || null,
    connectionId: body.connectionId || null,
    state: JSON.stringify({
      widgets: [],
      filters: [],
    }),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(canvas, { status: 201 });
}
