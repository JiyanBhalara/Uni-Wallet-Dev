// src/components/activity/EventAttendanceChart.tsx
"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarCheck2 } from "lucide-react";

interface Props {
  totalRsvped: number;
  attended: number;
  missed: number;
}

const COLORS = ["#606C38", "#BC6C25"];

export default function EventAttendanceChart({
  totalRsvped,
  attended,
  missed,
}: Props) {
  const data =
    totalRsvped === 0
      ? []
      : [
          { name: "Attended", value: attended },
          { name: "RSVP no-show", value: missed },
        ];

  return (
    <Card className="border-[rgba(40,54,24,0.08)] bg-white hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#dda15e]/10 flex items-center justify-center">
            <CalendarCheck2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#bc6c25]" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold text-[var(--sc-green-dark)]">
              Event attendance
            </p>
            <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] mt-0.5">
              How many RSVPs you actually attended
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 sm:pb-4">
        {totalRsvped === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#dda15e]/10 flex items-center justify-center mb-3">
              <CalendarCheck2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#bc6c25]" />
            </div>
            <p className="text-xs sm:text-sm text-[var(--sc-green-dark)] font-medium">
              No RSVPs yet
            </p>
            <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] mt-1">
              RSVP and attend events to see your stats
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="70%"
                  paddingAngle={4}
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                      stroke="white"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid rgba(40,54,24,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                  formatter={(value: any, name: any) => [
                    `${value} event${Number(value) === 1 ? "" : "s"}`,
                    name,
                  ]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11, paddingLeft: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
