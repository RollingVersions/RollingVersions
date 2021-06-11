const {sql} = require('@databases/pg');

module.exports = async function applyMigration(db) {
  const refs = await db.query(
    sql`SELECT * FROM git_refs WHERE kind = 'pull' AND (pr_number IS NULL OR pr_ref_kind IS NULL)`,
  );
  const updates = refs
    .map((ref) => {
      const match = /^(\d+)\/(head|merge)$/.exec(ref.refName);
      return (
        match && {
          ...ref,
          pr_number: parseInt(match[1], 10),
          pr_ref_kind: match[2],
        }
      );
    })
    .filter(Boolean);
  if (updates.length) {
    await db.query(sql`
      UPDATE git_refs
      SET pr_number = updates.pr_number, pr_ref_kind = updates.pr_ref_kind
      FROM (
        SELECT
          unnest(${updates.map(
            (u) => u.git_repository_id,
          )}::BIGINT[]) AS git_repository_id,
          unnest(${updates.map((u) => u.kind)}::TEXT[]) AS kind,
          unnest(${updates.map((u) => u.name)}::TEXT[]) AS name,
          unnest(${updates.map((u) => u.pr_number)}::BIGINT[]) AS pr_number,
          unnest(${updates.map((u) => u.pr_ref_kind)}::TEXT[]) AS pr_ref_kind
      ) AS updates
      WHERE git_refs.git_repository_id = updates.git_repository_id
        AND git_refs.kind = updates.kind
        AND git_refs.name = updates.name
    `);
  }
};
