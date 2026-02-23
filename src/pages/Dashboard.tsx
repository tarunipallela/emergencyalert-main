import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import SOSButton from "@/components/SOSButton";
import BottomNav from "@/components/BottomNav";
import { Shield, Activity } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [contactCount, setContactCount] = useState(0);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { count } = await supabase
        .from("emergency_contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setContactCount(count ?? 0);

      const { data: alerts } = await supabase
        .from("alert_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (alerts && alerts.length > 0) {
        setLastAlert(new Date(alerts[0].created_at).toLocaleString());
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border/50 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Emergency Alert</h1>
              <p className="text-[10px] text-muted-foreground">Doctor Safety System</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe/10">
            <div className="w-2 h-2 rounded-full bg-safe" />
            <span className="text-[10px] font-semibold text-safe">SAFE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-8">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-3.5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Contacts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{contactCount}</p>
            <p className="text-[10px] text-muted-foreground">registered</p>
          </div>
          <div className="p-3.5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Last Alert</span>
            </div>
            <p className={`text-sm font-semibold ${lastAlert ? "text-foreground" : "text-muted-foreground"}`}>
              {lastAlert ?? "No alerts"}
            </p>
          </div>
        </div>

        {/* SOS Button */}
        <SOSButton />

        {/* Prototype notice */}
        <div className="mt-6 p-3 rounded-lg bg-warning/5 border border-warning/10 text-center">
          <p className="text-[11px] text-warning font-medium">
            ⚠️ Prototype Demo — Alerts are simulated (console log)
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
