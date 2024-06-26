import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { json } from "~/db/custom-types"

export const answers = sqliteTable("answers", {
  answer: text("answer").primaryKey(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),

  example: text("example").notNull(),
  rating: integer("rating").notNull(),
})

export const answerRelations = relations(answers, ({ many }) => ({
  puzzleAnswers: many(puzzleAnswers),
}))

export const puzzles = sqliteTable("puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),

  date: text("date").notNull(),
  pack: text("pack"),
  idx: integer("idx").notNull(),
  grid: text("grid").notNull(),
})

export const puzzlesRelations = relations(puzzles, ({ many }) => ({
  puzzleAnswers: many(puzzleAnswers),
}))

export const puzzleAnswers = sqliteTable(
  "puzzle_answers",
  {
    puzzleId: integer("puzzle_id")
      .references(() => puzzles.id, { onDelete: "cascade" })
      .notNull(),
    answer: text("answer")
      .references(() => answers.answer, { onDelete: "cascade" })
      .notNull(),

    clue: text("clue").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.puzzleId, table.answer],
    }),
  }),
)

export const puzzleAnswersRelations = relations(puzzleAnswers, ({ one }) => ({
  puzzle: one(puzzles, {
    fields: [puzzleAnswers.puzzleId],
    references: [puzzles.id],
  }),
  answer: one(answers, {
    fields: [puzzleAnswers.answer],
    references: [answers.answer],
  }),
}))

export const solves = sqliteTable("solves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),

  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  puzzleId: integer("puzzle_id")
    .references(() => puzzles.id, { onDelete: "cascade" })
    .notNull(),

  time: integer("time").notNull(),
  streak: integer("streak").notNull(),
  xp: integer("xp").notNull(),
  moves: json("moves").notNull(),
  geohash: text("geohash"),
})

export const solvesRelations = relations(solves, ({ one }) => ({
  user: one(users, {
    fields: [solves.userId],
    references: [users.id],
  }),
  puzzle: one(puzzles, {
    fields: [solves.puzzleId],
    references: [puzzles.id],
  }),
}))

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),

  email: text("email").unique().notNull(),
  inviteCode: text("invite_code").unique().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  solves: many(solves),
  friendshipsLow: many(friendships, { relationName: "lowUser" }),
  friendshipsHigh: many(friendships, { relationName: "highUser" }),
}))

export const friendships = sqliteTable(
  "friendships",
  {
    lowUserId: integer("low_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    highUserId: integer("high_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.lowUserId, table.highUserId],
    }),
  }),
)

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  lowUser: one(users, {
    fields: [friendships.lowUserId],
    references: [users.id],
    relationName: "lowUser",
  }),
  highUser: one(users, {
    fields: [friendships.highUserId],
    references: [users.id],
    relationName: "highUser",
  }),
}))
