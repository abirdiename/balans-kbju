import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { entries } from "../../../db/schema";

const number = (value: unknown) => Math.max(0, Number(value) || 0);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") ?? "";
  if (!clientId) return Response.json({ error: "invalid request" }, { status: 400 });

  const rows = await getDb().select({
    name: entries.name,
    calories: entries.calories,
    protein: entries.protein,
    fat: entries.fat,
    carbs: entries.carbs,
  }).from(entries).where(eq(entries.clientId, clientId)).orderBy(desc(entries.createdAt)).limit(200);

  const seen = new Set<string>();
  const foods = rows.filter((entry) => {
    const key = entry.name.trim().toLocaleLowerCase("ru-RU");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return Response.json({ foods });
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const clientId = String(body.clientId ?? "");
  const name = String(body.name ?? "").trim().slice(0, 100);
  const entryDate = String(body.date ?? "");
  if (!clientId || !name || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return Response.json({ error: "invalid entry" }, { status: 400 });
  const values = { clientId, entryDate, name, meal: String(body.meal ?? "Другое").slice(0, 30), calories: number(body.calories), protein: number(body.protein), fat: number(body.fat), carbs: number(body.carbs), createdAt: new Date().toISOString() };
  const db = getDb();
  const [entry] = await db.insert(entries).values(values).returning();
  return Response.json({ entry }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const clientId = String(body.clientId ?? "");
  const name = String(body.name ?? "").trim().slice(0, 100);
  const entryDate = String(body.date ?? "");
  if (!id || !clientId || !name || !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return Response.json({ error: "invalid entry" }, { status: 400 });

  const values = { entryDate, name, meal: String(body.meal ?? "Другое").slice(0, 30), calories: number(body.calories), protein: number(body.protein), fat: number(body.fat), carbs: number(body.carbs) };
  const [entry] = await getDb().update(entries).set(values).where(and(eq(entries.id, id), eq(entries.clientId, clientId))).returning();
  if (!entry) return Response.json({ error: "entry not found" }, { status: 404 });
  return Response.json({ entry });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const clientId = url.searchParams.get("clientId") ?? "";
  if (!id || !clientId) return Response.json({ error: "invalid request" }, { status: 400 });
  await getDb().delete(entries).where(and(eq(entries.id, id), eq(entries.clientId, clientId)));
  return Response.json({ ok: true });
}
