"use client";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) {
        const txt = await res.text().catch(()=>"Login failed");
        setError(txt);
        return;
      }
      const data = await res.json();
      if (data?.access_token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userId', data.user?.id || '');
        if (data.user?.role) localStorage.setItem('role', data.user.role);
        location.href = '/';
      }
    } catch (e) {
      setError('Network error');
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <div className="mb-4 text-xs border rounded p-3 bg-[var(--muted-bg)]">
        <div className="font-medium mb-1">Demo credentials</div>
        <div className="mb-1">Admin → Email: <code>admin@example.com</code> · Password: <code>admin123</code></div>
        <div>Driver → Email: <code>driver@example.com</code> · Password: <code>driver123</code></div>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input className="border p-2 rounded" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Password</span>
          <input className="border p-2 rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button type="submit" className="bg-black text-white rounded px-4 py-2">Sign in</button>
      </form>
      <div className="mt-3 text-sm">
        <a href="#" onClick={async (e)=>{ e.preventDefault(); const emailTrim = email.trim(); if (!emailTrim) return setError('Enter your email to request reset'); const r = await fetch(`${api}/auth/password/request`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: emailTrim }) }); const j = await r.json().catch(()=>({})); if (r.ok) { toast.success(`Reset token: ${j.token || '(check email)'}`); } else { toast.error(j?.message || 'Failed to request reset'); } }} className="underline">Forgot password?</a>
      </div>
    </main>
  );
}


