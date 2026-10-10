"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Calendar as CalendarIcon, CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Plus, X, LoaderCircle } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { openCalendarEvent } from "@/lib/appointmentCalendar";

type EventRow = { id: string; doctor_id?: string; type: string; title: string; date: string; time?: string; doctor?: string; hospital?: string; status: string; reason?: string };
type DoctorOption = { doctor_id: string; doctor: string; specialty: string; hospital: string };

export default function CalendarPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [view, setView] = useState<"month" | "agenda">("month");
  const [kind, setKind] = useState<"all" | "checkup" | "lab">("all");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [preferredAt, setPreferredAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reload = async () => {
    const result = await fetchAPI("/patient/calendar");
    const rows = result.events || [];
    setEvents(rows);
    const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const requestedId = query.get("reschedule");
    const selectedId = requestedId || query.get("event");
    if (selectedId) {
      const row = rows.find((event: EventRow) => event.id === selectedId);
      if (row) {
        setSelectedEvent(row);
        if (requestedId) { setShowForm(true); setReason(row.reason || row.title); if (row.doctor_id) setDoctorId(row.doctor_id); }
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  };
  useEffect(() => {
    reload().catch(e => setError(e.message || "Could not load your calendar."));
    fetchAPI("/patient/appointment-options").then((options: DoctorOption[]) => {
      setDoctors(options);
      if (options[0]) setDoctorId(current => current || options[0].doctor_id);
    }).catch(e => setError(e.message || "Could not load appointment providers."));
  }, []);

  const visibleEvents = useMemo(() => events.filter(event => kind === "all" || (kind === "lab" ? event.type === "lab" : event.type !== "lab")), [events, kind]);
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = Array.from({ length: Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));

  function openRequest(event?: EventRow) {
    setSelectedEvent(event || null); setReason(event?.reason || event?.title || ""); if (event?.doctor_id) setDoctorId(event.doctor_id); setPreferredAt(""); setError(""); setSuccess(""); setShowForm(true);
  }
  async function submitRequest(e: FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!doctorId || !reason.trim() || !preferredAt) { setError("Choose a provider, preferred date and time, and reason."); return; }
    setSubmitting(true);
    try {
      const payload = { doctor_id: doctorId, time: new Date(preferredAt).toISOString(), reason: reason.trim() };
      const endpoint = selectedEvent ? `/patient/appointments/${selectedEvent.id}/reschedule` : "/patient/appointments";
      await fetchAPI(endpoint, { method: "POST", body: JSON.stringify(payload) });
      await reload(); setShowForm(false); setSelectedEvent(null); setSuccess(selectedEvent ? "Reschedule request sent." : "Appointment request sent to the provider.");
    } catch (e: any) { setError(e.message || "Could not send the appointment request."); }
    finally { setSubmitting(false); }
  }
  async function cancelAppointment(event: EventRow) {
    if (!window.confirm("Cancel this appointment?")) return;
    try { await fetchAPI(`/patient/appointments/${event.id}`, { method: "DELETE" }); setSelectedEvent(null); await reload(); }
    catch (e: any) { setError(e.message || "Could not cancel this appointment."); }
  }
  function directions(event: EventRow) {
    const destination = encodeURIComponent(event.hospital || event.doctor || "hospital");
    window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, "_blank", "noopener,noreferrer");
  }

  return <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Care schedule</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Your Calendar</h1><p className="mt-1 font-medium text-slate-500">Appointments and care events from your record.</p></div><div className="flex flex-wrap gap-3"><div className="flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-bold shadow-sm"><button onClick={() => setView("month")} className={`rounded-lg px-4 py-1.5 ${view === "month" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}>Month</button><button onClick={() => setView("agenda")} className={`rounded-lg px-4 py-1.5 ${view === "agenda" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}>Agenda</button></div><button onClick={() => openRequest()} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"><Plus className="h-4 w-4"/>Request Appointment</button></div></header>
    {error && !showForm && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}{success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{success}</p>}
    <div className="flex flex-wrap gap-2">{([["all", "All events"], ["checkup", "Appointments"], ["lab", "Lab tests"]] as const).map(([value, label]) => <button key={value} onClick={() => setKind(value)} aria-pressed={kind === value} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${kind === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}</div>
    {view === "month" ? <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{format(month, "MMMM yyyy")}</h2><div className="flex gap-2"><button aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"><ChevronLeft className="h-5 w-5"/></button><button onClick={() => setMonth(startOfMonth(new Date()))} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">Today</button><button aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"><ChevronRight className="h-5 w-5"/></button></div></div><div className="grid grid-cols-7 gap-1 md:gap-3">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="pb-2 text-center text-[10px] font-bold uppercase text-slate-400 md:text-xs">{day}</div>)}{days.map(day => { const dayEvents = visibleEvents.filter(event => isSameDay(new Date(event.date), day)); const today = isSameDay(day, new Date()); return <div key={day.toISOString()} className={`min-h-20 rounded-lg border p-1 md:min-h-28 md:rounded-xl md:p-2 ${isSameMonth(day, month) ? "border-slate-100 bg-slate-50/50" : "border-slate-50 bg-slate-50/20 text-slate-300"} ${today ? "ring-1 ring-emerald-500" : ""}`}><div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${today ? "bg-emerald-100 text-emerald-800" : "text-slate-600"}`}>{format(day, "d")}</div><div className="space-y-1">{dayEvents.map(event => <button key={event.id} onClick={() => setSelectedEvent(event)} title={`${event.time || ""} ${event.title}`} className={`block w-full truncate rounded px-1 py-1 text-left text-[9px] font-bold md:text-[10px] ${event.type === "lab" ? "bg-sky-100 text-sky-800" : event.status === "requested" ? "bg-amber-100 text-amber-900" : "bg-indigo-100 text-indigo-800"}`}>{event.time} {event.title}</button>)}</div></div>; })}</div></section> : <section className="space-y-3">{visibleEvents.slice().sort((a, b) => +new Date(a.date) - +new Date(b.date)).map(event => <button key={event.id} onClick={() => setSelectedEvent(event)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-300"><span className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><CalendarIcon className="h-5 w-5"/></span><span><strong className="block">{event.title}</strong><span className="text-sm text-slate-500">{format(new Date(event.date), "EEE, d MMM yyyy")} · {format(new Date(event.date), "h:mm a")}</span></span></span><ChevronRight className="h-5 w-5 text-slate-400"/></button>)}{visibleEvents.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-slate-500">No calendar events for this view yet.</p>}</section>}

    {selectedEvent && <><button aria-label="Close appointment details" onClick={() => setSelectedEvent(null)} className="fixed inset-0 z-40 bg-slate-900/20"/><aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><h2 className="text-xl font-black">Appointment details</h2><button aria-label="Close" onClick={() => setSelectedEvent(null)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><div className="flex-1 space-y-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-800">{selectedEvent.status}</span><h3 className="text-2xl font-bold">{selectedEvent.title}</h3><p className="flex items-center gap-2 text-slate-600"><Clock className="h-4 w-4"/>{format(new Date(selectedEvent.date), "d MMM yyyy · h:mm a")}</p>{selectedEvent.doctor && <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4"/>{selectedEvent.doctor} · {selectedEvent.hospital}</p>}</div><div className="space-y-2 border-t border-slate-100 pt-4"><button onClick={() => openCalendarEvent(selectedEvent)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 font-bold text-white hover:bg-emerald-800"><CalendarPlus className="h-4 w-4"/>Add to Calendar</button>{selectedEvent.hospital && <button onClick={() => directions(selectedEvent)} className="w-full rounded-xl border border-slate-200 py-2.5 font-bold text-slate-700 hover:bg-slate-50">Get Directions</button>}{selectedEvent.type !== "lab" && selectedEvent.status !== "completed" && <><button onClick={() => openRequest(selectedEvent)} className="w-full rounded-xl border border-slate-200 py-2.5 font-bold text-slate-700 hover:bg-slate-50">Request Reschedule</button><button onClick={() => cancelAppointment(selectedEvent)} className="w-full py-2 text-sm font-bold text-rose-600 hover:underline">Cancel appointment</button></>}</div></aside></>}

    {showForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submitRequest} className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">{selectedEvent ? "Request a new appointment time" : "Request an Appointment"}</h2><p className="mt-1 text-sm text-slate-500">The provider will review and confirm your request.</p></div><button type="button" aria-label="Close" onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><label className="block text-sm font-semibold text-slate-700">Provider<select required value={doctorId} onChange={e => setDoctorId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor} · {d.specialty} · {d.hospital}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Reason for visit<input required minLength={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Routine follow-up"/></label><label className="block text-sm font-semibold text-slate-700">Preferred date and time<input required type="datetime-local" min={format(new Date(Date.now() + 60_000), "yyyy-MM-dd'T'HH:mm")} value={preferredAt} onChange={e => setPreferredAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={submitting || !doctors.length} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{submitting && <LoaderCircle className="h-4 w-4 animate-spin"/>}Send request</button></div></form></div>}
  </div>;
}
