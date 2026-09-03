import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull(),
  calories: real("calories").notNull().default(2100),
  protein: real("protein").notNull().default(120),
  fat: real("fat").notNull().default(70),
  carbs: real("carbs").notNull().default(240),
}, (table) => [uniqueIndex("goals_client_idx").on(table.clientId)]);

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull(),
  entryDate: text("entry_date").notNull(),
  name: text("name").notNull(),
  meal: text("meal").notNull(),
  calories: real("calories").notNull().default(0),
  protein: real("protein").notNull().default(0),
  fat: real("fat").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
