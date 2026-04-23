import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

export type ProfileData = {
  name: string;
  age: number;
  weight: number;
  height: number;
  image: string | null;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

type ProfileContextType = {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  fetchProfile: () => Promise<void>;
  saveProfile: () => Promise<{ error: any | null }>;
  loading: boolean;
};

const defaultProfile: ProfileData = {
  name: "",
  age: 0,
  weight: 0,
  height: 0,
  image: null,
  calories: 2000,
  protein: 103,
  carb: 255,
  fat: 55,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(false);

  const getUserId = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("No authenticated user:", error);
      return null;
    }

    return user.id;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const userId = await getUserId();
      if (!userId) return;

      const [
        { data: profileRow, error: profileError },
        { data: goalsRow, error: goalsError },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("user_goals")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      if (goalsError) {
        console.error("Goals fetch error:", goalsError);
      }

      setProfile({
        name: profileRow?.full_name ?? "",
        age: Number(profileRow?.age ?? 0),
        weight: Number(profileRow?.weight ?? 0),
        height: Number(profileRow?.height ?? 0),
        image: null,
        calories: Number(goalsRow?.calorie_goal ?? 2000),
        protein: Number(goalsRow?.protein_goal ?? 103),
        carb: Number(goalsRow?.carb_goal ?? 255),
        fat: Number(goalsRow?.fat_goal ?? 55),
      });
    } catch (error) {
      console.error("fetchProfile failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);

      const userId = await getUserId();
      if (!userId) {
        return { error: new Error("No authenticated user") };
      }

      const now = new Date().toISOString();

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: profile.name,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          updated_at: now,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile save error:", profileError);
        return { error: profileError };
      }

      const { error: goalsError } = await supabase.from("user_goals").upsert(
        {
          user_id: userId,
          calorie_goal: profile.calories,
          protein_goal: profile.protein,
          carb_goal: profile.carb,
          fat_goal: profile.fat,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (goalsError) {
        console.error("Goals save error:", goalsError);
        return { error: goalsError };
      }

      return { error: null };
    } catch (error) {
      console.error("saveProfile failed:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, fetchProfile, saveProfile, loading }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return context;
}