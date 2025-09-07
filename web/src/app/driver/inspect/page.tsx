"use client";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { enqueue, startAutoSync } from "@/lib/offlineQueue";

export default function DriverInspectPage() {
  useEffect(() => { startAutoSync(); }, []);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const toast = useToast();
  const [truckQuery, setTruckQuery] = useState("");
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [driverId, setDriverId] = useState("");
  const [type, setType] = useState<'PRE_TRIP'|'POST_TRIP'>('PRE_TRIP');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const checklist = useMemo(() => ({
    preTrip: {
      vehicle: [
        { id: 'truck_number', question: 'Confirm Truck Number / Plate', type: 'string' },
        { id: 'odometer_start', question: 'Odometer reading', type: 'number' },
        { id: 'driver_id_check', question: 'Do you have your Driver ID and daily logbook?', type: 'boolean' },
      ],
      exterior: [
        { id: 'walkaround', question: 'Walk-around complete?', type: 'boolean' },
        { id: 'damage', question: 'Any visible body damage or fluid leaks?', type: 'boolean', notes: true },
        { id: 'lights', question: 'Lights & reflectors functional?', type: 'boolean' },
        { id: 'tires', question: 'Tires checked (tread, inflation, lug nuts)?', type: 'boolean' },
        { id: 'mirrors', question: 'Mirrors clean and properly adjusted?', type: 'boolean' },
      ],
      engine: [
        { id: 'oil', question: 'Oil level okay?', type: 'boolean' },
        { id: 'coolant', question: 'Coolant level okay?', type: 'boolean' },
        { id: 'washer_fluid', question: 'Windshield washer fluid full?', type: 'boolean' },
        { id: 'fuel_level', question: 'Fuel level', type: 'enum', options: ['Full','3/4','1/2','1/4','Low'] },
      ],
      safety: [
        { id: 'fire_extinguisher', question: 'Fire extinguisher present & charged?', type: 'boolean' },
        { id: 'triangles', question: 'Emergency triangles present?', type: 'boolean' },
        { id: 'first_aid', question: 'First-aid kit stocked?', type: 'boolean' },
      ],
      brakes: [
        { id: 'air_pressure', question: 'Air pressure build-up test passed?', type: 'enum', options: ['Yes','No','N/A'] },
        { id: 'parking_brake', question: 'Parking brake held during tug test?', type: 'boolean' },
        { id: 'steering', question: 'Steering wheel play within safe limit?', type: 'boolean' },
      ],
    },
    postTrip: {
      completion: [
        { id: 'truck_number_return', question: 'Confirm Truck Number / Plate', type: 'string' },
        { id: 'odometer_end', question: 'Final Odometer Reading', type: 'number' },
        { id: 'fuel_return', question: 'Fuel level on return', type: 'enum', options: ['Full','3/4','1/2','1/4','Low'] },
        { id: 'parking_spot', question: 'Parking spot number assigned by security', type: 'string' },
      ],
      exterior: [
        { id: 'new_damage', question: 'Any new damage during trip?', type: 'boolean', notes: true },
        { id: 'lights_return', question: 'Lights working at return?', type: 'boolean' },
        { id: 'tires_return', question: 'Tires in safe condition?', type: 'boolean' },
      ],
      engine: [
        { id: 'leaks_trip', question: 'Any leaks noticed during trip?', type: 'boolean', notes: true },
        { id: 'warning_lights', question: 'Warning lights on dashboard?', type: 'boolean' },
      ],
      safety: [
        { id: 'fire_extinguisher_return', question: 'Fire extinguisher still present?', type: 'boolean' },
        { id: 'triangles_return', question: 'Emergency triangles still present?', type: 'boolean' },
        { id: 'first_aid_return', question: 'First-aid kit intact?', type: 'boolean' },
      ],
      driver_feedback: [
        { id: 'mechanical_issues', question: 'Any mechanical issues noticed during trip?', type: 'string' },
        { id: 'unsafe_events', question: 'Any unsafe events (hard braking, near miss, police stop)?', type: 'boolean', notes: true },
        { id: 'vehicle_condition', question: 'Overall condition of vehicle', type: 'enum', options: ['Good','Needs Service','Unsafe'] },
      ],
    }
  }), []);

  async function search() {
    const r = await fetch(`${apiUrl}/trucks/lookup?q=${encodeURIComponent(truckQuery)}`);
    if (r.ok) setTrucks(await r.json());
  }

  async function submit() {
    if (!driverId || !selectedTruckId) { toast.error('Driver and Truck required'); return; }
    try {
      const r = await fetch(`${apiUrl}/driver-inspections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driverId, truckId: selectedTruckId, inspectionType: type, notes, answers }) });
      if (r.ok) { toast.success('Inspection submitted'); setNotes(""); setAnswers({}); }
      else {
        enqueue({ endpoint: '/driver-inspections', method: 'POST', body: { driverId, truckId: selectedTruckId, inspectionType: type, notes, answers } });
        toast.success('Offline: queued inspection');
      }
    } catch (_) {
      enqueue({ endpoint: '/driver-inspections', method: 'POST', body: { driverId, truckId: selectedTruckId, inspectionType: type, notes, answers } });
      toast.success('Offline: queued inspection');
    }
  }

  return (
    <main className="max-w-3xl p-6 mx-auto grid gap-4">
      <h1 className="text-xl font-semibold">Driver Inspection</h1>
      <label className="grid gap-1">
        <span className="text-sm">Driver ID</span>
        <input className="border p-2 rounded" value={driverId} onChange={e=>setDriverId(e.target.value)} />
      </label>
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Truck search (plate/VIN/barcode/Truck ID)</span>
          <input className="border p-2 rounded" value={truckQuery} onChange={e=>setTruckQuery(e.target.value)} />
        </label>
        <button className="border rounded px-3 py-2" onClick={search}>Search</button>
      </div>
      {trucks.length > 0 && (
        <select className="border p-2 rounded" value={selectedTruckId} onChange={e=>setSelectedTruckId(e.target.value)}>
          <option value="">Select truck</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} · {t.vin}</option>)}
        </select>
      )}
      <div className="grid sm:grid-cols-3 gap-2">
        <label className="grid gap-1">
          <span className="text-sm">Type</span>
          <select className="border p-2 rounded" value={type} onChange={e=>setType(e.target.value as any)}>
            <option value="PRE_TRIP">Pre-trip</option>
            <option value="POST_TRIP">Post-trip</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Start KM</span>
          <input type="number" className="border p-2 rounded" value={answers["odometer_start"] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, odometer_start: e.target.value ? Number(e.target.value) : '' }))} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">End KM</span>
          <input type="number" className="border p-2 rounded" value={answers["odometer_end"] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, odometer_end: e.target.value ? Number(e.target.value) : '' }))} />
        </label>
      </div>

      {/* Dynamic checklist */}
      {type === 'PRE_TRIP' ? (
        <Checklist sections={checklist.preTrip} answers={answers} setAnswers={setAnswers} />
      ) : (
        <Checklist sections={checklist.postTrip} answers={answers} setAnswers={setAnswers} />
      )}
      <label className="grid gap-1">
        <span className="text-sm">Notes</span>
        <textarea className="border p-2 rounded" value={notes} onChange={e=>setNotes(e.target.value)} />
      </label>
      <button className="bg-black text-white rounded px-4 py-2" onClick={submit}>Submit Inspection</button>
    </main>
  );
}


function Checklist({ sections, answers, setAnswers }: { sections: Record<string, any[]>; answers: Record<string, any>; setAnswers: (fn: any) => void }) {
  return (
    <div className="grid gap-4">
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="border rounded p-3">
          <div className="font-medium mb-2 capitalize">{section.replace('_',' ')}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(items as any[]).map(item => (
              <div key={item.id} className="grid gap-1">
                <span className="text-sm">{item.question}</span>
                {item.type === 'boolean' && (
                  <select className="border p-2 rounded" value={answers[item.id] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, [item.id]: e.target.value === 'true' }))}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
                {item.type === 'string' && (
                  <input className="border p-2 rounded" value={answers[item.id] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, [item.id]: e.target.value }))} />
                )}
                {item.type === 'number' && (
                  <input type="number" className="border p-2 rounded" value={answers[item.id] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, [item.id]: e.target.value ? Number(e.target.value) : '' }))} />
                )}
                {item.type === 'enum' && (
                  <select className="border p-2 rounded" value={answers[item.id] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, [item.id]: e.target.value }))}>
                    <option value="">Select</option>
                    {(item.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
                {item.notes && (
                  <textarea placeholder="Notes" className="border p-2 rounded" value={answers[item.id+"_notes"] ?? ''} onChange={e=>setAnswers((a:any)=>({ ...a, [item.id+"_notes"]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

