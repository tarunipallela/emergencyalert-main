import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  role: string | null;
  status: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Profile fetch error:", error);
      return null;
    }

    return {
      id: userId,
      role: data.role,
      status: data.status,
    };
  };

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      setSession(session);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);

        if (!profileData) {
          await supabase.auth.signOut();
          setProfile(null);
        } 
        else if (profileData.status === "pending") {
          alert("Your account is awaiting admin approval.");
          await supabase.auth.signOut();
          setProfile(null);
        } 
        else if (profileData.status === "rejected") {
          alert("Your account has been rejected. Please contact support.");
          await supabase.auth.signOut();
          setProfile(null);
        } 
        else if (profileData.status === "approved") {
          setProfile(profileData);
        } 
        else {
          await supabase.auth.signOut();
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};