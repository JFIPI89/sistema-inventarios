"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWriteProducts } from "@/lib/permissions";
import { getSession } from "@/lib/auth";
import { buildChanges, logAudit } from "@/lib/audit";

async function requireProductWrite() {
  const session = await getSession();
  if (!session || !canWriteProducts(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function getSuppliers(search?: string) {
  return prisma.supplier.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { lots: true } } },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: { lots: { include: { product: true }, take: 20, orderBy: { createdAt: "desc" } } },
  });
}

export async function createSupplier(formData: FormData) {
  const session = await requireProductWrite();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Nombre requerido" };

  const supplier = await prisma.supplier.create({ data: { name } });

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    entityLabel: name,
    summary: `Alta de proveedor: ${name}`,
  });

  revalidatePath("/suppliers");
  return { success: true };
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await requireProductWrite();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Nombre requerido" };

  const before = await prisma.supplier.findUnique({ where: { id } });
  if (!before) return { error: "Proveedor no encontrado" };

  await prisma.supplier.update({ where: { id }, data: { name } });

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Supplier",
    entityId: id,
    entityLabel: name,
    summary: `Modificó proveedor: ${name}`,
    changes: buildChanges({ name: before.name }, { name }, ["name"]),
  });

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return { success: true };
}

export async function deleteSupplier(id: string) {
  const session = await requireProductWrite();

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return { error: "Proveedor no encontrado" };

  const count = await prisma.lot.count({ where: { supplierId: id } });
  if (count > 0) {
    return { error: "No se puede eliminar: tiene lotes asociados" };
  }

  await prisma.supplier.delete({ where: { id } });

  await logAudit({
    session,
    action: "DELETE",
    entityType: "Supplier",
    entityId: id,
    entityLabel: supplier.name,
    summary: `Eliminó proveedor: ${supplier.name}`,
  });

  revalidatePath("/suppliers");
  return { success: true };
}
