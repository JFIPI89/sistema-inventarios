"use client";

import { useState, useTransition } from "react";
import { searchProductsForSale, createSale, type CartItem } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";
import { Trash2 } from "lucide-react";

type Customer = { id: string; code: string; name: string };

type SearchProduct = Awaited<ReturnType<typeof searchProductsForSale>>[number];

export function PosClient({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch() {
    const products = await searchProductsForSale(query);
    setResults(products);
  }

  function addToCart(product: SearchProduct) {
    const lot = product.lots[0];
    if (!lot) {
      setMessage("Sin stock disponible");
      return;
    }

    const existing = cart.find((c) => c.lotId === lot.id);
    if (existing) {
      if (existing.quantity >= lot.quantity) {
        setMessage("Stock insuficiente en el lote");
        return;
      }
      setCart(
        cart.map((c) =>
          c.lotId === lot.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          lotId: lot.id,
          productName: product.name,
          lotNumber: lot.lotNumber,
          quantity: 1,
          unitPrice: product.salePrice,
        },
      ]);
    }
    setMessage(null);
  }

  function removeFromCart(lotId: string) {
    setCart(cart.filter((c) => c.lotId !== lotId));
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function handleCheckout() {
    startTransition(async () => {
      const result = await createSale({
        customerId: customerId || undefined,
        paymentMethod,
        discount,
        items: cart,
      });
      if (result.error) {
        setMessage(result.error);
      } else {
        setCart([]);
        setDiscount(0);
        setMessage(`Venta ${result.saleNumber} registrada`);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Buscar producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SKU, nombre, código de barras..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
            <Button type="button" onClick={handleSearch} className="shrink-0 sm:w-auto">
              Buscar
            </Button>
          </div>
          <ul className="max-h-80 space-y-2 overflow-auto">
            {results.map((p) => {
              const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · {formatCurrency(p.salePrice)} · Stock: {stock}
                    </p>
                    {p.lots[0] && (
                      <p className="text-xs text-muted-foreground">
                        Lote FIFO: {p.lots[0].lotNumber}
                      </p>
                    )}
                  </div>
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => addToCart(p)} disabled={stock === 0}>
                    Agregar
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">Mostrador</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Carrito vacío</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((item) => (
                <li
                  key={item.lotId}
                  className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <Badge variant="secondary">Lote {item.lotNumber}</Badge>
                    <p className="mt-1">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.lotId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Descuento</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pago</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.includes("registrada") ? "text-success" : "text-destructive"}`}>
              {message}
            </p>
          )}

          <Button className="w-full" disabled={cart.length === 0 || isPending} onClick={handleCheckout}>
            {isPending ? "Procesando..." : "Cobrar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
