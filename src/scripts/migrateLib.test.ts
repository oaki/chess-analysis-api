import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {computeChecksum, isChecksumMismatch, isPending, listMigrationFiles, planMigrations} from "./migrateLib";

describe("computeChecksum", () => {
    it("is deterministic for the same content", () => {
        expect(computeChecksum("CREATE TABLE x();")).toBe(computeChecksum("CREATE TABLE x();"));
    });

    it("differs for different content", () => {
        expect(computeChecksum("CREATE TABLE x();")).not.toBe(computeChecksum("CREATE TABLE y();"));
    });
});

describe("listMigrationFiles", () => {
    let migrationsDir: string;

    beforeEach(() => {
        migrationsDir = fs.mkdtempSync(path.join(os.tmpdir(), "migrations-test-"));
    });

    afterEach(() => {
        fs.rmSync(migrationsDir, {recursive: true, force: true});
    });

    it("reads NNNN_description.sql files in filename order", () => {
        fs.writeFileSync(path.join(migrationsDir, "0002_second.sql"), "SELECT 2;");
        fs.writeFileSync(path.join(migrationsDir, "0001_first.sql"), "SELECT 1;");

        const files = listMigrationFiles(migrationsDir);

        expect(files.map((f) => f.filename)).toEqual(["0001_first.sql", "0002_second.sql"]);
        expect(files[0].sql).toBe("SELECT 1;");
        expect(files[0].checksum).toBe(computeChecksum("SELECT 1;"));
    });

    it("ignores files that don't match the NNNN_description.sql convention", () => {
        fs.writeFileSync(path.join(migrationsDir, "0001_valid.sql"), "SELECT 1;");
        fs.writeFileSync(path.join(migrationsDir, "README.md"), "not a migration");
        fs.writeFileSync(path.join(migrationsDir, ".gitkeep"), "");

        const files = listMigrationFiles(migrationsDir);

        expect(files.map((f) => f.filename)).toEqual(["0001_valid.sql"]);
    });
});

describe("planMigrations", () => {
    const fileA = {filename: "0001_a.sql", filePath: "/x/0001_a.sql", sql: "A", checksum: computeChecksum("A")};
    const fileB = {filename: "0002_b.sql", filePath: "/x/0002_b.sql", sql: "B", checksum: computeChecksum("B")};

    it("treats every file as pending when nothing has been applied yet", () => {
        const plan = planMigrations([fileA, fileB], []);

        expect(plan).toEqual([
            {status: "pending", migration: fileA},
            {status: "pending", migration: fileB},
        ]);
    });

    it("skips a file whose checksum matches what was already applied", () => {
        const plan = planMigrations([fileA, fileB], [{filename: "0001_a.sql", checksum: fileA.checksum}]);

        expect(plan).toEqual([{status: "pending", migration: fileB}]);
    });

    it("flags a file whose content changed after it was applied", () => {
        const plan = planMigrations([fileA], [{filename: "0001_a.sql", checksum: "stale-checksum"}]);

        expect(plan).toEqual([{
            status: "checksum-mismatch",
            migration: fileA,
            appliedChecksum: "stale-checksum",
        }]);
    });

    it("returns nothing once every file is applied and unchanged", () => {
        const plan = planMigrations(
            [fileA, fileB],
            [
                {filename: "0001_a.sql", checksum: fileA.checksum},
                {filename: "0002_b.sql", checksum: fileB.checksum},
            ],
        );

        expect(plan).toEqual([]);
    });
});

describe("isPending / isChecksumMismatch", () => {
    const migration = {filename: "0001_a.sql", filePath: "/x/0001_a.sql", sql: "A", checksum: "c"};

    it("narrow a plan entry by its status", () => {
        const pendingEntry = {status: "pending" as const, migration};
        const mismatchEntry = {status: "checksum-mismatch" as const, migration, appliedChecksum: "old"};

        expect(isPending(pendingEntry)).toBe(true);
        expect(isPending(mismatchEntry)).toBe(false);
        expect(isChecksumMismatch(mismatchEntry)).toBe(true);
        expect(isChecksumMismatch(pendingEntry)).toBe(false);
    });
});
