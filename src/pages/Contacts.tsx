import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ShieldCheck, Users, UserCog, Heart } from "lucide-react";

const CATEGORIES = [
  { value: "security", label: "Hospital Security", icon: ShieldCheck },
  { value: "colleague", label: "Colleague", icon: Users },
  { value: "superintendent", label: "Superintendent / Duty Officer", icon: UserCog },
  { value: "family", label: "Family Member", icon: Heart },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

interface Contact {
  id: string;
  name: string;
  phone: string;
  category: Category;
}

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<Category>("security");

  const fetchContacts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (data) setContacts(data as Contact[]);
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setCategory("security");
    setDialogOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setCategory(contact.category);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim() || !phone.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("emergency_contacts")
        .update({ name: name.trim(), phone: phone.trim(), category })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Contact Updated" });
    } else {
      if (contacts.length >= 4) {
        toast({ title: "Limit Reached", description: "Maximum 4 contacts allowed.", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("emergency_contacts")
        .insert({ user_id: user.id, name: name.trim(), phone: phone.trim(), category });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Contact Added" });
    }

    setDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    toast({ title: "Contact Deleted" });
    fetchContacts();
  };

  const getCategoryInfo = (cat: Category) =>
    CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border/50 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Emergency Contacts</h1>
          <span className="text-xs text-muted-foreground">{contacts.length}/4</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {contacts.map((contact) => {
          const cat = getCategoryInfo(contact.category);
          const Icon = cat.icon;
          return (
            <div
              key={contact.id}
              className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.phone}</p>
                <p className="text-[10px] text-primary/70 font-medium mt-0.5">{cat.label}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(contact)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}

        {contacts.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="text-sm font-medium text-foreground">No contacts yet</p>
              <p className="text-xs text-muted-foreground">
                Add up to 4 emergency contacts to receive your alerts
              </p>
            </div>
          </div>
        )}

        {contacts.length < 4 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={openAdd}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Contact" : "Add Contact"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editing ? "Update Contact" : "Add Contact"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Also allow dialog to open for editing */}
        {contacts.length >= 4 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Update Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Contacts;
