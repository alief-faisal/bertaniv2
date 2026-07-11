import { supabase } from "@/utils/supabase";
import { UserRole } from "@/types";

/**
 * Ambil role user yang sedang login dari public.profiles.
 * Dipakai setelah supabase.auth.signInWithPassword() berhasil, untuk
 * menentukan halaman redirect yang tepat:
 *   admin  -> /admin
 *   poktan -> /dashboard-poktan
 *   user   -> /
 *
 * Contoh pemakaian di halaman login:
 *
 *   const { error } = await supabase.auth.signInWithPassword({ email, password });
 *   if (error) { ... }
 *   const role = await getCurrentUserRole();
 *   router.push(getRedirectPathForRole(role));
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("Gagal mengambil role user:", error?.message);
    return null;
  }

  return data.role as UserRole;
}

export function getRedirectPathForRole(role: UserRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "poktan":
      return "/dashboard-poktan";
    case "user":
    default:
      return "/";
  }
}
