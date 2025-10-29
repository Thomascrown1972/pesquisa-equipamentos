import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de equipamentos importados de ficheiros Excel
 */
export const equipments = mysqlTable("equipments", {
  id: int("id").autoincrement().primaryKey(),
  categoria: text("categoria"),
  subcategoria: text("subcategoria"),
  marca: text("marca"),
  modelo: text("modelo"),
  cor: text("cor"),
  compatibilidades: text("compatibilidades"),
  cicloVida: text("cicloVida"),
  observacoes: text("observacoes"),
  codSap: varchar("codSap", { length: 64 }),
  pvpSemIva: varchar("pvpSemIva", { length: 32 }),
  pvpComIva: varchar("pvpComIva", { length: 32 }),
  garantia: text("garantia"),
  assistenciaTecnica: text("assistenciaTecnica"),
  fichasProduto: text("fichasProduto"),
  dataLancamento: timestamp("dataLancamento"),
  dataDescontinuacao: timestamp("dataDescontinuacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = typeof equipments.$inferInsert;

/**
 * Tabela de mensagens do chatbot
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;