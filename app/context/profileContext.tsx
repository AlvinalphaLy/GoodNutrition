import React, { createContext, ReactNode, useContext, useState } from "react";

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
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>({
    name: "John Doe",
    age: 0,
    weight: 0,
    height: 0,
    image: null,
    calories: 2000,
    protein: 103,
    carb: 255,
    fat: 55,
  });

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
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
