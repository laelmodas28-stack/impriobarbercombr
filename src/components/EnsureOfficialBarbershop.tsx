import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Componente que garante que existe uma barbearia oficial
 * Se não houver, marca a primeira barbearia (ou Imperio Barber) como oficial
 */
export const EnsureOfficialBarbershop = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useUserRole();

  // Verificar se há barbearia oficial
  const { data: officialBarbershop } = useQuery({
    queryKey: ["check-official-barbershop"],
    queryFn: async () => {
      const { data } = await supabase
        .from("barbershops")
        .select("id, name, slug, is_official")
        .eq("is_official", true)
        .maybeSingle();
      return data;
    },
  });

  // Verificar se usuário é super_admin para poder marcar como oficial
  const isSuperAdmin = hasRole("super_admin");

  useEffect(() => {
    // Apenas super_admin pode marcar como oficial
    if (!isSuperAdmin) return;
    if (officialBarbershop) return; // Já existe oficial

    const markAsOfficial = async () => {
      try {
        // Buscar Imperio Barber ou primeira barbearia
        const { data: barbershop, error: findError } = await supabase
          .from("barbershops")
          .select("id, name, slug")
          .or("name.ilike.%imperio%,name.ilike.%império%,slug.eq.imperio-barber")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (findError) {
          console.error("Erro ao buscar barbearia:", findError);
          return;
        }

        if (!barbershop) {
          // Se não encontrou, buscar a primeira barbearia
          const { data: firstBarbershop, error: firstError } = await supabase
            .from("barbershops")
            .select("id, name, slug")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstError || !firstBarbershop) {
            console.log("Nenhuma barbearia encontrada para marcar como oficial");
            return;
          }

          // Marcar primeira barbearia como oficial
          const { error: updateError } = await supabase
            .from("barbershops")
            .update({ is_official: true })
            .eq("id", firstBarbershop.id);

          if (updateError) {
            console.error("Erro ao marcar como oficial:", updateError);
          } else {
            console.log(`✅ ${firstBarbershop.name} marcada como oficial`);
            queryClient.invalidateQueries({ queryKey: ["barbershop-official"] });
            queryClient.invalidateQueries({ queryKey: ["check-official-barbershop"] });
          }
        } else {
          // Marcar Imperio Barber como oficial
          const { error: updateError } = await supabase
            .from("barbershops")
            .update({ is_official: true })
            .eq("id", barbershop.id);

          if (updateError) {
            console.error("Erro ao marcar como oficial:", updateError);
          } else {
            console.log(`✅ ${barbershop.name} marcada como oficial`);
            queryClient.invalidateQueries({ queryKey: ["barbershop-official"] });
            queryClient.invalidateQueries({ queryKey: ["check-official-barbershop"] });
          }
        }
      } catch (error) {
        console.error("Erro ao garantir barbearia oficial:", error);
      }
    };

    markAsOfficial();
  }, [isSuperAdmin, officialBarbershop, queryClient]);

  return null; // Componente invisível
};

