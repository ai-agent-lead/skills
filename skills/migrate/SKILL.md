---
name: migrate
description: Changes a database schema or rewrites stored data in safe steps — expand, backfill, switch reads, contract — so no deploy locks a busy table, breaks running code, or loses data. Use when a change adds, renames, retypes, or drops a column, table, index, or constraint on a database with real data, or rewrites existing rows. Triggered by "database migration", "schema change", "rename a column", "backfill". Not for choosing a database or data model → `investigate`; not for the application code of each step → `tdd`; not for changing libraries or frameworks → `upgrade` (a new major of the same one) or `investigate` (a different one).
---

# Migrate

A schema change is a deploy you can't undo by reverting code. This skill splits it into steps that are each safe on their own, so any deploy can roll back to the one before.

## Why this skill exists

Agents write one migration that renames a column and change the code in the same deploy. Three things then go wrong:

```
 deploy starts ──► migration renames name → full_name
                   old instances still running: SELECT name ...  ✗ errors
 roll back code ─► old code expects `name`, column is gone        ✗ still broken
 big table ──────► ALTER holds a lock for minutes                 ✗ writes stall
```

The fix is never "be careful". It is to change the shape in steps that old and new code can both survive.

## When to use

- Adding, renaming, retyping, or dropping a column, table, index, or constraint on a database that holds real data.
- Adding `NOT NULL`, a foreign key, or a unique constraint to data that already exists.
- Backfilling or rewriting existing rows.
- Splitting or merging tables.

## When to skip

- A brand-new table nothing reads yet — still write a migration file, but one step is enough.
- A dev or test database with no data worth keeping.
- Choosing the database, the data model, or whether to denormalize → [`investigate`](../investigate/SKILL.md).

## The core pattern — expand, migrate, contract

```
 step 1  EXPAND     add the new shape next to the old one
                    app writes BOTH, reads OLD        ← old code still fine
 step 2  BACKFILL   copy old → new in small batches   ← resumable job
 step 3  SWITCH     app reads NEW, still writes both  ← can roll back to step 2
 step 4  CONTRACT   stop writing old, then drop it    ← only after a full release cycle
```

Each step is its own migration **and** its own deploy. Never combine a schema step with the code that depends on it in one deploy.

## Risky operations and the safe way

Postgres is shown; MySQL notes where they differ. Check your engine version's docs — lock behavior changes between versions.

| Change | What goes wrong | Safe way |
| --- | --- | --- |
| Add a nullable column, or one with a constant default | Usually nothing (Postgres 11+ is instant) | One step |
| Add an index to a big table | Plain `CREATE INDEX` blocks writes | `CREATE INDEX CONCURRENTLY`, outside a transaction. MySQL: `ALGORITHM=INPLACE, LOCK=NONE` |
| Add `NOT NULL` to an existing column | Full scan under a lock | Add `CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` → `SET NOT NULL` |
| Add a foreign key | Checks every row under a lock | `ADD CONSTRAINT … NOT VALID` → `VALIDATE CONSTRAINT` |
| Rename a column or table | Running code still uses the old name | Expand / contract: new column, dual-write, backfill, switch, drop |
| Change a column type | Table rewrite and lock | New column of the new type, then expand / contract |
| Drop a column | Old instances still read it | Stop reading it, deploy, then drop in a later deploy |
| Backfill rows | One long transaction, replica lag, lock pile-up | Batches of 1k–10k rows by key, a short pause between, safe to re-run |

## Process

### 1. Size the risk

List every schema operation in the change. For each touched table, get the row count and write rate (`SELECT reltuples FROM pg_class WHERE relname = '<table>'`, or `SELECT COUNT(*)` on a replica). Mark each operation against the table above. Small table + safe operation → one step is fine; anything else → plan steps.

### 2. Write the plan

Add a `## Migration plan` section to the feature doc (or a short `docs/research/<name>-migration.md` for a big change). One row per deploy:

| Step | Migration | App change | Roll back by | Done when |
| --- | --- | --- | --- | --- |
| 1 Expand | add `full_name` (nullable) | write both columns | deploy previous app | new rows have both |
| 2 Backfill | — (job) | none | stop the job | 0 rows missing `full_name` |
| 3 Switch | — | read `full_name` | deploy step-1 app | errors flat for a day |
| 4 Contract | drop `name` | stop writing `name` | restore from backup only | one release cycle after step 3 |

