import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, addDays, isAfter } from "date-fns";

export interface TrialStatus {
  isInTrial: boolean;
  trialExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  hasActiveSubscription: boolean;
  isLoading: boolean;
}

const TRIAL_DAYS = 7;

export const useTrialStatus = (barbershopId?: string): TrialStatus => {
  const { user } = useAuth();

  // Check if user has active subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["client-subscription-status", user?.id, barbershopId],
    queryFn: async () => {
      if (!user || !barbershopId) return null;

      const { data, error } = await supabase
        .from("client_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("barbershop_id", barbershopId)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!barbershopId,
  });

  // Get user profile creation date (trial start)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-trial", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = subscriptionLoading || profileLoading;
  const hasActiveSubscription = !!subscription;

  // Calculate trial status
  if (!user || !profile?.created_at) {
    return {
      isInTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      trialEndDate: null,
      hasActiveSubscription: false,
      isLoading,
    };
  }

  const createdAt = new Date(profile.created_at);
  const trialEndDate = addDays(createdAt, TRIAL_DAYS);
  const now = new Date();
  const trialExpired = isAfter(now, trialEndDate);
  const daysRemaining = Math.max(0, differenceInDays(trialEndDate, now));
  const isInTrial = !trialExpired && !hasActiveSubscription;

  return {
    isInTrial,
    trialExpired: trialExpired && !hasActiveSubscription,
    daysRemaining,
    trialEndDate,
    hasActiveSubscription,
    isLoading,
  };
};
