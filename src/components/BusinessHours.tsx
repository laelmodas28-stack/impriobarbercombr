import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useBarbershopContext } from "@/hooks/useBarbershopContext";

interface BusinessHoursData {
  days?: string[];
  open?: string;
  close?: string;
}

export const BusinessHours = () => {
  const { barbershop } = useBarbershopContext();

  // Parse business_hours JSON field
  const getBusinessHours = (): BusinessHoursData => {
    if (!barbershop?.business_hours) return {};
    
    try {
      if (typeof barbershop.business_hours === 'string') {
        return JSON.parse(barbershop.business_hours);
      }
      return barbershop.business_hours as BusinessHoursData;
    } catch {
      return {};
    }
  };

  const hours = getBusinessHours();

  const formatTime = (time: string | undefined) => {
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
            {hours.open && hours.close 
              ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
              : '09:00 - 19:00'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {hours.days && hours.days.length > 0
              ? hours.days.join(", ")
              : 'Segunda a Sábado'
            }
          </p>
        </div>
      </div>
    </Card>
  );
};
