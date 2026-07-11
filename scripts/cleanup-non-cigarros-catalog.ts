/**
 * Limpia el catálogo demo: elimina productos que NO son del set CIGARROS
 * de prueba (SKUs 101001–101004 Denver, 102001–102004 Endles).
 *
 * Orden de borrado (FK):
 *   1. StockMovement de productos a eliminar
 *   2. SaleItem de esos productos; ventas huérfanas (sin ítems) se borran
 *      solo si no tienen CreditPlan
 *   3. Product (Lot cascada onDelete)
 *   4. Categorías demo vacías (excepto CIGARROS)
 *
 * Si un producto tiene ventas ligadas a un CreditPlan, se soft-delete
 * (isActive=false) en lugar de hard-delete.
 *
 * Uso: npx tsx scripts/cleanup-non-cigarros-catalog.ts
 *      npm run cleanup:non-cigarros
 */
import { PrismaClient } from "@prisma/client";

if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

/** SKUs del inventario de prueba CIGARROS — no se tocan. */
const KEEP_SKUS = new Set([
  "101001",
  "101002",
  "101003",
  "101004",
  "102001",
  "102002",
  "102003",
  "102004",
]);

const KEEP_CATEGORY = "CIGARROS";

async function main() {
  const all = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      isActive: true,
      category: { select: { name: true } },
      _count: { select: { saleItems: true, stockMovements: true, lots: true } },
    },
    orderBy: { sku: "asc" },
  });

  const toRemove = all.filter((p) => !KEEP_SKUS.has(p.sku));
  const toKeep = all.filter((p) => KEEP_SKUS.has(p.sku));

  console.log(`Productos totales: ${all.length}`);
  console.log(`Conservar (cigarros): ${toKeep.length}`);
  console.log(`Candidatos a eliminar: ${toRemove.length}`);
  console.log("---");

  const hardDeleted: string[] = [];
  const softDeleted: string[] = [];
  const skipped: string[] = [];

  for (const p of toRemove) {
    const label = `${p.sku} — ${p.name}`;

    // ¿Alguna venta de este producto está ligada a un CreditPlan?
    const saleItems = await prisma.saleItem.findMany({
      where: { productId: p.id },
      select: {
        id: true,
        saleId: true,
        sale: { select: { id: true, saleNumber: true, creditPlan: { select: { id: true } } } },
      },
    });

    const blockedByCredit = saleItems.some((si) => si.sale.creditPlan != null);
    if (blockedByCredit) {
      await prisma.product.update({
        where: { id: p.id },
        data: { isActive: false },
      });
      softDeleted.push(label);
      console.log(`SOFT-DELETE (credit plan): ${label}`);
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.stockMovement.deleteMany({ where: { productId: p.id } });

        const saleIds = [...new Set(saleItems.map((si) => si.saleId))];
        await tx.saleItem.deleteMany({ where: { productId: p.id } });

        // Ventas huérfanas (sin ítems restantes) sin credit plan
        for (const saleId of saleIds) {
          const remaining = await tx.saleItem.count({ where: { saleId } });
          if (remaining === 0) {
            const plan = await tx.creditPlan.findUnique({ where: { saleId } });
            if (!plan) {
              await tx.sale.delete({ where: { id: saleId } });
            }
          }
        }

        // Lot cascada onDelete desde Product
        await tx.product.delete({ where: { id: p.id } });
      });
      hardDeleted.push(label);
      console.log(`HARD-DELETE: ${label} (sales=${p._count.saleItems}, lots=${p._count.lots}, mov=${p._count.stockMovements})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.product.update({
        where: { id: p.id },
        data: { isActive: false },
      });
      softDeleted.push(label);
      console.warn(`FALLBACK soft-delete ${label}: ${msg}`);
    }
  }

  // Categorías vacías que no son CIGARROS
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, _count: { select: { products: true, children: true } } },
  });
  const deletedCategories: string[] = [];
  for (const c of categories) {
    if (c.name.toLowerCase() === KEEP_CATEGORY.toLowerCase()) continue;
    if (c._count.products === 0 && c._count.children === 0) {
      await prisma.category.delete({ where: { id: c.id } });
      deletedCategories.push(c.name);
      console.log(`DELETED category: ${c.name}`);
    }
  }

  // Verificación final
  const remaining = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true } },
      lots: { select: { lotNumber: true, quantity: true } },
    },
    orderBy: { sku: "asc" },
  });

  console.log("---");
  console.log(`Hard-deleted: ${hardDeleted.length}`);
  hardDeleted.forEach((s) => console.log(`  - ${s}`));
  console.log(`Soft-deleted: ${softDeleted.length}`);
  softDeleted.forEach((s) => console.log(`  - ${s}`));
  if (skipped.length) {
    console.log(`Skipped: ${skipped.length}`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
  console.log(`Categories removed: ${deletedCategories.join(", ") || "(none)"}`);
  console.log(`Remaining active products: ${remaining.length}`);
  for (const p of remaining) {
    const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
    console.log(
      `  ${p.sku} | ${p.name} | cat=${p.category?.name ?? "-"} | stock=${stock}`
    );
  }

  const unexpected = remaining.filter((p) => !KEEP_SKUS.has(p.sku));
  if (unexpected.length > 0) {
    console.warn("ADVERTENCIA: productos activos fuera del set cigarros:");
    unexpected.forEach((p) => console.warn(`  ${p.sku} ${p.name}`));
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
