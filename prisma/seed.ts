import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(
  email: string,
  password: string,
  name: string,
  role: Role
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { email, passwordHash, name, role },
  });
}

async function main() {
  const admins = await Promise.all([
    upsertUser("alpha@inventarios.local", "alpha123", "Admin Alpha", Role.ADMIN),
    upsertUser("beta@inventarios.local", "beta123", "Admin Beta", Role.ADMIN),
    upsertUser("gama@inventarios.local", "gama123", "Admin Gama", Role.ADMIN),
  ]);

  const almacen = await upsertUser(
    "almacen@inventarios.local",
    "almacen123",
    "Almacén",
    Role.WAREHOUSE
  );

  const vendedor = await upsertUser(
    "vendedor@inventarios.local",
    "vendedor123",
    "Vendedor",
    Role.SELLER
  );

  const categories = ["Electrónica", "Alimentos", "Hogar", "Farmacia"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { id: name.toLowerCase() },
      update: {},
      create: { id: name.toLowerCase(), name },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { id: "default-supplier" },
    update: {},
    create: { id: "default-supplier", name: "Proveedor General" },
  });

  const product = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      sku: "SKU-001",
      gtin: "00012345678905",
      name: "Producto Demo",
      brand: "Marca Demo",
      description: "Producto de ejemplo para pruebas",
      categoryId: "electrónica",
      unitOfMeasure: "pza",
      costPrice: 50,
      salePrice: 89.99,
      minStock: 10,
      barcode: "00012345678905",
    },
  });

  await prisma.lot.upsert({
    where: { productId_lotNumber: { productId: product.id, lotNumber: "LOTE-2024-001" } },
    update: {},
    create: {
      productId: product.id,
      lotNumber: "LOTE-2024-001",
      quantity: 100,
      expirationDate: new Date("2026-12-31"),
      productionDate: new Date("2024-06-01"),
      location: "Estante A-1",
      supplierId: supplier.id,
    },
  });

  await prisma.customer.upsert({
    where: { code: "CLI-001" },
    update: {},
    create: {
      code: "CLI-001",
      name: "Cliente Mostrador",
      email: "cliente@demo.com",
      phone: "+52 555 123 4567",
      taxId: "XAXX010101000",
    },
  });

  console.log("Seed completed.");
  console.log("Admins:", admins.map((u) => u.email).join(", "));
  console.log("Almacén:", almacen.email);
  console.log("Vendedor:", vendedor.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
