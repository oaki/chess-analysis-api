import "dotenv/config";
import * as path from "path";
import {Client} from "pg";
import {getBasePath, getConfig} from "../config";
import {logger} from "../libs/logger";
import {
    AppliedMigration,
    isChecksumMismatch,
    isPending,
    listMigrationFiles,
    MigrationFile,
    planMigrations,
} from "./migrateLib";

const MIGRATIONS_TABLE = "schema_migrations";

async function ensureMigrationsTable(client: Client): Promise<void> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            checksum VARCHAR(64) NOT NULL,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}

async function fetchAppliedMigrations(client: Client): Promise<AppliedMigration[]> {
    const result = await client.query<AppliedMigration>(
        `SELECT filename, checksum FROM ${MIGRATIONS_TABLE} ORDER BY id`,
    );

    return result.rows;
}

async function applyMigration(client: Client, migration: MigrationFile): Promise<void> {
    await client.query("BEGIN");

    try {
        await client.query(migration.sql);
        await client.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum) VALUES ($1, $2)`,
            [migration.filename, migration.checksum],
        );
        await client.query("COMMIT");
        logger.info({filename: migration.filename}, "migration applied");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
}

async function run(): Promise<void> {
    const isDryRun = process.argv.includes("--dry-run");
    const config = getConfig();
    const migrationsDir = path.resolve(getBasePath(), "db/migrations");

    const client = new Client({
        host: config.evaluationDatabase.host,
        port: Number(config.evaluationDatabase.port),
        user: config.evaluationDatabase.user,
        password: config.evaluationDatabase.password,
        database: config.evaluationDatabase.database,
    });

    await client.connect();

    try {
        await ensureMigrationsTable(client);

        const available = listMigrationFiles(migrationsDir);
        const applied = await fetchAppliedMigrations(client);
        const plan = planMigrations(available, applied);

        const mismatches = plan.filter(isChecksumMismatch);

        if (mismatches.length > 0) {
            mismatches.forEach((entry) => {
                logger.error({
                    filename: entry.migration.filename,
                    appliedChecksum: entry.appliedChecksum,
                    currentChecksum: entry.migration.checksum,
                }, "migration file changed after it was already applied — refusing to run. "
                    + "Fix forward with a new migration file instead of editing this one.");
            });
            process.exitCode = 1;
            return;
        }

        const pending = plan.filter(isPending);

        if (pending.length === 0) {
            logger.info("no pending migrations");
            return;
        }

        logger.info({
            count: pending.length,
            files: pending.map((entry) => entry.migration.filename),
        }, isDryRun ? "pending migrations (dry run, not applying)" : "applying pending migrations");

        if (isDryRun) {
            return;
        }

        // Sequential on purpose — migrations must apply in order, one at a time.
        for (const entry of pending) {
            await applyMigration(client, entry.migration);
        }

        logger.info({count: pending.length}, "all migrations applied");
    } finally {
        await client.end();
    }
}

run().catch((error: unknown) => {
    logger.error({err: error}, "migration run failed");
    process.exitCode = 1;
});
