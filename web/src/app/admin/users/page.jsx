"use client";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function AdminUsersPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [depots, setDepots] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "DRIVER", depotId: "" });
  const roles = useMemo(()=> ["ADMIN","MANAGER","SUPERVISOR","MECHANIC","DRIVER","SECURITY"], []);

  async function authHeaders(role) {
    const { authHeaders } = await import("@/lib/authClient");
    return authHeaders({ requiredRole: role });
  }

  async function load() {
    try {
      const headers = await authHeaders('ADMIN');
      const [uRes, dRes] = await Promise.all([
        fetch(`${api}/users`, { headers }),
        fetch(`${api}/depots`, { headers }),
      ]);
      setUsers(uRes.ok ? await uRes.json() : []);
      setDepots(dRes.ok ? await dRes.json() : []);
    } catch (_) {
      setUsers([]);
      setDepots([]);
    }
  }
  useEffect(()=>{ load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      const headers = await authHeaders('ADMIN');
      const res = await fetch(`${api}/users`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (res.ok) {
        setForm({ name: "", email: "", password: "", role: "DRIVER", depotId: "" });
        await load();
        toast.success('User created');
      } else {
        const t = await res.text();
        toast.error(`Failed to create: ${t}`);
      }
    } catch (_) {
      toast.error('Failed to create user');
    }
  }

  async function assignDepot(id, depotId) {
    try {
      const headers = await authHeaders('ADMIN');
      const res = await fetch(`${api}/users/${id}/assign`, { method: 'PATCH', headers, body: JSON.stringify({ depotId: depotId || null }) });
      if (res.ok) {
        await load();
      } else {
        toast.error('Failed to assign depot');
      }
    } catch(_) { toast.error('Failed to assign depot'); }
  }

  async function setActive(id, isActive) {
    try {
      const headers = await authHeaders('ADMIN');
      const res = await fetch(`${api}/users/${id}/active`, { method: 'PATCH', headers, body: JSON.stringify({ isActive }) });
      if (res.ok) {
        await load();
      } else {
        toast.error('Failed to update status');
      }
    } catch(_) { toast.error('Failed to update status'); }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-6">
      <h1 className="text-xl font-semibold">Admin · Users</h1>

      <section className="rounded-lg border p-4">
        <div className="font-medium mb-3">Create User</div>
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
          <input className="border rounded px-2 py-1 text-sm md:col-span-2" placeholder="Name" value={form.name} onChange={(e)=> setForm(v=> ({...v, name: e.target.value}))} required />
          <input className="border rounded px-2 py-1 text-sm md:col-span-2" placeholder="Email" value={form.email} onChange={(e)=> setForm(v=> ({...v, email: e.target.value}))} type="email" required />
          <input className="border rounded px-2 py-1 text-sm" placeholder="Password" value={form.password} onChange={(e)=> setForm(v=> ({...v, password: e.target.value}))} type="password" required />
          <select className="border rounded px-2 py-1 text-sm" value={form.role} onChange={(e)=> setForm(v=> ({...v, role: e.target.value}))}>
            {roles.map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="border rounded px-2 py-1 text-sm md:col-span-2" value={form.depotId} onChange={(e)=> setForm(v=> ({...v, depotId: e.target.value}))}>
            <option value="">No depot</option>
            {Array.isArray(depots) && depots.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="px-3 py-2 text-sm border rounded">Create</button>
        </form>
      </section>

      <section className="rounded-lg border p-4">
        <div className="font-medium mb-3">Users</div>
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Depot</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.map(u=> (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-3">{u.name}</td>
                  <td className="py-2 pr-3">{u.email}</td>
                  <td className="py-2 pr-3">{u.role}</td>
                  <td className="py-2 pr-3">
                    <select className="border rounded px-2 py-1 text-sm" value={u.depotId || ""} onChange={(e)=> assignDepot(u.id, e.target.value || null)}>
                      <option value="">No depot</option>
                      {Array.isArray(depots) && depots.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3">{u.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-3">
                    <button className="px-2 py-1 border rounded mr-2" onClick={()=> setActive(u.id, !u.isActive)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


