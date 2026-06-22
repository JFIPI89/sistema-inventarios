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

export async function getCategoriesList(search?: string) {
  return prisma.category.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function getCategoriesForSelect(excludeId?: string) {
  return prisma.category.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, parentId: true },
  });
}

async function isDescendant(categoryId: string, potentialAncestorId: string): Promise<boolean> {
  let current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  });
  while (current?.parentId) {
    if (current.parentId === potentialAncestorId) return true;
    current = await prisma.category.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }
  return false;
}

export async function createCategory(formData: FormData) {
  const session = await requireProductWrite();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Nombre requerido" };

  const parentId = String(formData.get("parentId") || "").trim() || null;

  const category = await prisma.category.create({
    data: { name, parentId },
  });

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Category",
    entityId: category.id,
    entityLabel: name,
    summary: `Alta de categoría: ${name}`,
  });

  revalidatePath("/categories");
  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await requireProductWrite();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Nombre requerido" };

  const parentId = String(formData.get("parentId") || "").trim() || null;

  if (parentId === id) return { error: "Una categoría no puede ser padre de sí misma" };

  if (parentId && (await isDescendant(parentId, id))) {
    return { error: "No se puede asignar una subcategoría como categoría padre" };
  }

  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { error: "Categoría no encontrada" };

  await prisma.category.update({
    where: { id },
    data: { name, parentId },
  });

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Category",
    entityId: id,
    entityLabel: name,
    summary: `Modificó categoría: ${name}`,
    changes: buildChanges(
      { name: before.name, parentId: before.parentId },
      { name, parentId },
      ["name", "parentId"]
    ),
  });

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await requireProductWrite();

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) return { error: "Categoría no encontrada" };

  if (category._count.products > 0) {
    return { error: "No se puede eliminar: tiene productos asociados" };
  }
  if (category._count.children > 0) {
    return { error: "No se puede eliminar: tiene subcategorías" };
  }

  await prisma.category.delete({ where: { id } });

  await logAudit({
    session,
    action: "DELETE",
    entityType: "Category",
    entityId: id,
    entityLabel: category.name,
    summary: `Eliminó categoría: ${category.name}`,
  });

  revalidatePath("/categories");
  revalidatePath("/products");
  return { success: true };
}

/** Resolve category by name; create if missing (for CSV import). */
export async function findOrCreateCategoryByName(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({ data: { name: trimmed } });
  return created.id;
}
