import { db } from "./db";
import { requests, users } from "./db/schema";
import { and, eq, gte, lte, count } from "drizzle-orm";

const REQUEST_LIMIT = 10;

export async function checkRateLimit(userId: string): Promise<boolean> {
  // Check if user is admin
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user && user.isAdmin) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const countResult = await db
    .select({ count: count() })
    .from(requests)
    .where(
      and(
        eq(requests.userId, userId),
        gte(requests.createdAt, today),
        lte(requests.createdAt, tomorrow)
      )
    );
  const requestCount = Number(countResult[0]?.count ?? 0);

  return requestCount < REQUEST_LIMIT;
}

export async function recordRequest(userId: string): Promise<void> {
  await db.insert(requests).values({ userId });
}
