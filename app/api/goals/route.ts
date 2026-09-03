import { getDb } from "../../../db";
import { goals } from "../../../db/schema";

const number = (value: unknown) => Math.max(0, Number(value) || 0);
export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const clientId = String(body.clientId ?? "");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const values = { clientId, calories: number(body.calories), protein: number(body.protein), fat: number(body.fat), carbs: number(body.carbs) };
  const db = getDb();
  await db.insert(goals).values(values).onConflictDoUpdate({ target: goals.clientId, set: values });
  return Response.json({ goals: values });
}
