"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FileInput({
  id,
  name,
  accept = ".csv,text/csv",
  required,
  className,
  onFileChange,
}: {
  id: string;
  name: string;
  accept?: string;
  required?: boolean;
  className?: string;
  onFileChange?: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onFileChange?.(file);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={handleChange}
      />
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center",
          fileName && "border-primary/40"
        )}
      >
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Seleccionar archivo CSV
        </Button>
        <p className="min-w-0 text-sm text-muted-foreground">
          {fileName ? (
            <span className="font-medium text-foreground">{fileName}</span>
          ) : (
            "Ningún archivo seleccionado"
          )}
        </p>
      </div>
    </div>
  );
}
