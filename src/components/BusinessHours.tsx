import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BusinessHours = () => {
  const { data: barbershop } = useQuery({
    queryKey: ["barbershop-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("opening_time, closing_time, opening_days")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  return (
    <Card className="p-6 border-border">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {barbershop?.opening_time && barbershop?.closing_time 
              ? `${formatTime(barbershop.opening_time)} - ${formatTime(barbershop.closing_time)}`
              : '09:00 - 19:00'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {barbershop?.opening_days && barbershop.opening_days.length > 0
              ? barbershop.opening_days.join(", ")
              : 'Segunda a Sábado'
            }
          </p>
        </div>
      </div>
    </Card>
  );
};
