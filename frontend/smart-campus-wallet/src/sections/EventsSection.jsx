import React from "react";
import PageShell from "../components/ui/PageShell";
import EventsPreview from "../components/events/EventsPreview";

const EventsSection = ({ events }) => (
  <PageShell>
    <h2 className="text-base font-semibold text-slate-900 mb-4">
      Campus events & clubs
    </h2>
    <EventsPreview events={events} />
    <p className="mt-3 text-xs text-slate-500">
      Later, this page can integrate with the university events API and allow
      one-click payment using the campus wallet.
    </p>
  </PageShell>
);

export default EventsSection;
