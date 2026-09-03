import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { entries, goals } from "../../../db/schema";

const defaults = { calories: 2100, protein: 120, fat: 70, carbs: 240 };
export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (!clientId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "invalid request" }, { status: 400 });
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.clientId, clientId)).limit(1);
  const dayEntries = await db.select().from(entries).where(and(eq(entries.clientId, clientId), eq(entries.entryDate, date))).orderBy(asc(entries.createdAt));
  return Response.json({ goals: goal ? { calories: goal.calories, protein: goal.protein, fat: goal.fat, carbs: goal.carbs } : defaults, entries: dayEntries });
}
