# Manual de usuario — Horus Inventarios

Guía práctica para operar el sistema: catálogo, entradas de stock, ventas, clientes y proveedores.

---

## 1. Acceso al sistema

| Entorno | URL |
|---------|-----|
| En tu PC | http://localhost:3000 |
| Otro equipo en la misma red Wi‑Fi | http://192.168.1.139:3000 *(usa la IP de tu PC si cambió)* |

### Usuarios de prueba (demo)

| Rol | Email | Contraseña | Qué puede hacer |
|-----|-------|------------|-----------------|
| **Administrador** | alpha@inventarios.local | alpha123 | Todo |
| **Administrador** | beta@inventarios.local | beta123 | Todo |
| **Administrador** | gama@inventarios.local | gama123 | Todo |
| **Almacén** | almacen@inventarios.local | almacen123 | Productos, lotes, proveedores, movimientos, import CSV |
| **Vendedor** | vendedor@inventarios.local | vendedor123 | Clientes, ventas y punto de venta (POS) |

---

## 2. Mapa del menú (dónde está cada cosa)

| Menú | Ruta | Para qué sirve |
|------|------|----------------|
| **Dashboard** | `/` | Resumen: ventas del día, alertas de stock bajo, lotes por vencer |
| **Productos** | `/products` | Catálogo (SKU, GTIN, precios). **Aquí NO se carga cantidad de inventario** |
| **Lotes** | `/lots` | **Aquí sí entra el inventario físico** (cantidad por lote) |
| **Proveedores** | `/suppliers` | Alta y edición de proveedores |
| **Movimientos** | `/stock/history` | Historial (kardex): entradas, salidas y ajustes |
| **Clientes** | `/customers` | Alta y edición de clientes |
| **Ventas** | `/sales` | Historial de ventas |
| **Informes** | `/reports` | Reportes y exportación CSV *(solo Admin)* |
| **Histórico** | `/admin/historico` | Auditoría: quién hizo qué y cuándo *(solo Admin)* |

---

## 2.1 Movimientos vs Histórico (no confundir)

| Pantalla | Menú | Qué registra |
|----------|------|--------------|
| **Movimientos** | `/stock/history` | Kardex de **stock físico**: entradas (IN), salidas por venta (OUT), ajustes (ADJUST) |
| **Histórico** | `/admin/historico` | **Auditoría de usuarios**: quién creó o modificó productos, lotes, clientes, ventas, etc. |

Ejemplos en **Histórico**:
- "Almacén Demo recibió 50 pzas en lote LOTE-001"
- "Vendedor Demo registró venta V-202606-00001"
- "Administrador inició sesión"

Solo el rol **Administrador** ve el menú Histórico.

---

## 3. ¿Qué es el GTIN? (a veces lo llaman “GIN”)

**GTIN** = *Global Trade Item Number* (estándar **GS1**). Es el código numérico del producto a nivel comercial (el que suele ir en códigos de barras EAN/UPC).

En la app aparece como **“GTIN (AI 01)”** en el formulario de producto.

| Detalle | Explicación |
|---------|-------------|
| **¿Es obligatorio?** | No. Puedes dejarlo vacío si el producto no tiene código GS1. |
| **Formato** | 8, 12, 13 o 14 dígitos. El sistema valida el **dígito verificador**. |
| **Ejemplo demo** | Producto `SKU-001` → GTIN `00012345678905` |
| **¿Dónde se captura?** | **Productos → Nuevo producto** o **Editar** en un producto existente |
| **¿Para qué sirve?** | Identificar el producto en POS (búsqueda), import CSV y trazabilidad GS1 |
| **Diferencia con SKU** | **SKU** = tu código interno (único en tu negocio). **GTIN** = código estándar internacional del artículo |

**Importante:** el GTIN **no suma stock**. Solo describe el producto. La cantidad física se registra en **Lotes**.

---

## 4. Cómo dar de alta inventario (flujo completo)

En este sistema el stock **no** se carga en “Productos”. El flujo correcto es:

```
1. Crear el PRODUCTO (catálogo)
        ↓
2. Registrar ENTRADA DE STOCK en un LOTE (cantidad física)
        ↓
3. (Opcional) Recibir más mercancía al mismo lote o ajustar
        ↓
4. La SALIDA ocurre al VENDER en el POS (FIFO automático)
```

### Paso A — Crear producto (catálogo)

1. Menú **Productos**
2. Botón **Nuevo producto**
3. Completa al menos: **SKU**, **Nombre**, precio costo, precio venta, stock mínimo
4. Opcional: GTIN, marca, categoría, código de barras

**Atajo:** **Productos → Importar CSV** para cargar muchos productos de una vez (plantilla descargable en esa pantalla).

### Paso B — Entrada de stock (inventario físico)

Tienes **tres formas**:

| Forma | Dónde | Cuándo usarla |
|-------|-------|---------------|
| **Nuevo lote** | **Lotes → Entrada de stock** | Llegó mercancía nueva con un número de lote que aún no existe |
| **Atajo desde producto** | **Productos → Entrada stock** (en la fila) o **Editar producto → Entrada de stock** | Igual que arriba, pero con el producto ya pre-seleccionado |
| **Recibir en lote existente** | **Lotes → Gestionar** (en un lote) → **Recibir mercancía** | Llegó más cantidad del **mismo** número de lote (misma factura/remisión, mismo batch) |

Campos típicos al dar entrada:

- **Producto** (obligatorio)
- **Número de lote / Batch (AI 10)** (obligatorio, máx. 20 caracteres)
- **Cantidad** (obligatorio)
- **Proveedor** (opcional)
- **Vencimiento (AI 17)**, ubicación, fechas GS1 (opcionales)

