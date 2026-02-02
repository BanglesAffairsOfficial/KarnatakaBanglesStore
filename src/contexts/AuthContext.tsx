import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  unreadNotifications: number;
  refreshUnread: () => Promise<void>;
  clearUnread: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationChannel, setNotificationChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // If the reset password email lands on the wrong route (e.g., /login),
  // detect the recovery hash and send the user to /reset-password with tokens intact.
  useEffect(() => {
    const { hash, search, pathname } = window.location;
    const hasRecovery = hash.includes("type=recovery") || search.includes("type=recovery");
    if (hasRecovery && !pathname.startsWith("/reset-password")) {
      const suffix = hash || search || "";
      // Preserve tokens and query/fragment when sending to reset page
      window.location.replace(`/reset-password${suffix}`);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check admin status with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
            refreshUnread(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUnreadNotifications(0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkAdminStatus(session.user.id);
        refreshUnread(session.user.id);
      } else {
        setUnreadNotifications(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for new notifications for this user and update the badge immediately
    if (!user?.id) {
      notificationChannel?.unsubscribe();
      setNotificationChannel(null);
      return;
    }

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => refreshUnread(user.id)
      )
      .subscribe();

    setNotificationChannel(channel);

    return () => {
      channel.unsubscribe();
      setNotificationChannel(null);
    };
  }, [user?.id]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUnreadNotifications(0);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const refreshUnread = async (uid?: string) => {
    const id = uid || user?.id;
    if (!id) {
      setUnreadNotifications(0);
      return;
    }

    const userEmail = user?.email?.toLowerCase() || "";
    const userId = id.toLowerCase();

    // Count unread personal notifications
    const { count: notifCount, error: notifErr } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("is_read", false);

    let broadcastCount = 0;
    // Count broadcasts applicable to this user (all or custom including email/id)
    const { data: broadcasts, error: bErr } = await supabase
      .from("broadcasts")
      .select("audience")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!bErr && broadcasts) {
      broadcasts.forEach((b) => {
        const audience = (b.audience || "all").toLowerCase();
        if (audience === "all") {
          broadcastCount += 1;
        } else if (audience.startsWith("custom:")) {
          const targets = audience
            .replace("custom:", "")
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
          if (targets.includes(userEmail) || targets.includes(userId)) {
            broadcastCount += 1;
          }
        }
      });
    }

    if (!notifErr) {
      setUnreadNotifications((notifCount || 0) + broadcastCount);
    }
  };

  const clearUnread = async () => {
    const id = user?.id;
    if (id) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", id)
        .eq("is_read", false);
    }
    setUnreadNotifications(0);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, unreadNotifications, refreshUnread, clearUnread, signUp, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
