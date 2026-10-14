import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const users=sqliteTable("players",{id:text("id").primaryKey(),username:text("username").notNull().unique(),name:text("name").notNull(),salt:text("salt").notNull(),pinHash:text("pin_hash").notNull(),recoveryHash:text("recovery_hash").notNull(),createdAt:integer("created_at").notNull()});
export const sessions=sqliteTable("sessions",{hash:text("hash").primaryKey(),userId:text("user_id").notNull().references(()=>users.id),expiresAt:integer("expires_at").notNull()},t=>[index("sessions_user_idx").on(t.userId)]);
export const saves=sqliteTable("saves",{userId:text("user_id").primaryKey().references(()=>users.id),state:text("state").notNull(),version:integer("version").notNull().default(0),updatedAt:integer("updated_at").notNull()});
export const limits=sqliteTable("rate_limits",{key:text("key").primaryKey(),count:integer("count").notNull(),expiresAt:integer("expires_at").notNull()});
