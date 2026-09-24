import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export type MigrationFile = {
    filename: string;
    filePath: string;
    sql: string;
    checksum: string;
};

export type AppliedMigration = {
    filename: string;
    checksum: string;
};

export type MigrationPlanEntry =
    | {status: "pending"; migration: MigrationFile}
    | {status: "checksum-mismatch"; migration: MigrationFile; appliedChecksum: string};

const MIGRATION_FILE_PATTERN = /^\d{4}_[\w-]+\.sql$/;

export function computeChecksum(sql: string): string {
    return crypto.createHash("sha256").update(sql, "utf-8").digest("hex");
}

/**
 * Reads every `NNNN_description.sql` file from a migrations directory, in
 * filename order. Anything not matching that naming convention is ignored
 * rather than erroring, so a stray README or .gitkeep doesn't break a run.
 */
export function listMigrationFiles(migrationsDir: string): MigrationFile[] {
    const filenames = fs.readdirSync(migrationsDir)
        .filter((entry) => MIGRATION_FILE_PATTERN.test(entry))
        .sort();

    return filenames.map((filename) => {
        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, "utf-8");

        return {filename, filePath, sql, checksum: computeChecksum(sql)};
    });
}

export function isPending(
    entry: MigrationPlanEntry,
): entry is Extract<MigrationPlanEntry, {status: "pending"}> {
    return entry.status === "pending";
}

export function isChecksumMismatch(
    entry: MigrationPlanEntry,
): entry is Extract<MigrationPlanEntry, {status: "checksum-mismatch"}> {
    return entry.status === "checksum-mismatch";
}

/**
 * Diffs the migration files on disk against what the schema_migrations table
 * already recorded. A file whose content changed after it was applied comes
 * back as "checksum-mismatch" rather than being silently skipped or re-run —
 * editing an already-applied migration is almost always a mistake (the fix
 * belongs in a new migration file instead).
 */
export function planMigrations(
    available: readonly MigrationFile[],
    applied: readonly AppliedMigration[],
): MigrationPlanEntry[] {
    const appliedByFilename = new Map(applied.map((entry) => [entry.filename, entry]));
    const plan: MigrationPlanEntry[] = [];

    for (const migration of available) {
        const appliedEntry = appliedByFilename.get(migration.filename);

        if (appliedEntry === undefined) {
            plan.push({status: "pending", migration});
        } else if (appliedEntry.checksum !== migration.checksum) {
            plan.push({status: "checksum-mismatch", migration, appliedChecksum: appliedEntry.checksum});
        }
    }

    return plan;
}
