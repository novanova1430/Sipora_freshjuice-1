import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { deleteMyAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/FormBits";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ImagePicker({ url, onFile, label, round }: { url?: string | null; onFile: (f: File) => Promise<void>; label: string; round?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" onClick={() => ref.current?.click()} disabled={busy}
      className={`group relative h-28 w-28 overflow-hidden border-2 border-dashed bg-muted ${round ? "rounded-full" : "rounded-3xl"}`}>
      {url ? <img src={url} alt={label} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-background opacity-0 transition group-hover:opacity-100">
        <Camera />
      </span>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setBusy(true);
        try { await onFile(f); toast.success(`${label} updated`); } catch (err) { toast.error((err as Error).message); }
        finally { setBusy(false); e.target.value = ""; }
      }} />
    </button>
  );
}

export function ChangePassword({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form className="grid gap-4 sm:grid-cols-3" onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const f = new FormData(form);
      const current = String(f.get("current")), p = String(f.get("new"));
      if (p.length < 8) return toast.error("New password needs at least 8 characters.");
      setBusy(true);
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: current });
      if (e1) { setBusy(false); return toast.error("Current password is wrong."); }
      const { error } = await supabase.auth.updateUser({ password: p, current_password: current } as never);
      setBusy(false);
      if (error) return toast.error(error.message);
      form.reset();
      toast.success("Password changed.");
    }}>
      <Field label="Current password" name="current" type="password" required />
      <Field label="New password" name="new" type="password" required />
      <div className="flex items-end"><Button variant="outline" className="h-11 w-full rounded-full" disabled={busy}>Change password</Button></div>
    </form>
  );
}

export function DeleteAccount() {
  const del = useServerFn(deleteMyAccount);
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="destructive" className="rounded-full">Delete account</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes your account and all its data. This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={async () => {
            try { await del(); await signOut(); toast.success("Account deleted."); nav({ to: "/", replace: true }); }
            catch (e) { toast.error((e as Error).message); }
          }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
