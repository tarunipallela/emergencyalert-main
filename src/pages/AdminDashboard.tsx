import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"profiles">;

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else if (data) {
      setUsers(data);
    }

    setLoading(false);
  };

  const updateStatus = async (userId: string, status: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    fetchUsers();
  };

  const updateRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      console.error("Error updating role:", error);
      return;
    }

    fetchUsers();
  };

  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access Denied
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === "pending");
  const approvedUsers = users.filter(u => u.status === "approved");
  const rejectedUsers = users.filter(u => u.status === "rejected");

  const renderUserCard = (user: UserProfile) => (
    <div
      key={user.id}
      className="border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm"
    >
      <div>
        <p><strong>Name:</strong> {user.name ?? "N/A"}</p>
        <p><strong>Phone:</strong> {user.phone ?? "N/A"}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.status}</p>
      </div>

      <div className="flex gap-2 flex-wrap">

        {user.status === "pending" && (
          <>
            <button
              onClick={() => updateStatus(user.id, "approved")}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(user.id, "rejected")}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </>
        )}

        {user.status === "approved" && user.role === "user" && (
          <button
            onClick={() => updateRole(user.id, "admin")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Promote
          </button>
        )}

        {user.role === "admin" && user.id !== profile.id && (
          <button
            onClick={() => updateRole(user.id, "user")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
          >
            Demote
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-blue-600">
        Admin Control Panel
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-3 text-orange-600">
              Pending Users
            </h2>
            <div className="space-y-3">
              {pendingUsers.length === 0
                ? <p>No pending users.</p>
                : pendingUsers.map(renderUserCard)}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-green-600">
              Approved Users
            </h2>
            <div className="space-y-3">
              {approvedUsers.length === 0
                ? <p>No approved users.</p>
                : approvedUsers.map(renderUserCard)}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-red-600">
              Rejected Users
            </h2>
            <div className="space-y-3">
              {rejectedUsers.length === 0
                ? <p>No rejected users.</p>
                : rejectedUsers.map(renderUserCard)}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;