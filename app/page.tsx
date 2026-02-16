import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = { error?: string; error_code?: string; error_description?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  // Si llegó un error de auth (ej. enlace de confirmación caducado, error -310 de redirección), pasar a login
  if (params.error_code || params.error) {
    const q = new URLSearchParams();
    if (params.error) q.set("error", params.error);
    if (params.error_code) q.set("error_code", params.error_code);
    if (params.error_description) q.set("error_description", params.error_description);
    // Error -310 generalmente indica problema de configuración de URLs en Supabase
    if (params.error_code === "-310") {
      q.set("error", "redirect_url_mismatch");
    }
    redirect(`/login?${q.toString()}`);
  }

  redirect("/login");
}
