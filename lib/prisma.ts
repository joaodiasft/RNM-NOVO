import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

/**
 * Cloudflare Workers isolam I/O por request. Reutilizar PrismaClient / conexão
 * Neon entre requests causa:
 * "Cannot perform I/O on behalf of a different request" (Error 1101).
 *
 * Solução: cliente novo a cada acesso em produção (Workers).
 * Em desenvolvimento (Node), mantemos singleton para conforto do hot-reload.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }

  const adapter = new PrismaNeonHTTP(connectionString, { fullResults: true });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prismaDev?: PrismaClient;
};

function clientForRequest(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prismaDev) {
      globalForPrisma.prismaDev = createPrismaClient();
    }
    return globalForPrisma.prismaDev;
  }
  return createPrismaClient();
}

function proxyModel(client: PrismaClient, modelKey: string) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        const model = (client as unknown as Record<string, unknown>)[modelKey] as Record<
          string,
          unknown
        >;
        const value = model[prop as string];
        return typeof value === "function" ? value.bind(model) : value;
      },
    }
  );
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = clientForRequest();
    const key = prop as string | symbol;

    if (typeof key === "symbol") {
      return (client as unknown as Record<symbol, unknown>)[key];
    }

    // Métodos do client ($connect, $transaction, etc.)
    if (key.startsWith("$") || key === "then") {
      const value = (client as unknown as Record<string, unknown>)[key];
      return typeof value === "function" ? value.bind(client) : value;
    }

    // Delegates (aluno, admin, ...) — amarra todas as ops ao mesmo client
    const model = (client as unknown as Record<string, unknown>)[key];
    if (model && typeof model === "object") {
      return proxyModel(client, key);
    }

    const value = (client as unknown as Record<string, unknown>)[key];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
