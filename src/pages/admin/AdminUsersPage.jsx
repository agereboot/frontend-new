import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Search, Plus, ChevronLeft, ChevronRight, UserCog, UserX, UserCheck, Eye } from "lucide-react";

import AppSelect, { AppSelectGroup, AppSelectOption } from "@/components/ui/app-select";
const ROLE_COLORS = {
  super_admin: "bg-red-500/10 text-red-400",
  support_agent: "bg-amber-500/10 text-amber-400",
  cxo_executive: "bg-yellow-500/10 text-yellow-400",
  longevity_physician: "bg-emerald-500/10 text-emerald-400",
  fitness_coach: "bg-blue-500/10 text-blue-400",
  psychologist: "bg-purple-500/10 text-purple-400",
  nutritional_coach: "bg-teal-500/10 text-teal-400",
  corporate_hr_admin: "bg-indigo-500/10 text-indigo-400",
  corporate_wellness_head: "bg-cyan-500/10 text-cyan-400",
  employee: "bg-slate-500/10 text-slate-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed");
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reactivate`);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-users-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Roles</h1>
          <p className="text-sm text-slate-500 mt-1">{total} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} data-testid="admin-create-user-btn"
          className="flex items-center gap-2 px-4 py-2 bg-[#7B35D8] hover:bg-[#6B25C8] text-white text-sm rounded-lg transition-all">
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            data-testid="admin-users-search"
            className="w-full pl-10 pr-4 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#7B35D8]/50 focus:outline-none" />
        </div>
        <AppSelect value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          data-testid="admin-users-role-filter"
          className="px-3 py-2 bg-[#11111a] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
          <AppSelectOption value="">All Roles</AppSelectOption>
          {Object.keys(ROLE_COLORS).map(r => (
            <AppSelectOption key={r} value={r}>{r.replace(/_/g, " ")}</AppSelectOption>
          ))}
        </AppSelect>
      </div>

      {/* Table */}
      <div className="bg-[#11111a] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full" data-testid="admin-users-table">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Name</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Email</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Role</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Plan</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Status</th>
              <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Joined</th>
              <th className="text-right text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-mono">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-500">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors" data-testid={`user-row-${u.id}`}>
                <td className="px-4 py-3 text-sm text-white font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-slate-400 font-mono">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${ROLE_COLORS[u.role] || "bg-slate-500/10 text-slate-400"}`}>
                    {(u.role || "").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{(u.plan || "free").replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.status === "deactivated" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {u.status || "active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{u.joined_at?.slice(0, 10) || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setSelectedUser(u)} title="View" data-testid={`view-user-${u.id}`}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all"><Eye size={14} /></button>
                    {u.status === "deactivated" ? (
                      <button onClick={() => handleReactivate(u.id)} title="Reactivate" data-testid={`reactivate-user-${u.id}`}
                        className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all"><UserCheck size={14} /></button>
                    ) : (
                      <button onClick={() => handleDeactivate(u.id)} title="Deactivate" data-testid={`deactivate-user-${u.id}`}
                        className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"><UserX size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between" data-testid="admin-users-pagination">
          <p className="text-xs text-slate-500">Page {page} of {pages} ({total} users)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-1.5 bg-[#11111a] border border-white/10 rounded-md text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="p-1.5 bg-[#11111a] border border-white/10 rounded-md text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}

      {/* User Detail Modal */}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdated={fetchUsers} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee", plan: "rookie_league", age: 30, sex: "M" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/users", form);
      onCreated();
      onClose();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="create-user-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            data-testid="create-user-name"
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:border-[#7B35D8]/50 focus:outline-none" />
          <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            data-testid="create-user-email"
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:border-[#7B35D8]/50 focus:outline-none" />
          <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            data-testid="create-user-password"
            className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:border-[#7B35D8]/50 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <AppSelect value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} data-testid="create-user-role"
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {Object.keys(ROLE_COLORS).map(r => <AppSelectOption key={r} value={r}>{r.replace(/_/g, " ")}</AppSelectOption>)}
            </AppSelect>
            <AppSelect value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} data-testid="create-user-plan"
              className="px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              <AppSelectOption value="rookie_league">Rookie League</AppSelectOption>
              <AppSelectOption value="velocity_circuit">Velocity Circuit</AppSelectOption>
              <AppSelectOption value="titan_arena">Titan Arena</AppSelectOption>
              <AppSelectOption value="apex_nexus">Apex Nexus</AppSelectOption>
            </AppSelect>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} data-testid="create-user-submit"
              className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose, onUpdated }) {
  const [editRole, setEditRole] = useState(user.role);
  const [editPlan, setEditPlan] = useState(user.plan || "rookie_league");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}`, { role: editRole, plan: editPlan });
      onUpdated();
      onClose();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="user-detail-modal">
      <div className="bg-[#11111a] border border-white/10 rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-white mb-1">{user.name}</h2>
        <p className="text-sm text-slate-400 font-mono mb-4">{user.email}</p>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div><span className="text-slate-500">ID:</span> <span className="text-white font-mono text-xs">{user.id?.slice(0, 8)}...</span></div>
          <div><span className="text-slate-500">Age:</span> <span className="text-white">{user.age}</span></div>
          <div><span className="text-slate-500">Sex:</span> <span className="text-white">{user.sex}</span></div>
          <div><span className="text-slate-500">Status:</span> <span className={user.status === "deactivated" ? "text-red-400" : "text-emerald-400"}>{user.status || "active"}</span></div>
          <div><span className="text-slate-500">Joined:</span> <span className="text-white font-mono text-xs">{user.joined_at?.slice(0, 10)}</span></div>
          <div><span className="text-slate-500">Franchise:</span> <span className="text-white">{user.franchise || "—"}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Role</label>
            <AppSelect value={editRole} onChange={e => setEditRole(e.target.value)} data-testid="edit-user-role"
              className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              {Object.keys(ROLE_COLORS).map(r => <AppSelectOption key={r} value={r}>{r.replace(/_/g, " ")}</AppSelectOption>)}
            </AppSelect>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Plan</label>
            <AppSelect value={editPlan} onChange={e => setEditPlan(e.target.value)} data-testid="edit-user-plan"
              className="w-full px-3 py-2 bg-[#0a0a12] border border-white/10 rounded-lg text-sm text-white focus:outline-none">
              <AppSelectOption value="rookie_league">Rookie League</AppSelectOption>
              <AppSelectOption value="velocity_circuit">Velocity Circuit</AppSelectOption>
              <AppSelectOption value="titan_arena">Titan Arena</AppSelectOption>
              <AppSelectOption value="apex_nexus">Apex Nexus</AppSelectOption>
            </AppSelect>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-sm hover:bg-white/5">Close</button>
          <button onClick={handleSave} disabled={saving} data-testid="save-user-changes"
            className="flex-1 px-4 py-2 bg-[#7B35D8] text-white rounded-lg text-sm hover:bg-[#6B25C8] disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
