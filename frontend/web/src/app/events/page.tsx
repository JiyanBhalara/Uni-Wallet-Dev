// app/events/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Ticket,
  X,
  CreditCard,
  Wallet,
  Building2,
} from "lucide-react";

interface EventItem {
  id: number;
  eventCode: string;
  name: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  tags: string;
  cost: number;
  rsvped: boolean;
  checkedIn: boolean;
}

interface WalletItem {
  id: number;
  type: number;
  displayName: string;
  balance: number;
  currency: string;
}

interface EventAttendance {
  totalRsvped: number;
  attended: number;
  missed: number;
}

type MutateType = "rsvp" | "checkin" | null;

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [eventAttendance, setEventAttendance] = useState<EventAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [mutatingType, setMutatingType] = useState<MutateType>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const userEmail = session?.user?.email ?? "";

  const now = useMemo(() => new Date(), []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEvents = async () => {
    if (!userEmail) return;
    try {
      const [eventsData, walletsData, attendanceData] = await Promise.all([
        api.getEvents(userEmail) as Promise<EventItem[]>,
        api.getWallets(userEmail) as Promise<WalletItem[]>,
        api.getEventAttendanceSummary(userEmail) as Promise<EventAttendance>
      ]);
      // Sort by latest events first
      const sorted = eventsData.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setEvents(sorted);
      // Filter out meal plan (type 1) and dining dollars (type 2)
      const filtered = walletsData.filter(w => w.type !== 1 && w.type !== 2);
      setWallets(filtered);
      setEventAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail]);

  const handleRsvp = async (event: EventItem) => {
    if (!userEmail) return;
    
    // If event is free, RSVP directly
    if (event.cost === 0) {
      try {
        setMutatingId(event.id);
        setMutatingType("rsvp");
        await api.rsvpEvent(event.id, userEmail);
        await fetchEvents();
        showToast("Successfully registered for the event!", "success");
      } catch (err) {
        console.error("Failed to RSVP", err);
        showToast("Failed to RSVP. Please try again.", "error");
      } finally {
        setMutatingId(null);
        setMutatingType(null);
      }
    } else {
      // Show payment modal for paid events
      setSelectedEvent(event);
      setShowPaymentModal(true);
    }
  };

  const handlePayAndRsvp = async () => {
    if (!selectedEvent || !selectedWalletId || !userEmail) return;
    
    const selectedWallet = wallets.find(w => w.id === selectedWalletId);
    if (!selectedWallet) return;

    // Check if wallet has sufficient balance
    if (selectedWallet.balance < selectedEvent.cost) {
      showToast("Insufficient balance in selected wallet", "error");
      return;
    }

    try {
      setMutatingId(selectedEvent.id);
      setMutatingType("rsvp");
      
      // Call payment endpoint which handles wallet deduction, transaction creation, and RSVP
      await api.payAndRsvpEvent(selectedEvent.id, userEmail, selectedWalletId);
      await fetchEvents();
      
      setShowPaymentModal(false);
      setSelectedEvent(null);
      setSelectedWalletId(null);
      showToast(`Congratulations! You paid $${selectedEvent.cost.toFixed(2)} and registered successfully!`, "success");
    } catch (err) {
      console.error("Failed to pay and RSVP", err);
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setMutatingId(null);
      setMutatingType(null);
    }
  };

  const handleCheckIn = async (eventId: number) => {
    if (!userEmail) return;
    try {
      setMutatingId(eventId);
      setMutatingType("checkin");
      await api.checkInEvent(eventId, userEmail);
      await fetchEvents();
      showToast("Successfully checked in to the event!", "success");
    } catch (err) {
      console.error("Failed to check in", err);
      showToast("Failed to check in. Please try again.", "error");
    } finally {
      setMutatingId(null);
      setMutatingType(null);
    }
  };

  const getWalletIcon = (type: number) => {
    switch (type) {
      case 0: return <Wallet className="w-5 h-5" />; // Campus
      case 3: return <Building2 className="w-5 h-5" />; // BankLinked
      case 4: return <CreditCard className="w-5 h-5" />; // Other
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="space-y-3 sm:space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48" />
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl" />
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="space-y-3 sm:space-y-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
          Campus Life
        </h1>
        <p className="text-xs sm:text-sm text-[var(--sc-green)]">
          Please sign in to view and RSVP to campus events.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-3 sm:space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--sc-green)] to-[var(--sc-green-dark)] text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Payment Required</h2>
                  <p className="text-sm opacity-90">{selectedEvent.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedEvent(null);
                    setSelectedWalletId(null);
                  }}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4 bg-white/20 rounded-lg p-3">
                <p className="text-2xl font-bold">${selectedEvent.cost.toFixed(2)}</p>
                <p className="text-xs opacity-90 mt-0.5">Event ticket price</p>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Payment Method
              </label>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => setSelectedWalletId(wallet.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedWalletId === wallet.id
                        ? 'border-[var(--sc-green)] bg-[var(--sc-green)]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${
                        selectedWalletId === wallet.id
                          ? 'text-[var(--sc-green)]'
                          : 'text-gray-500'
                      }`}>
                        {getWalletIcon(wallet.type)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-gray-900">
                          {wallet.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: {wallet.currency} {(wallet.balance ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {wallet.balance < selectedEvent.cost && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                        Insufficient
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {wallets.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No payment methods available. Please add a wallet first.
                </p>
              )}

              <button
                onClick={handlePayAndRsvp}
                disabled={!selectedWalletId || mutatingId === selectedEvent.id}
                className="w-full mt-6 px-6 py-3 rounded-xl bg-[var(--sc-green)] text-white font-bold text-sm hover:bg-[var(--sc-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {mutatingId === selectedEvent.id ? "Processing..." : `Pay $${selectedEvent.cost.toFixed(2)} & RSVP`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Campus Life
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-1">
            Discover events, RSVP, and check in from your UniWallet wallet.
          </p>
        </div>
      </div>

      {/* Event Attendance Summary Card */}
      {eventAttendance && eventAttendance.totalRsvped > 0 && (
        <Card className="border-[rgba(40,54,24,0.08)] bg-gradient-to-br from-[var(--sc-green)] via-[var(--sc-green-dark)] to-[#1a2410] text-[var(--sc-cream)]">
          <CardContent className="py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--sc-gold)]/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--sc-gold)]" />
                </div>
                <div>
                  <p className="text-sm sm:text-base text-[var(--sc-cream)]/80 font-medium">
                    Your Event Activity
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-0.5">
                    {eventAttendance.attended} / {eventAttendance.totalRsvped}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--sc-cream)]/70 mt-0.5">
                    Events attended out of RSVP'd
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="text-center px-3 py-2 rounded-lg bg-[var(--sc-green-dark)]/40">
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--sc-gold)]">
                    {eventAttendance.totalRsvped}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--sc-cream)]/80 mt-0.5">
                    RSVP'd
                  </p>
                </div>
                <div className="text-center px-3 py-2 rounded-lg bg-[var(--sc-green-dark)]/40">
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">
                    {eventAttendance.attended}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--sc-cream)]/80 mt-0.5">
                    Attended
                  </p>
                </div>
                {eventAttendance.missed > 0 && (
                  <div className="text-center px-3 py-2 rounded-lg bg-[var(--sc-green-dark)]/40">
                    <p className="text-2xl sm:text-3xl font-bold text-red-400">
                      {eventAttendance.missed}
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--sc-cream)]/80 mt-0.5">
                      Missed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(40,54,24,0.08)] bg-white py-10 sm:py-12 px-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--sc-gold)]/15 flex items-center justify-center mb-3">
            <Ticket className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--sc-gold-dark)]" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)]">
            No upcoming events yet
          </p>
          <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-1 max-w-md">
            Once campus events are loaded, you&apos;ll be able to RSVP and check
            in right from here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {events.map((e) => {
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            const isDuringWindow = now >= start && now <= end;
            const isPast = now > end;

            const isMutating = mutatingId === e.id;
            const isRsvpMut = isMutating && mutatingType === "rsvp";
            const isCheckinMut = isMutating && mutatingType === "checkin";

            return (
              <Card
                key={e.id}
                className="bg-gradient-to-br from-[var(--sc-green)] via-[var(--sc-green-dark)] to-[#1a2410] text-[var(--sc-cream)] relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-none"
              >
                <CardHeader className="border-none flex flex-row items-start gap-3 pb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-bold opacity-90 flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[var(--sc-gold)]/30 text-xs font-bold border border-[var(--sc-gold)]/50">
                        {e.eventCode}
                      </span>
                      <span>EVENT</span>
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold truncate leading-tight">
                      {e.name}
                    </p>
                    <p className="mt-1.5 text-sm sm:text-base font-medium opacity-90">
                      {e.category}
                      {e.tags && ` · ${e.tags}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm sm:text-base font-bold whitespace-nowrap bg-[var(--sc-gold)] text-[var(--sc-green-dark)] px-3 py-1 rounded-full shadow-sm">
                      {(e.cost ?? 0) === 0 ? "FREE" : `$${(e.cost ?? 0).toFixed(2)}`}
                    </span>
                    {e.checkedIn && (
                      <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold bg-green-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Attended
                      </span>
                    )}
                    {!e.checkedIn && e.rsvped && isPast && (
                      <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold bg-gray-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                        Missed
                      </span>
                    )}
                    {!e.checkedIn && e.rsvped && !isPast && !isDuringWindow && (
                      <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold bg-[var(--sc-gold-dark)] text-white px-2.5 py-1 rounded-full shadow-sm">
                        <Ticket className="w-3 h-3" />
                        Registered
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-5">
                  <div className="space-y-2.5">
                    <p className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate">
                        {start.toLocaleDateString()} ·{" "}
                        {start.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {end.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{e.location}</span>
                    </p>
                    
                    {/* Only show "Upcoming - RSVP" if not rsvped */}
                    {!e.rsvped && !isPast && (
                      <p className="text-sm sm:text-base font-medium opacity-90 flex items-center gap-2 bg-[var(--sc-green-dark)]/40 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Upcoming — RSVP to save your spot.</span>
                      </p>
                    )}
                    
                    {/* Show check-in message during window */}
                    {e.rsvped && isDuringWindow && !e.checkedIn && (
                      <p className="text-sm sm:text-base font-medium opacity-90 flex items-center gap-2 bg-[var(--sc-green-dark)]/40 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Happening now — check in to mark attendance.</span>
                      </p>
                    )}
                    
                    {/* Show past event message */}
                    {isPast && !isDuringWindow && (
                      <p className="text-sm sm:text-base font-medium opacity-90 flex items-center gap-2 bg-[var(--sc-green-dark)]/40 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Event finished.</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!e.rsvped && !e.checkedIn && !isPast && (
                      <button
                        type="button"
                        onClick={() => handleRsvp(e)}
                        disabled={isRsvpMut}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--sc-gold)] text-[var(--sc-green-dark)] text-sm sm:text-base font-bold hover:bg-[var(--sc-gold-dark)] hover:text-white disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        {isRsvpMut ? "RSVPing..." : "RSVP Now"}
                      </button>
                    )}

                    {e.rsvped && !e.checkedIn && isDuringWindow && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(e.id)}
                        disabled={isCheckinMut}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm sm:text-base font-bold hover:bg-green-600 disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isCheckinMut ? "Checking in..." : "Check In"}
                      </button>
                    )}

                    {e.checkedIn && (
                      <span className="text-sm sm:text-base font-medium opacity-90">
                        Your attendance is recorded in your activity history.
                      </span>
                    )}

                    {!e.checkedIn && isPast && !isDuringWindow && (
                      <span className="text-sm sm:text-base font-medium opacity-90">
                        Check-in window has closed.
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