The last column of step 4 is honest: once a column is dropped, only a backup brings it back. That's why contract waits.

### 3. Write the migrations

- One migration file per step, with the project's tool — Go: `goose`, `golang-migrate`, `atlas`; JS: `knex`, `prisma migrate`, `drizzle-kit`, `node-pg-migrate`.
- **Idempotent:** `IF NOT EXISTS` / `IF EXISTS`, so a half-applied deploy can re-run.
- **A down migration**, or a written reason why down would lose data and what the forward fix is instead.
- **Never edit a migration that already ran** anywhere shared. Add a new one.
- **Backfills are jobs, not schema migrations** — a big `UPDATE` inside a migration transaction is the lock pile-up in the table above.

A concurrent index in a knex migration:

```js
export const config = { transaction: false };

export async function up(knex) {
  // WHY: CONCURRENTLY avoids blocking writes and can't run inside a transaction.
  await knex.raw('CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_user_id_idx ON orders (user_id)');
}

export async function down(knex) {
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS orders_user_id_idx');
}
```

A resumable backfill in Go:

```go
// BackfillFullName copies users.name into users.full_name in batches.
// Safe to stop and re-run: it only touches rows still missing full_name.
func BackfillFullName(ctx context.Context, db *sql.DB) error {
	for {
		res, err := db.ExecContext(ctx, `
			UPDATE users SET full_name = name
			WHERE id IN (SELECT id FROM users WHERE full_name IS NULL LIMIT 5000)`)
		if err != nil {
			return fmt.Errorf("backfill full_name: %w", err)
		}
		n, err := res.RowsAffected()
		if err != nil || n == 0 {
			return err
		}
		// WHY: a short pause keeps replica lag low on a busy primary.
		time.Sleep(100 * time.Millisecond)
	}
}
```

### 4. Test before it runs for real

- **Up → down → up** on a fresh database: the migration and its rollback both work.
- **Old code against the new schema:** run the previous app version's tests against the expanded schema. This is the check that proves step 1 is safe to deploy.
- **Realistic size:** time the migration and the backfill on a copy with production-like row counts (or a seeded dataset of the same order). A 50 ms migration on 100 rows can be a 20-minute lock on 50 million.

### 5. Ship one step at a time

- Each step is its own PR and deploy. Check "Done when" before starting the next.
- Run migrations **once per deploy** (a release job, or the tool's lock), not from every app instance at start-up.
- Contract (step 4) waits at least one full release cycle after the switch. Track it with a `TODO(owner):` in the code that still writes the old column, or a follow-up issue.

## Anti-patterns

- **Rename in one step.** Old instances break during the deploy, and a code rollback can't find the column.
- **Schema change and dependent code in one deploy.** There is no safe order to roll back to.
- **Backfill inside the migration transaction.** Long locks, replica lag, and a timeout that rolls back all the work.
- **A `down` that silently drops data.** Say it loses data, or don't pretend it's a rollback.
- **Editing an applied migration.** Environments that already ran it never see the change.
- **Contract right after switch.** The first bad day after the switch has nowhere to roll back to.

## Pairing with other skills

- **[`feature-doc`](../feature-doc/SKILL.md)** — runs before; the migration plan is a section of the feature doc.
- **[`tdd`](../tdd/SKILL.md)** — builds the app change for each step (dual-write, switch reads). The migration steps are what make those changes deployable.
- **[`prod-ready`](../prod-ready/SKILL.md)** — its database section checks that schema changes followed this skill.
- **[`security-review`](../security-review/SKILL.md)** — escalate when a new column holds sensitive data (PII, tokens).
- **[`upgrade`](../upgrade/SKILL.md)** — for moving to a new major version of the database engine or ORM itself.

## Done when

- The plan lists every deploy step with how to roll it back and how to know it's done.
- Each step has its own idempotent migration, tested up → down → up.
- The previous app version passes its tests against the expanded schema.
- Backfills are batched, resumable, and finished (0 rows left) before the switch.
- The contract step is scheduled after a full release cycle, with an owner.
- Commits follow [`COMMIT-FORMAT.md`](../formats/COMMIT-FORMAT.md) and name the step (`feat(db): expand users with full_name (step 1/4)`).
