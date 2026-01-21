import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, isAfter } from "date-fns";

export interface TrialStatus {
  isInTrial: boolean;
  trialExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  hasActiveSubscription: boolean;
  isLoading: boolean;
}

export const useTrialStatus = (barbershopId?: string): TrialStatus => {
  const { user } = useAuth();

  // Check barbershop subscription status (platform level)
  const { data: barbershopSubscription, isLoading } = useQuery({
    queryKey: ["barbershop-subscription-status", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return null;

      const { data, error } = await supabase
        .from("barbershop_subscriptions")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!barbershopId,
  });

  // If no user or no barbershop, return default
  if (!user || !barbershopId) {
    return {
      isInTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      trialEndDate: null,
      hasActiveSubscription: false,
      isLoading,
    };
  }

  // No subscription record - treat as expired trial
  if (!barbershopSubscription) {
    return {
      isInTrial: false,
      trialExpired: true,
      daysRemaining: 0,
      trialEndDate: null,
      hasActiveSubscription: false,
      isLoading,
    };
  }

  const { plan_type, status, trial_ends_at, subscription_ends_at } = barbershopSubscription;

  // Check if subscription is suspended/cancelled
  if (status === "suspended" || status === "cancelled") {
    return {
      isInTrial: false,
      trialExpired: true,
      daysRemaining: 0,
      trialEndDate: null,
      hasActiveSubscription: false,
      isLoading,
    };
  }

  // Check if it's a paid subscription
  if (plan_type !== "trial") {
    const now = new Date();
    const subEnd = subscription_ends_at ? new Date(subscription_ends_at) : null;
    const hasActive = subEnd ? isAfter(subEnd, now) : true;

    return {
      isInTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      trialEndDate: null,
      hasActiveSubscription: hasActive,
      isLoading,
    };
  }

  // It's a trial - check expiration
  const trialEndDate = trial_ends_at ? new Date(trial_ends_at) : null;
  const now = new Date();
  
  if (!trialEndDate) {
    return {
      isInTrial: true,
      trialExpired: false,
      daysRemaining: 7,
      trialEndDate: null,
      hasActiveSubscription: false,
      isLoading,
    };
  }

  const trialExpired = isAfter(now, trialEndDate);
  const daysRemaining = Math.max(0, differenceInDays(trialEndDate, now));

  return {
    isInTrial: !trialExpired,
    trialExpired,
    daysRemaining,
    trialEndDate,
    hasActiveSubscription: false,
    isLoading,
  };
};
