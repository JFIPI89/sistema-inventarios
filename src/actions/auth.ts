"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Credenciales inválidas" };
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  await createSession(sessionUser);

  await logAudit({
    session: sessionUser,
    action: "LOGIN",
    entityType: "Session",
    entityId: user.id,
    entityLabel: user.email,
    summary: `Inicio de sesión: ${user.name}`,
  });

  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();

  if (session) {
    await logAudit({
      session,
      action: "LOGOUT",
      entityType: "Session",
      entityId: session.id,
      entityLabel: session.email,
      summary: `Cierre de sesión: ${session.name}`,
    });
  }

  await destroySession();
  redirect("/login");
}
