# Prisma migration baseline for hosted database

This project previously used `prisma db push` in container startup. Since the
hosted database already has real data, move to migration-based deploys with a
baseline step so existing schema is preserved.

## One-time hosted baseline

1. Create and commit a baseline migration that represents the currently hosted schema.
2. Mark that baseline as already applied in the hosted database:

```bash
npx prisma migrate resolve --applied <baseline_migration_name>
```

3. Deploy the app with migration startup enabled (`prisma migrate deploy`).

## Ongoing deploys

- Commit every new migration under `prisma/migrations/`.
- Container startup runs `npx prisma migrate deploy`.
- Avoid `prisma db push` for hosted/production flows.
