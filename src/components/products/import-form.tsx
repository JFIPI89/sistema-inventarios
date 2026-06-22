"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importProductsCsv, type ImportRowResult } from "@/actions/import-products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ImportProductsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [summary, setSummary] = useState<{ created: number; updated: number; errors: number } | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await importProductsCsv(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setResults(result.results ?? null);
      setSummary(result.summary ?? null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir archivo CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo CSV</Label>
              <FileInput
                id="file"
                name="file"
                required
                onFileChange={setSelectedFile}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !selectedFile}>
              {loading ? "Importando..." : "Importar productos"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="success">{summary.created} creados</Badge>
              <Badge variant="secondary">{summary.updated} actualizados</Badge>
              {summary.errors > 0 && (
                <Badge variant="destructive">{summary.errors} errores</Badge>
              )}
            </div>
            {results && results.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fila</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={`${r.row}-${r.sku}`}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell className="font-mono">{r.sku}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "error"
                              ? "destructive"
                              : r.status === "created"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.message || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
