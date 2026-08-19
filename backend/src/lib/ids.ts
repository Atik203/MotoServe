import { Prisma } from "../generated/prisma/client.js";

/**
 * Allocates a max-suffix id (e.g. JC-1046) and creates the row inside a retry
 * loop so concurrent creations cannot collide on the same suffix (P2002).
 */
export async function createWithSequentialId<T>(
  delegate: any,
  prefix: string,
  base: number,
  buildArgs: (id: string) => Record<string, unknown>,
  idField = "id",
): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const latest = await delegate.findFirst({
      where: { [idField]: { startsWith: prefix } },
      orderBy: { [idField]: "desc" },
      select: { [idField]: true },
    });
    const computed = latest ? parseInt(String((latest as Record<string, string>)[idField]).slice(prefix.length), 10) || 0 : 0;
    const id = `${prefix}${String(Math.max(base, computed) + 1).padStart(4, "0")}`;
    try {
      return await delegate.create(buildArgs(id));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Unable to allocate a unique id with prefix "${prefix}"`);
}
