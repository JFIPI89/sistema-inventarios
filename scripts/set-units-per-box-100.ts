import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.product.groupBy({
    by: ["unitsPerBox"],
    _count: true,
  });
  console.log("before", before);

  const result = await prisma.product.updateMany({
    where: { unitsPerBox: 1 },
    data: { unitsPerBox: 100 },
  });
  console.log(`updated ${result.count} products from unitsPerBox=1 to 100`);

  const after = await prisma.product.findMany({
    select: { sku: true, name: true, unitsPerBox: true },
    orderBy: { sku: "asc" },
  });
  console.log(after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
