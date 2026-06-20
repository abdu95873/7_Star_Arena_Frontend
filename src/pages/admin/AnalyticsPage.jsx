import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import api from '../../lib/apiClient.js';
import { Card, Loading, ErrorState } from '../../components/ui.jsx';
import { taka } from '../../utils/format.js';

const COLORS = ['#12b76a', '#f97316', '#38bdf8', '#a78bfa', '#f43f5e'];

function Kpi({ label, value, accent }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-400">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent || 'text-white'}`}>{value}</p>
    </Card>
  );
}

const tooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' };

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data.data,
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const { kpis, trend, peakHours, users, events } = data;
  const userPie = [
    { name: 'Returning', value: users.returning },
    { name: 'One-time', value: users.oneTime },
    { name: 'New', value: Math.max(0, users.new) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-ink-400">Overview of revenue, bookings, and engagement.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total revenue (net)" value={taka(kpis.totalRevenue)} accent="text-turf-300" />
        <Kpi label="Today's revenue" value={taka(kpis.todayRevenue)} accent="text-accent-300" />
        <Kpi label="Bookings today" value={kpis.bookingsToday} />
        <Kpi label="Occupancy today" value={`${kpis.occupancyRate}%`} />
        <Kpi label="Bookings this week" value={kpis.bookingsWeek} />
        <Kpi label="Bookings this month" value={kpis.bookingsMonth} />
        <Kpi label="Total customers" value={kpis.totalUsers} />
        <Kpi label="Refunds issued" value={taka(kpis.refunds)} accent="text-red-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-white">Revenue trend (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12b76a" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#12b76a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => taka(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#12b76a" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-white">Bookings trend (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="bookings" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-white">Peak hours (most booked start times)</h3>
          {peakHours.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-500">No booking data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-white">Customer mix</h3>
          {userPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-500">No customer data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={userPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {userPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-white">Event participation</h3>
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 text-left text-ink-400">
                  <th className="py-2">Event</th><th className="py-2">Participants</th><th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.title} className="border-b border-ink-800/60">
                    <td className="py-2 text-ink-200">{e.title}</td>
                    <td className="py-2 text-ink-300">{e.participants}</td>
                    <td className="py-2 text-turf-300">{taka(e.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
