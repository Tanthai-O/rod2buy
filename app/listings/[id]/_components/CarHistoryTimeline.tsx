import { CarEvent } from "@/types/car-event"

const EVENT_STYLES: Record<string, { dot: string; badge: string }> = {
  ซ่อม:           { dot: "bg-orange-400",  badge: "bg-orange-100 text-orange-700" },
  เปลี่ยนอะไหล่:  { dot: "bg-blue-400",    badge: "bg-blue-100 text-blue-700" },
  ตรวจสภาพ:      { dot: "bg-green-400",   badge: "bg-green-100 text-green-700" },
  อุบัติเหตุ:    { dot: "bg-red-400",     badge: "bg-red-100 text-red-700" },
}

const DEFAULT_STYLE = { dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600" }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function CarHistoryTimeline({ events }: { events: CarEvent[] }) {
  return (
    <section className="bg-white rounded-2xl border border-zinc-100 p-5">
      <h2 className="font-semibold text-zinc-900 mb-5">ประวัติรถ</h2>

      <ol className="relative border-l-2 border-zinc-100 ml-2 space-y-6">
        {events.map((event) => {
          const style = EVENT_STYLES[event.event_type] ?? DEFAULT_STYLE
          return (
            <li key={event.id} className="ml-5">
              {/* dot */}
              <span className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${style.dot}`} />

              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                  {event.event_type}
                </span>
                <time className="text-xs text-zinc-400">{formatDate(event.event_date)}</time>
                {event.mileage_at && (
                  <span className="text-xs text-zinc-400">
                    {new Intl.NumberFormat("th-TH").format(event.mileage_at)} กม.
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-sm text-zinc-600 leading-relaxed">{event.description}</p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
