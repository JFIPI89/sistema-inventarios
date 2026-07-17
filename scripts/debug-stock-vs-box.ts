import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      sku: true,
      name: true,
      unitsPerBox: true,
      lots: { where: { quantity: { gt: 0 } }, select: { lotNumber: true, quantity: true } },
    },
    orderBy: { sku: "asc" },
  });

  for (const p of products) {
    const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
    const first = p.lots[0];
    const maxBoxes = first
      ? Math.floor(first.quantity / Math.max(1, p.unitsPerBox))
      : 0;
    console.log(
      JSON.stringify({
        sku: p.sku,
        name: p.name,
        unitsPerBox: p.unitsPerBox,
        totalStock: stock,
        firstLotQty: first?.quantity ?? 0,
        maxBoxesOnFirstLot: maxBoxes,
        canSellOneBox: maxBoxes >= 1,
      })
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
