/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: FMCC1uYF84IPLrj/aW/sVd1bp+SAsKYXsFDVDFhd+RRxhX4ohwjgF9uN7mxbybuYYIZxSJ/sXnjQtwhQJLfRNw==
 */

// eslint:disable
// tslint:disable

interface DbDbMigrationsApplied {
  migration_name: string & {
    readonly __brand?: 'db_migrations_applied_migration_name';
  };
}
export default DbDbMigrationsApplied;

interface DbMigrationsApplied_InsertParameters {
  migration_name: string & {
    readonly __brand?: 'db_migrations_applied_migration_name';
  };
}
export type {DbMigrationsApplied_InsertParameters};