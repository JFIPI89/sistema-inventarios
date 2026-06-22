# Manual de operación — DISTRIBUIDORA HORUS Inventarios

Guía práctica para operar el sistema: catálogo, entradas de stock, ventas, clientes, proveedores, informes y auditoría.

---

## 1. Acceso al sistema

| Entorno | URL | Cuándo usarla |
|---------|-----|---------------|
| **Producción (nube)** | https://sistema-inventarios-seven.vercel.app | Desde cualquier lugar con internet |
| **Local (tu PC)** | http://localhost:3000 | Desarrollo o pruebas en la misma máquina |
| **Red local (Wi‑Fi)** | http://192.168.1.139:3000 | Celular u otro equipo en la misma red *(IP de tu PC; puede cambiar)* |

### Inicio de sesión

1. Abre la URL del entorno que uses.
2. Ingresa **email** y **contraseña**.
3. El menú lateral muestra solo las opciones permitidas para tu rol.

### Usuarios de prueba (demo)

| Rol | Email | Contraseña | Qué puede hacer |
|-----|-------|------------|-----------------|
| **Administrador** | alpha@inventarios.local | alpha123 | Todo el sistema |
| **Administrador** | beta@inventarios.local | beta123 | Todo el sistema |
| **Administrador** | gama@inventarios.local | gama123 | Todo el sistema |
| **Almacén** | almacen@inventarios.local | almacen123 | Productos, lotes, proveedores, movimientos, import CSV |
| **Vendedor** | vendedor@inventarios.local | vendedor123 | Clientes, ventas y punto de venta (POS) |

> **Importante (producción):** cambia estas contraseñas antes de usar el sistema con datos reales. Las credenciales demo están visibles en la pantalla de login.

### Cerrar sesión

Botón **Cerrar sesión** en la parte inferior del menú lateral. El cierre queda registrado en **Histórico** (solo Admin).

### Tema claro / oscuro

Icono de sol/luna en el menú lateral. La preferencia se guarda en el navegador.

---

## 2. Mapa del menú

| Menú | Ruta | Para qué sirve | Roles |
|------|------|----------------|-------|
| **Dashboard** | `/` | Ventas del día, alertas stock bajo, lotes por vencer | Todos |
| **Productos** | `/products` | Catálogo (SKU, GTIN, precios). **No carga cantidad física** | Admin, Almacén |
| **Lotes** | `/lots` | **Inventario físico** por lote | Admin, Almacén |
| **Proveedores** | `/suppliers` | Alta y edición de proveedores | Admin, Almacén |
| **Movimientos** | `/stock/history` | Kardex: entradas, salidas y ajustes | Admin, Almacén |
| **Clientes** | `/customers` | Alta y edición de clientes | Admin, Vendedor |
| **Ventas** | `/sales` | Historial de ventas y POS | Admin, Vendedor |
| **Informes** | `/reports` | Reportes, gráficas y export CSV | Solo Admin |
| **Histórico** | `/admin/historico` | Auditoría: quién hizo qué y cuándo | Solo Admin |

---

## 2.1 Movimientos vs Histórico (no confundir)

| Pantalla | Menú | Qué registra |
|----------|------|--------------|
| **Movimientos** | `/stock/history` | Kardex de **stock físico**: entradas (IN), salidas por venta (OUT), ajustes (ADJUST) |
| **Histórico** | `/admin/historico` | **Auditoría de usuarios**: altas, cambios, login, logout, importaciones, cancelaciones |

Ejemplos en **Histórico**:

- "Admin Alpha recibió 50 pzas en lote LOTE-001"
- "Vendedor Demo registró venta V-202606-00001"
- "Admin Beta inició sesión"

**Histórico** permite filtrar por usuario, acción, tipo de entidad y rango de fechas.

---

## 3. ¿Qué es el GTIN?

**GTIN** = *Global Trade Item Number* (estándar **GS1**). Código numérico del producto (EAN/UPC en códigos de barras).

En la app: campo **"GTIN (AI 01)"** en producto.

| Detalle | Explicación |
|---------|-------------|
| **¿Es obligatorio?** | No |
| **Formato** | 8, 12, 13 o 14 dígitos con dígito verificador válido |
| **Ejemplo demo** | `SKU-001` → GTIN `00012345678905` |
| **¿Dónde se captura?** | **Productos → Nuevo** o **Editar** |
| **Diferencia con SKU** | **SKU** = código interno. **GTIN** = código estándar internacional |

**El GTIN no suma stock.** La cantidad física se registra en **Lotes**.

---

## 4. Flujo de inventario (alta de stock)

