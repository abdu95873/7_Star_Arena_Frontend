import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Select, Input } from '../../components/ui.jsx';
import { taka, fmtDateTime, statusTone } from '../../utils/format.js';

export default function FinancePage() {
  const [filters, setFilters] = useState({ status: '', type: '', method: '', from: '', to: '' });
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['finance', query],
    queryFn: async () => (await api.get(`/admin/finance/transactions?${query}`)).data.data,
  });

  const exportCsv = async () => {
    try {
      const res = await api.get(`/admin/finance/export-csv?${query}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const txs = data?.transactions || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-sm text-ink-400">Transaction history and reconciliation.</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>

      {data?.totals && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-sm text-ink-400">Inflow</p><p className="mt-1 text-2xl font-bold text-turf-300">{taka(data.totals.inflow)}</p></Card>
          <Card className="p-5"><p className="text-sm text-ink-400">Refunds</p><p className="mt-1 text-2xl font-bold text-red-300">{taka(data.totals.refunds)}</p></Card>
          <Card className="p-5"><p className="text-sm text-ink-400">Net</p><p className="mt-1 text-2xl font-bold text-white">{taka(data.totals.net)}</p></Card>
        </div>
      )}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>{['initiated', 'success', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option>{['booking', 'event', 'refund'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}>
            <option value="">All methods</option>{['bkash', 'manual'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
      </Card>

      {isLoading ? <Loading /> : isError ? <ErrorState onRetry={refetch} /> : txs.length === 0 ? (
        <EmptyState icon="💳" title="No transactions found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left text-ink-400">
                <th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Type</th>
                <th className="p-3">Gateway</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Ref</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t._id} className="border-b border-ink-800/60">
                  <td className="p-3 text-xs text-ink-400">{fmtDateTime(t.createdAt)}</td>
                  <td className="p-3 text-ink-200">{t.userId?.name}<div className="text-xs text-ink-500">{t.userId?.phone}</div></td>
                  <td className="p-3"><Badge tone={t.type === 'refund' ? 'red' : 'blue'}>{t.type}</Badge></td>
                  <td className="p-3 text-ink-300">{t.gateway}</td>
                  <td className={`p-3 font-medium ${t.type === 'refund' ? 'text-red-300' : 'text-turf-300'}`}>{t.type === 'refund' ? '-' : ''}{taka(t.amount)}</td>
                  <td className="p-3"><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>
                  <td className="p-3 text-xs text-ink-500">{t.gatewayTransactionId || t.bkashPaymentID || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.pagination && <div className="p-3 text-xs text-ink-500">Showing {txs.length} of {data.pagination.total}</div>}
        </Card>
      )}
    </div>
  );
}
