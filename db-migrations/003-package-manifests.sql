ALTER TABLE package_manifest_records
  ADD COLUMN target_config JSON;

UPDATE package_manifest_records SET target_config = CAST(concat('{"publishConfigAccess": "', publish_access, '"}') AS JSON);

ALTER TABLE package_manifest_records
  ALTER COLUMN target_config SET NOT NULL;

-- TODO DROP publish_access column