```
1. Crear PRODUCTO (catálogo)
        ↓
2. ENTRADA DE STOCK en un LOTE (cantidad física)
        ↓
3. (Opcional) Recibir más al mismo lote o ajustar
        ↓
4. SALIDA automática al VENDER en el POS (FIFO)
```

### Paso A — Crear producto

1. **Productos → Nuevo producto**
2. Mínimo: **SKU**, **Nombre**, precio costo, precio venta, stock mínimo
3. Opcional: GTIN, marca, categoría, código de barras

**Importación masiva:** **Productos → Importar CSV** — descarga la plantilla, complétala y súbela.

Columnas de la plantilla CSV: SKU, GTIN, nombre, marca, categoría, unidad, costo, precio venta, stock mínimo, descripción, código de barras.

### Paso B — Entrada de stock

| Forma | Dónde | Cuándo |
|-------|-------|--------|
| **Nuevo lote** | **Lotes → Entrada de stock** | Mercancía nueva con lote que no existe |
| **Atajo desde producto** | **Productos → Entrada stock** (fila) o **Editar → Entrada de stock** | Mismo flujo, producto pre-seleccionado |
| **Recibir en lote existente** | **Lotes → Gestionar → Recibir mercancía** | Más cantidad del **mismo** número de lote |

Campos típicos:

- **Producto**, **Número de lote (AI 10)**, **Cantidad** (obligatorios)
- **Proveedor**, vencimiento (AI 17), ubicación, fechas GS1 (opcionales)

Genera movimiento **IN** en **Movimientos**.

### Paso C — Ajustes

**Lotes → Gestionar → Ajustar** — correcciones por merma, conteo o error. Movimiento **ADJUST**.

---

## 5. Clientes

1. **Clientes → Nuevo cliente**
2. **Código** (único) y **Nombre** obligatorios; opcional: email, teléfono, RFC, dirección

**Roles:** Admin y Vendedor.

En el **POS** puedes vender a "Mostrador" (sin cliente) o elegir uno del listado.

---

## 6. Proveedores

1. **Proveedores → Nuevo proveedor**
2. Campo **Nombre** (obligatorio)

**Roles:** Admin y Almacén.

Se asocia al dar **Entrada de stock** en el campo **Proveedor**.

---

## 7. Punto de venta (POS)

1. **Ventas → Nueva venta (POS)**
2. Buscar por SKU, nombre o código de barras/GTIN
3. **Agregar** al carrito — el sistema aplica **FIFO** (lote que vence primero)
4. Cliente (opcional), descuento, forma de pago
5. **Cobrar**

Descuenta stock y crea movimiento **OUT** en **Movimientos**.

### Vendedor asignado a la venta

La venta queda a nombre del **usuario que inició sesión** al cobrar. Columna **Vendedor** en **Ventas**.

No existe hoy elegir otro vendedor en el POS ("cobró Pedro pero vendió Juan").

### Anular una venta

**Ventas → Detalle de venta → Anular venta** (si está activa). Revierte el stock a los lotes y registra la cancelación en **Histórico**.

---

## 8. Informes (solo Administrador)

Menú **Informes** (`/reports`):

| Sección | Contenido |
|---------|-----------|
| **Ventas por periodo** | Gráfica y totales; filtro por fechas |
| **Por producto / cliente** | Ranking de unidades e ingresos |
| **Inventario valorizado** | Stock por lote con valor a costo |
| **Utilidades** | Ingresos, costo, utilidad y margen por periodo |

**Exportar informes:** panel **Exportar informe** en la misma pantalla.

1. Elige el rango **Desde / Hasta** y pulsa **Filtrar**.
2. Marca las secciones que quieres incluir:
   - Ventas del período
   - Top productos
   - Top clientes
   - Utilidades
   - Inventario valorizado *(snapshot actual, sin filtro de fechas)*
3. **Exportar PDF** — documento con hoja membretada **DISTRIBUIDORA HORUS** (logo, línea dorada, pie de página).
4. **Exportar CSV** — un solo archivo con las mismas secciones marcadas (bloques separados por título, compatible con Excel).

Debes seleccionar al menos una sección para generar el PDF o el CSV.

---

## 9. Historial de movimientos (kardex)

Menú **Movimientos** (`/stock/history`):

| Tipo | Significado |
|------|-------------|
| **IN** | Entrada (nuevo lote o recepción) |
| **OUT** | Salida por venta |
| **ADJUST** | Ajuste manual (+/-) |

Filtros: búsqueda, fechas, tipo de movimiento.

---

## 10. Histórico de auditoría (solo Administrador)

