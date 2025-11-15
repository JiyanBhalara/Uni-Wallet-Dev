import React from "react";
import Card from "../ui/Card";

const EventsPreview = ({ events }) => (
  <Card>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-slate-900">Campus events</h2>
      <span className="text-xs text-slate-500">
        {events.length ? `${events.length} upcoming` : "No events"}
      </span>
    </div>
    <ul className="space-y-2">
      {events.map((ev) => (
        <li
          key={ev.id}
          className="flex items-center justify-between text-xs py-1.5"
        >
          <div>
            <p className="font-medium text-slate-800">{ev.title}</p>
            <p className="text-[0.7rem] text-slate-500">
              {ev.date} · {ev.location}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-800">
              {ev.price === 0
                ? "Free"
                : `${ev.currency} ${ev.price.toFixed(2)}`}
            </p>
            <p className="text-[0.65rem] text-emerald-600">
              {ev.isRegistered ? "Registered" : "Register"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  </Card>
);

export default EventsPreview;
