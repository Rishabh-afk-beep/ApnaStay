import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Reveal } from "../ui/Reveal";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import type { OwnerAnalyticsOut } from "../../types";

interface AnalyticsTabProps {
  data: OwnerAnalyticsOut;
}

export function AnalyticsTab({ data }: AnalyticsTabProps) {
  return (
    <Reveal className="mt-6" delayMs={60}>
      <section className="glass-card-static overflow-hidden">
        <div className="border-b p-6" style={{ borderColor: "var(--glass-border)" }}>
          <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>Performance Overview (30 Days)</h2>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Total Views</p>
              <p className="text-2xl font-black" style={{ color: "var(--primary)" }}><AnimatedNumber value={data.total_views} /></p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Shortlists</p>
              <p className="text-2xl font-black" style={{ color: "#eab308" }}><AnimatedNumber value={data.total_shortlists} /></p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Inquiries</p>
              <p className="text-2xl font-black" style={{ color: "#22c55e" }}><AnimatedNumber value={data.total_inquiries} /></p>
            </div>
          </div>
        </div>
        <div className="h-72 w-full p-4 pl-0 pt-6" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="99%" height="100%" minHeight={1}>
            <LineChart data={data.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" opacity={0.2} vertical={false} />
              <XAxis dataKey="date" stroke="var(--outline)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: string) => val.slice(5)} />
              <YAxis stroke="var(--outline)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "var(--surface-container-high)", border: "none", borderRadius: "12px", color: "var(--on-surface)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line type="monotone" name="Views" dataKey="views" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Shortlists" dataKey="shortlists" stroke="#eab308" strokeWidth={3} dot={false} />
              <Line type="monotone" name="Inquiries" dataKey="inquiries" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Reveal>
  );
}
