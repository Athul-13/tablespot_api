# Prisma client and "property does not exist on PrismaClient"

## Why the error happens

TypeScript gets the `PrismaClient` type from `@prisma/client`. The **model delegates** (`restaurant`, `comment`, `rating`, etc.) are added to that type only after the Prisma client is **generated** from `prisma/schema.prisma` via:

```bash
npx prisma generate
```

So you can see "property does not exist on PrismaClient" when:

1. **Fresh clone or new install** – You ran `npm install` but never ran `prisma generate`, so the generated types in `node_modules/.prisma/client` don’t include the new models yet.
2. **Schema changed** – You added or renamed models in `schema.prisma` but haven’t run `prisma generate` since.
3. **IDE/TypeScript cache** – The editor or language service is using an old version of the types.

## What we do in this project

- **`postinstall`: `prisma generate`** in `package.json` – After every `npm install`, the client is generated so `restaurant`, `comment`, `rating` exist at runtime and in the generated types.
- **Repository code** – The restaurant, comment, and rating repositories use a small type assertion (a private `db` getter) so they compile even when your environment’s `PrismaClient` type is missing those delegates (e.g. before the first generate or due to cache).

## If you still see the error

1. From the `server` directory run:
   ```bash
   npx prisma generate
   ```
2. Restart the TypeScript server / IDE so it picks up the new types.
3. Confirm `node_modules/.prisma/client` (and, if present, `node_modules/@prisma/client`) were updated (e.g. check that the generated files mention your models).
