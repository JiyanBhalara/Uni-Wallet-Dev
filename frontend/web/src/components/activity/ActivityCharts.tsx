// src/components/activity/ActivityCharts.tsx
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  MapPin,
} from "lucide-react";

interface Transaction {
  id: string;
  userId: number;
  walletId: number;
  amount: number;
  merchant: string;
  paymentMethod: string;
  location: string;
  date: string;
  category: string;
}

interface EventAttendance {
  totalRsvped: number;
  attended: number;
  missed: number;
}

interface Props {
  transactions: Transaction[];
  eventAttendance: EventAttendance | null;
}

const CATEGORY_COLORS = ["#283618", "#606C38", "#DDA15E", "#BC6C25", "#A3B18A"];
const CAMPUS_COLORS = ["#606C38", "#BC6C25"];

export default function ActivityCharts({ transactions, eventAttendance }: Props) {
  const {
    totalSpent,
    totalTopups,
    eventCount,
    categoryData,
    campusSplitData,
    monthlyData,
  } = useMemo(() => summarize(transactions), [transactions]);

  // Use actual attendance data if available, otherwise fall back to transaction count
  const attendedCount = eventAttendance?.attended ?? eventCount;
  const rsvpedCount = eventAttendance?.totalRsvped ?? 0;

  return (
    <section className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 lg:gap-4">
        <Card className="border-[rgba(40,54,24,0.08)] bg-gradient-to-br from-white to-[#dda15e]/10 hover:shadow-md transition-all duration-300">
          <CardContent className="py-4 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--sc-gold-dark)] uppercase tracking-[0.16em] font-semibold">
                  Total spent
                </p>
                <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--sc-gold-dark)]">
                  ${Math.abs(totalSpent ?? 0).toFixed(2)}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-[var(--sc-green)] flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  All outgoing transactions
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--sc-gold)]/20 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--sc-gold-dark)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[rgba(40,54,24,0.08)] bg-gradient-to-br from-white to-[#606c38]/10 hover:shadow-md transition-all duration-300">
          <CardContent className="py-4 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--sc-green-dark)] uppercase tracking-[0.16em] font-semibold">
                  Total top-ups
                </p>
                <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--sc-green)]">
                  ${(totalTopups ?? 0).toFixed(2)}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-[var(--sc-green)] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Money added to wallets
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--sc-green)]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--sc-green)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[rgba(40,54,24,0.08)] bg-gradient-to-br from-white to-[#dda15e]/10 hover:shadow-md transition-all duration-300">
          <CardContent className="py-4 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[#bc6c25] uppercase tracking-[0.16em] font-semibold">
                  Events attended
                </p>
                <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-[#bc6c25]">
                  {attendedCount}{rsvpedCount > 0 && `/${rsvpedCount}`}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-[var(--sc-green)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {rsvpedCount > 0 ? 'Checked in / RSVP\'d' : 'Campus events registered'}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#dda15e]/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#bc6c25]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Comparison Chart */}
      <Card className="border-[rgba(40,54,24,0.08)] bg-white hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--sc-green)]/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--sc-green-dark)]" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-[var(--sc-green-dark)]">
                Income vs Expenses
              </p>
              <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-0.5">
                How much you're adding vs spending
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 sm:pb-4">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--sc-green)]/5 flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--sc-green)]" />
              </div>
              <p className="text-sm sm:text-base text-[var(--sc-green-dark)] font-medium">
                No transaction data yet
              </p>
              <p className="text-xs sm:text-sm text-[var(--sc-green)] mt-1">
                Start adding funds and making transactions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual comparison bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-semibold text-[var(--sc-green-dark)] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      Money Added
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[var(--sc-green)]">
                      ${totalTopups.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 bg-[var(--sc-cream)] rounded-full overflow-hidden border border-[rgba(40,54,24,0.1)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#606c38] to-[#283618] rounded-full flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${totalTopups > 0 ? Math.min((totalTopups / (totalTopups + Math.abs(totalSpent))) * 100, 100) : 0}%` }}
                    >
                      {totalTopups > 0 && (
                        <span className="text-xs font-bold text-[var(--sc-cream)] whitespace-nowrap">
                          {totalTopups > 0 ? ((totalTopups / (totalTopups + Math.abs(totalSpent))) * 100).toFixed(0) : 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-semibold text-[var(--sc-gold-dark)] flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      Money Spent
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[var(--sc-gold-dark)]">
                      ${Math.abs(totalSpent).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 bg-[var(--sc-cream)] rounded-full overflow-hidden border border-[rgba(188,108,37,0.2)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#dda15e] to-[#bc6c25] rounded-full flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${totalSpent !== 0 ? Math.min((Math.abs(totalSpent) / (totalTopups + Math.abs(totalSpent))) * 100, 100) : 0}%` }}
                    >
                      {totalSpent !== 0 && (
                        <span className="text-[0.65rem] font-bold text-[var(--sc-cream)] whitespace-nowrap">
                          {totalSpent !== 0 ? ((Math.abs(totalSpent) / (totalTopups + Math.abs(totalSpent))) * 100).toFixed(0) : 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Net balance indicator */}
              <div className="pt-3 border-t border-[rgba(40,54,24,0.08)]">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
                    Net Balance Change:
                  </span>
                  <span className={`text-lg sm:text-xl font-bold ${
                    (totalTopups + totalSpent) >= 0 ? 'text-[var(--sc-green)]' : 'text-[var(--sc-gold-dark)]'
                  }`}>
                    {(totalTopups + totalSpent) >= 0 ? '+' : ''}${(totalTopups + totalSpent).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Comparison chart */}
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Income', value: totalTopups, fill: '#606c38' },
                      { name: 'Expenses', value: Math.abs(totalSpent), fill: '#bc6c25' }
                    ]}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(40,54,24,0.08)" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(40,54,24,0.1)' }}
                      tick={{ fontSize: 12, fill: '#606C38', fontWeight: 600 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#606C38' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(188,108,37,0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                      labelStyle={{ color: '#283618', fontWeight: 600 }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]}
                      fill="#8884d8"
                    >
                      {[
                        { name: 'Income', value: totalTopups, fill: '#606c38' },
                        { name: 'Expenses', value: Math.abs(totalSpent), fill: '#bc6c25' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3 sm:gap-4 lg:gap-5">
        {/* Bar chart: monthly spending */}
        <Card className="border-[rgba(40,54,24,0.08)] bg-white hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--sc-green)]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--sc-green-dark)]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)]">
                  Spending Trends
                </p>
                <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] mt-0.5">
                  Monthly spending breakdown (last 6 months)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-3 sm:pb-4">
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--sc-green)]/5 flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--sc-green)]" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--sc-green-dark)] font-medium">
                  No spending data yet
                </p>
                <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] mt-1">
                  Start making transactions to see trends
                </p>
              </div>
            ) : (
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(40,54,24,0.08)"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(40,54,24,0.1)' }}
                      tick={{ fontSize: 11, fill: '#606C38' }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#606C38' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid rgba(188,108,37,0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Spent']}
                      labelStyle={{ color: '#BC6C25', fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="spend"
                      radius={[8, 8, 0, 0]}
                      fill="#BC6C25"
                    />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#283618"
                      strokeWidth={2}
                      dot={{ fill: '#283618', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie charts column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-5">
          {/* Category pie */}
          <Card className="border-[rgba(40,54,24,0.08)] bg-white hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#dda15e]/10 flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#bc6c25]" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)]">
                    Spend by Category
                  </p>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] mt-0.5">
                    Distribution of expenses
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 sm:pb-4">
              {categoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#dda15e]/10 flex items-center justify-center mb-3">
                    <PieChartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#bc6c25]" />
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--sc-green-dark)] font-medium">
                    No categories yet
                  </p>
                  <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] mt-1">
                    Spend to see breakdown
                  </p>
                </div>
              ) : (
                <div className="h-64 sm:h-72 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              CATEGORY_COLORS[
                                index % CATEGORY_COLORS.length
                              ]
                            }
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid rgba(40,54,24,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          padding: '8px 12px',
                        }}
                        formatter={(value: any, name: any) =>
                          [`$${Number(value).toFixed(2)}`, name]
                        }
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11, paddingLeft: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Attendance pie */}
          <Card className="border-[rgba(40,54,24,0.08)] bg-white hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#dda15e]/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#bc6c25]" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)]">
                    Event Attendance
                  </p>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] mt-0.5">
                    RSVP'd vs. Actually attended
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 sm:pb-4">
              {!eventAttendance || eventAttendance.totalRsvped === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#dda15e]/10 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#bc6c25]" />
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--sc-green-dark)] font-medium">
                    No event RSVPs yet
                  </p>
                  <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] mt-1">
                    Register for campus events to track attendance
                  </p>
                </div>
              ) : (
                <div className="h-64 sm:h-72 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Attended', value: eventAttendance.attended },
                          { name: 'Missed', value: eventAttendance.missed },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="75%"
                        paddingAngle={5}
                        label={({ value, percent }) => 
                          percent ? `${value} (${(percent * 100).toFixed(0)}%)` : `${value}`
                        }
                      >
                        <Cell fill="#606c38" stroke="white" strokeWidth={3} />
                        <Cell fill="#bc6c25" stroke="white" strokeWidth={3} />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid rgba(40,54,24,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          padding: '8px 12px',
                        }}
                        formatter={(value: any, name: any) => {
                          const total = eventAttendance.totalRsvped;
                          const percent = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                          return [`${value} events (${percent}%)`, name];
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 11, paddingLeft: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ---------- helpers ----------

function summarize(transactions: Transaction[]) {
  let totalSpent = 0;
  let totalTopups = 0;
  let eventCount = 0;

  const byCategory = new Map<string, number>();
  const byMonth = new Map<string, number>();
  let onCampusCount = 0;
  let offCampusCount = 0;

  for (const t of transactions) {
    const amount = Number(t.amount);

    // top-ups are positive, spending negative (based on how we set it up)
    if (amount > 0) {
      totalTopups += amount;
    } else if (amount < 0) {
      totalSpent += amount;

      // category totals (spend only)
      const cat = (t.category || "Other").trim() || "Other";
      const prev = byCategory.get(cat) ?? 0;
      byCategory.set(cat, prev + Math.abs(amount));
    }

    // events attended – heuristic: category contains "event"
    if (t.category && t.category.toLowerCase().includes("event")) {
      eventCount += 1;
    }

    // month bucket for spend (again, only negative)
    if (amount < 0) {
      const date = new Date(t.date);
      if (!Number.isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const prevMonth = byMonth.get(key) ?? 0;
        byMonth.set(key, prevMonth + Math.abs(amount));
      }
    }

    // campus split based on location containing "Campus"
    if (t.location && t.location.toLowerCase().includes("campus")) onCampusCount += 1;
    else offCampusCount += 1;
  }

  const categoryData = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // cap for pie readability

  const monthlyData = Array.from(byMonth.entries())
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const label = `${month}/${year.slice(-2)}`;
      return { key, label, spend: Number(value.toFixed(2)) };
    })
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .slice(-6); // last 6 months

  const campusSplitData = [
    { name: "On-campus", value: onCampusCount },
    { name: "Off-campus", value: offCampusCount },
  ];

  return {
    totalSpent,
    totalTopups,
    eventCount,
    categoryData,
    campusSplitData,
    monthlyData,
  };
}
