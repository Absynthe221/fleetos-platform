"use client";
import { useEffect, useState } from "react";
import { currentRole } from "@/lib/authClient";
import LogoutButton from "./LogoutButton";

export default function SidebarNav() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { setRole(currentRole()); }, []);
  const driverOnly = process.env.NEXT_PUBLIC_DRIVER_ONLY === 'true';

  return (
    <nav className="grid gap-2 text-sm">
      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN' || role === null) && <a className="hover:underline" href="/">Dashboard</a>}
      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN') && <a className="hover:underline" href="/trucks/new">Create Truck</a>}
      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN') && <a className="hover:underline" href="/trucks">Trucks</a>}
      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN') && <a className="hover:underline" href="/yard">Yard</a>}
      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN') && <a className="hover:underline" href="/alerts">Alerts</a>}
      {!driverOnly && (role === 'ADMIN') && <a className="hover:underline" href="/yard/new">New Depot</a>}

      {(driverOnly || role === 'DRIVER') && <a className="hover:underline" href="/driver/inspect">Driver Inspection</a>}
      {(driverOnly || role === 'DRIVER') && <a className="hover:underline" href="/driver/hos">Driver HOS</a>}

      {!driverOnly && (role === 'MANAGER' || role === 'ADMIN') && <a className="hover:underline" href="/hos/compliance">HOS Compliance</a>}

      {!driverOnly && (role === 'MECHANIC') && <a className="hover:underline" href="/mechanic">Mechanic</a>}
      {!driverOnly && (role === 'SECURITY') && <a className="hover:underline" href="/security">Security Console</a>}
      {!driverOnly && (role === 'ADMIN') && <a className="hover:underline" href="/admin/users">Admin · Users</a>}

      <a className="hover:underline" href="/login">Login</a>
      <LogoutButton />
    </nav>
  );
}


