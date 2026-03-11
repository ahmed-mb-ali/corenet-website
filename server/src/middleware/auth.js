import { db } from "../config/database.js";

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
    const user = await db("users").where({ id: request.user.userId }).first();
    if (!user || !user.is_active) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    request.currentUser = user;
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}

export function requireAdmin(request, reply, done) {
  if (request.currentUser?.role !== "admin") {
    return reply.code(403).send({ error: "Admin access required" });
  }
  done();
}

export function requireManager(request, reply, done) {
  if (!["admin", "manager"].includes(request.currentUser?.role)) {
    return reply.code(403).send({ error: "Manager access required" });
  }
  done();
}
