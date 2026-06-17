import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function OnboardingModal() {
  const { user, updateUser } = useAppStore();

  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      updateUser({ hasCompletedOnboarding: true });
    }
  }, [user, updateUser]);

  return null;
}

