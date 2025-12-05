import { Outlet, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarbershopProvider } from "@/contexts/BarbershopContext";
import { Loader2 } from "lucide-react";

const BarbershopLayout = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: barbershop, isLoading, error } = useQuery({
    queryKey: ["barbershop-exists", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("barbershops")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !barbershop) {
    return <Navigate to="/" replace />;
  }

  return (
    <BarbershopProvider slug={slug}>
      <Outlet />
    </BarbershopProvider>
  );
};

export default BarbershopLayout;