Al guardar, el sistema crea un movimiento tipo **IN** (entrada) visible en **Movimientos**.

### Paso C — Ajustes (correcciones)

En **Lotes → Gestionar → Ajustar** usa +/- cuando hay mermas, conteos físicos o errores. Eso genera movimiento **ADJUST**, no una venta.

---

## 5. Dónde dar de alta clientes

1. Menú **Clientes**
2. **Nuevo cliente**
3. Campos principales: **Código** (único), **Nombre**; opcional: email, teléfono, RFC/ID fiscal, dirección

**Roles que pueden:** Administrador y Vendedor.

En el **Punto de venta (POS)** puedes vender a “Mostrador” (sin cliente) o elegir un cliente del listado.

---

## 6. Dónde dar de alta proveedores

1. Menú **Proveedores**
2. **Nuevo proveedor**
3. Solo pide **Nombre** (por ahora)

**Roles que pueden:** Administrador y Almacén.

El proveedor se asocia al dar **Entrada de stock** (nuevo lote) en el campo **Proveedor**. También se ve en el listado de **Lotes**.

---

## 7. ¿Se puede asignar inventario de salida a un vendedor?

**Sí, pero de forma automática — no hay pantalla para “asignar salida manualmente a otro vendedor”.**

| Tipo de salida | Cómo se asigna al vendedor |
|----------------|----------------------------|
| **Venta (POS)** | La venta queda registrada con el **usuario que inició sesión** al cobrar. En **Ventas → Detalle** y en el listado verás la columna **Vendedor**. |
| **Ajuste de lote** | No lleva vendedor; es corrección de almacén. |
| **Movimiento OUT en kardex** | Referencia el número de venta (`V-YYYYMM-00001`), no un vendedor directo en esa tabla. |

**En la práctica:**

- Si el **Vendedor Demo** entra y cobra en **Ventas → Nueva venta (POS)**, esa venta (y la salida de stock FIFO) queda a su nombre.
- Si entra **Administrador** y vende, queda a nombre del administrador.
- **Almacén** no tiene acceso al POS; no registra ventas.

**No existe hoy:** elegir otro vendedor en el POS (“vendió Juan pero cobró Pedro”). Si lo necesitas, sería una mejora futura.

---

## 8. Punto de venta (salida de inventario por venta)

1. Menú **Ventas → Nueva venta (POS)**
2. Busca producto por SKU, nombre o código de barras/GTIN
3. **Agregar** al carrito (el sistema usa el lote con **FIFO**: primero el que vence antes)
4. Elige cliente (opcional), descuento, forma de pago
5. **Cobrar**

Eso descuenta stock del lote y crea movimiento **OUT** en **Movimientos**.

---

## 9. Historial de movimientos (kardex)

Menú **Movimientos** (`/stock/history`):

| Tipo | Significado |
|------|-------------|
| **IN** | Entrada (nuevo lote o recepción en lote existente) |
| **OUT** | Salida por venta |
| **ADJUST** | Ajuste manual (+/-) |

Filtros: búsqueda, fechas, tipo. Desde **Editar producto** o **Gestionar lote** hay enlaces directos al historial filtrado.

---

## 10. Glosario GS1 (campos que verás)

| Campo en la app | AI GS1 | Uso |
|-----------------|--------|-----|
| GTIN (AI 01) | 01 | Identificador global del producto |
| Lote / Batch (AI 10) | 10 | Número de lote del fabricante |
| Fecha producción (AI 11) | 11 | Opcional |
| Consumir preferente (AI 15) | 15 | Opcional |
| Vencimiento (AI 17) | 17 | Caducidad del lote |
| Número de serie (AI 21) | 21 | Opcional, unidad individual |

---

## 11. Preguntas frecuentes

**¿Por qué mi producto muestra stock 0 si ya lo di de alta?**  
Probablemente solo creaste el producto en **Productos**. Debes hacer **Entrada de stock** en **Lotes**.

**¿Puedo usar el mismo número de lote dos veces?**  
No para el mismo producto. Si llega más mercancía del mismo lote, usa **Recibir mercancía** en ese lote, no crear otro con el mismo número.

**¿Quién ve qué menús?**  
- **Vendedor:** Clientes, Ventas (no ve Productos ni Lotes).  
- **Almacén:** Productos, Lotes, Proveedores, Movimientos (no vende).  
- **Admin:** todo + Informes.

**¿Cómo pruebo desde el celular?**  
Misma Wi‑Fi, URL `http://IP_DE_TU_PC:3000`, y que `npm run dev` esté corriendo en la PC.

---

## 12. Resumen rápido (cheat sheet)

| Quiero… | Voy a… |
|---------|--------|
| Crear un artículo en catálogo | **Productos → Nuevo producto** |
| Poner GTIN / código GS1 | Campo **GTIN (AI 01)** en producto |
| Cargar cantidad al almacén | **Lotes → Entrada de stock** |
| Sumar más al mismo lote | **Lotes → Gestionar → Recibir mercancía** |
| Alta de cliente | **Clientes → Nuevo cliente** |
| Alta de proveedor | **Proveedores → Nuevo proveedor** |
| Vender y bajar stock | **Ventas → Nueva venta (POS)** |
| Ver quién vendió | **Ventas** (columna Vendedor) |
| Ver entradas/salidas de stock | **Movimientos** |
| Ver quién modificó el sistema | **Histórico** *(solo Admin)* |

---

*Horus Inventarios — Sistema con trazabilidad por lote (GS1) y ventas FIFO.*
