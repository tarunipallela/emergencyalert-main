import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MapPin, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SOSState = "idle" | "countdown" | "locating" | "sent";

const SOSButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SOSState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [contactCount, setContactCount] = useState(0);

  const resetState = useCallback(() => {
    setState("idle");
    setCountdown(3);
    setLocation(null);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      setState("locating");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown]);

  // Fetch location when locating
  useEffect(() => {
    if (state !== "locating") return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);

        // Fetch contacts
        const { data: contacts } = await supabase
          .from("emergency_contacts")
          .select("*")
          .eq("user_id", user!.id);

        const numContacts = contacts?.length ?? 0;
        setContactCount(numContacts);

        // Log alert
        await supabase.from("alert_logs").insert({
          user_id: user!.id,
          latitude: coords.lat,
          longitude: coords.lng,
          contacts_notified: numContacts,
        });

        // Simulate sending alerts
        contacts?.forEach((contact) => {
          console.log(
            `🚨 ALERT SENT to ${contact.name} (${contact.phone}): Emergency at https://www.google.com/maps?q=${coords.lat},${coords.lng}`
          );
        });

        setState("sent");
      },
      (err) => {
        toast({
          title: "Location Error",
          description: "Could not fetch GPS location. Please enable location services.",
          variant: "destructive",
        });
        resetState();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [state, user, toast, resetState]);

  const handleSOS = () => {
    setState("countdown");
    setCountdown(3);
  };

  const handleCancel = () => {
    resetState();
    toast({ title: "Alert Cancelled", description: "Emergency alert was cancelled." });
  };

  const mapsLink = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  if (state === "sent" && location) {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="w-20 h-20 rounded-full bg-safe/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-safe" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">Alert Sent Successfully</h2>
          <p className="text-sm text-muted-foreground">
            {contactCount} contact{contactCount !== 1 ? "s" : ""} notified with your location
          </p>
        </div>
        <div className="w-full p-4 rounded-xl bg-card border border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </span>
          </div>
          <a
            href={mapsLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            Open in Google Maps →
          </a>
        </div>
        <Button
          variant="outline"
          onClick={resetState}
          className="w-full mt-2"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (state === "countdown") {
    return (
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emergency/10 sos-active" />
          <div className="relative flex flex-col items-center">
            <span className="text-6xl font-bold text-emergency">{countdown}</span>
            <span className="text-xs font-medium text-emergency/70 uppercase tracking-wider">
              Sending Alert
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={handleCancel}
          className="gap-2 border-emergency/30 text-emergency hover:bg-emergency/5"
        >
          <X className="w-4 h-4" />
          Cancel Alert
        </Button>
      </div>
    );
  }

  if (state === "locating") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center animate-pulse">
          <MapPin className="w-10 h-10 text-warning" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Fetching your location...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <button
        onClick={handleSOS}
        className={cn(
          "relative w-40 h-40 rounded-full flex flex-col items-center justify-center",
          "bg-emergency text-emergency-foreground",
          "shadow-[0_0_40px_hsl(var(--emergency)/0.3)]",
          "sos-pulse transition-transform active:scale-95"
        )}
      >
        <AlertTriangle className="w-10 h-10 mb-1" />
        <span className="text-2xl font-extrabold tracking-wider">SOS</span>
      </button>
      <p className="text-sm text-muted-foreground text-center max-w-[240px]">
        Press the SOS button in case of emergency. Your GPS location will be sent to all registered contacts.
      </p>
    </div>
  );
};

export default SOSButton;
