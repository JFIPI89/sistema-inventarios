"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type CategoryOption = { id: string; name: string; parentId: string | null };

export function CategoryForm({
  action,
  category,
  categories,
  categoryId,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  category?: { name: string; parentId: string | null };
  categories: CategoryOption[];
  categoryId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const parentOptions = categories.filter((c) => c.id !== categoryId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/categories");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!categoryId) return;
    if (!confirm("¿Eliminar esta categoría?")) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCategory(categoryId);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
    } else {
      router.push("/categories");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" defaultValue={category?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentId">Categoría padre (opcional)</Label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={category?.parentId || ""}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin categoría padre</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || deleting}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            {categoryId ? (
              <Button type="button" variant="destructive" disabled={loading || deleting} onClick={handleDelete}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function bindUpdateCategory(id: string) {
  return (formData: FormData) => updateCategory(id, formData);
}
