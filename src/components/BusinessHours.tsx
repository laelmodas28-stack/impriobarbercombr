import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BusinessHours = () => {
  const { data: barbershopInfo } = useQuery({
    queryKey: ["barbershop-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_info")
        .select("opening_time, closing_time, opening_days")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary mt-1" />
        <div>
          <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
          {barbershopInfo?.opening_time && barbershopInfo?.closing_time && (
            <p className="text-sm text-muted-foreground mb-2">
              {formatTime(barbershopInfo.opening_time)} - {formatTime(barbershopInfo.closing_time)}
            </p>
          )}
          {barbershopInfo?.opening_days && barbershopInfo.opening_days.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {barbershopInfo.opening_days.join(", ")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
