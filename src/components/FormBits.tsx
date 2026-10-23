import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Field({
  label, name, error, labelClassName, ...props
}: { label: string; name: string; error?: string; labelClassName?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className={labelClassName}>{label}</Label>
      <Input id={name} name={name} className="h-11 rounded-xl" {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AuthShell({ title, subtitle, children, accent = "fresh" }: { title: string; subtitle: string; children: ReactNode; accent?: "fresh" | "sunrise" }) {
  return (
    <div className={`min-h-[calc(100vh-4rem)] px-4 py-14 ${accent === "sunrise" ? "bg-gradient-sunrise" : "bg-secondary/40"}`}>
      <div className="mx-auto max-w-xl animate-rise rounded-3xl border bg-card p-8 shadow-lift sm:p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
