import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET all settings or by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    if (key) {
      // Get single setting by key
      const result = await db.select().from(settings).where(eq(settings.key, key));
      if (result.length === 0) {
        return NextResponse.json({ key, value: null }, { status: 200 });
      }
      return NextResponse.json(result[0]);
    }

    if (category) {
      // Get settings by category
      const result = await db.select().from(settings).where(eq(settings.category, category));
      return NextResponse.json(result);
    }

    // Get all settings
    const result = await db.select().from(settings);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST - create or update a setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, category = "general", description } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Check if setting exists
    const existing = await db.select().from(settings).where(eq(settings.key, key));

    if (existing.length > 0) {
      // Update existing
      await db
        .update(settings)
        .set({ 
          value, 
          category,
          description: description || existing[0].description,
          updatedAt: new Date().toISOString() 
        })
        .where(eq(settings.key, key));
    } else {
      // Insert new
      await db.insert(settings).values({
        key,
        value,
        category,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const result = await db.select().from(settings).where(eq(settings.key, key));
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error saving setting:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}

// PUT - bulk update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings: settingsData } = body;

    if (!Array.isArray(settingsData)) {
      return NextResponse.json({ error: "Settings array required" }, { status: 400 });
    }

    const results = [];
    for (const setting of settingsData) {
      const { key, value, category = "general", description } = setting;
      if (!key) continue;

      const existing = await db.select().from(settings).where(eq(settings.key, key));

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value, category, updatedAt: new Date().toISOString() })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({
          key,
          value,
          category,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      results.push({ key, value, category });
    }

    return NextResponse.json({ saved: results.length, settings: results });
  } catch (error) {
    console.error("Error bulk saving settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