Menú **Histórico** (`/admin/historico`):

Registra acciones de usuarios: crear, editar, eliminar, login, logout, import CSV, cancelar venta.

| Acción | Etiqueta en pantalla |
|--------|---------------------|
| CREATE | Alta |
| UPDATE | Modificación |
| DELETE | Eliminación |
| LOGIN | Inicio de sesión |
| LOGOUT | Cierre de sesión |
| IMPORT | Importación |
| CANCEL | Cancelación |

Filtros: búsqueda libre, usuario, acción, tipo de entidad, fechas.

---

## 11. Glosario GS1

| Campo en la app | AI GS1 | Uso |
|-----------------|--------|-----|
| GTIN (AI 01) | 01 | Identificador global del producto |
| Lote / Batch (AI 10) | 10 | Número de lote |
| Fecha producción (AI 11) | 11 | Opcional |
| Consumir preferente (AI 15) | 15 | Opcional |
| Vencimiento (AI 17) | 17 | Caducidad del lote |
| Número de serie (AI 21) | 21 | Unidad individual |

---

## 12. Matriz de permisos por rol

| Función | Admin | Almacén | Vendedor |
|---------|:-----:|:-------:|:--------:|
| Dashboard | ✓ | ✓ | ✓ |
| Productos (CRUD) | ✓ | ✓ | — |
| Importar CSV | ✓ | ✓ | — |
| Lotes / entradas / ajustes | ✓ | ✓ | — |
| Proveedores | ✓ | ✓ | — |
| Movimientos (kardex) | ✓ | ✓ | — |
| Clientes | ✓ | — | ✓ |
| Ventas / POS | ✓ | — | ✓ |
| Anular venta | ✓ | — | ✓ |
| Informes | ✓ | — | — |
| Histórico (auditoría) | ✓ | — | — |

---

## 13. Preguntas frecuentes

**¿Por qué mi producto muestra stock 0 si ya lo di de alta?**  
Solo creaste el catálogo en **Productos**. Falta **Entrada de stock** en **Lotes**.

**¿Puedo usar el mismo número de lote dos veces?**  
No para el mismo producto. Usa **Recibir mercancía** en el lote existente.

**¿Cómo pruebo desde el celular en local?**  
Misma Wi‑Fi, URL `http://IP_DE_TU_PC:3000`, con `npm run dev` activo en la PC.

**¿Por qué la primera carga en la nube tarda unos segundos?**  
Neon (plan free) "despierta" la base tras inactividad. Es normal; la segunda petición suele ser más rápida.

**¿Dónde cambio contraseñas en producción?**  
Hoy no hay pantalla de usuarios; hay que hacerlo directamente en la base de datos o pedir al administrador técnico. **Prioridad:** cambiar las demo antes de uso real.

---

## 14. Resumen rápido (cheat sheet)

| Quiero… | Voy a… |
|---------|--------|
| Entrar en producción | https://sistema-inventarios-seven.vercel.app/login |
| Crear artículo en catálogo | **Productos → Nuevo producto** |
| Cargar muchos productos | **Productos → Importar CSV** |
| Poner GTIN | Campo **GTIN (AI 01)** en producto |
| Cargar cantidad al almacén | **Lotes → Entrada de stock** |
| Sumar al mismo lote | **Lotes → Gestionar → Recibir mercancía** |
| Alta de cliente | **Clientes → Nuevo cliente** |
| Alta de proveedor | **Proveedores → Nuevo proveedor** |
| Vender y bajar stock | **Ventas → Nueva venta (POS)** |
| Anular una venta | **Ventas → Detalle → Anular** |
| Ver quién vendió | **Ventas** (columna Vendedor) |
| Ver entradas/salidas de stock | **Movimientos** |
| Ver reportes y utilidades | **Informes** *(Admin)* |
| Exportar PDF membretado | **Informes → Exportar informe → PDF** |
| Exportar CSV por secciones | **Informes → Exportar informe → CSV** |
| Ver quién modificó el sistema | **Histórico** *(Admin)* |

---

## 15. Soporte técnico (desarrolladores)

| Recurso | Ubicación |
|---------|-----------|
| Guía de despliegue | [DEPLOY.md](DEPLOY.md) |
| Repositorio | https://github.com/JFIPI89/sistema-inventarios |
| Panel Vercel | https://vercel.com/juanfcoarmenta89-8094s-projects/sistema-inventarios |
| Verificar usuarios demo | `npm run verify:users` |
| Sincronizar BD | `npm run db:setup` |

---

*Horus Inventarios — Trazabilidad por lote (GS1), ventas FIFO y auditoría de operaciones.*
