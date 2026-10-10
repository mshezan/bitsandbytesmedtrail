export type CalendarEvent = { id: string; title: string; date: string; doctor?: string; hospital?: string };

export function openCalendarEvent(event: CalendarEvent) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 30 * 60_000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = [event.doctor, event.hospital].filter(Boolean).join(" · ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
    location: event.hospital || "",
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
}
