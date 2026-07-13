import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Card, Badge, Loading, ErrorState, EmptyState, Select, Input, Modal, Field } from '../../components/ui.jsx';
import { taka, fmtDateTime, statusTone } from '../../utils/format.js';
import { todayKeyDhaka } from '../../utils/slots.js';

const today = todayKeyDhaka();
const monthStart = `${today.slice(0, 7)}-01`;
const yearStart = `${today.slice(0, 4)}-01-01`;

function downloadBlob(res, fallbackName) {
  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || fallbackName;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportPreviewTable({ rows, totals, periodLabel }) {
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b border-ink-800 text-left text-ink-400">
          <th className="p-3">{periodLabel}</th>
          <th className="p-3">Inflow</th>
          <th className="p-3">Discounts</th>
          <th className="p-3">Refunds</th>
          <th className="p-3">Net</th>
          <th className="p-3">Txns</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.period} className="border-b border-ink-800/60">
            <td className="p-3 font-medium text-ink-200">{row.period}</td>
            <td className="p-3 text-turf-300">{taka(row.inflow)}</td>
            <td className="p-3 text-amber-300">{taka(row.discounts)}</td>
            <td className="p-3 text-red-300">{taka(row.refunds)}</td>
            <td className="p-3 font-medium text-white">{taka(row.net)}</td>
            <td className="p-3 text-ink-400">{row.transactions}</td>
          </tr>
        ))}
        {totals && (
          <tr className="bg-ink-800/40 font-semibold">
            <td className="p-3 text-white">Total</td>
            <td className="p-3 text-turf-300">{taka(totals.inflow)}</td>
            <td className="p-3 text-amber-300">{taka(totals.discounts)}</td>
            <td className="p-3 text-red-300">{taka(totals.refunds)}</td>
            <td className="p-3 text-white">{taka(totals.net)}</td>
            <td className="p-3 text-ink-300">{totals.transactions}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function TransactionsPreviewTable({ rows }) {
  return (
    <table className="w-full min-w-[800px] text-sm">
      <thead>
        <tr className="border-b border-ink-800 text-left text-ink-400">
          <th className="p-3">Date</th>
          <th className="p-3">Customer</th>
          <th className="p-3">Type</th>
          <th className="p-3">Gateway</th>
          <th className="p-3">Amount</th>
          <th className="p-3">Discount</th>
          <th className="p-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t._id} className="border-b border-ink-800/60">
            <td className="p-3 text-xs text-ink-400">{fmtDateTime(t.createdAt)}</td>
            <td className="p-3 text-ink-200">{t.userId?.name}</td>
            <td className="p-3"><Badge tone={t.type === 'refund' ? 'red' : 'blue'}>{t.type}</Badge></td>
            <td className="p-3 text-ink-300">{t.gateway}</td>
            <td className={`p-3 font-medium ${t.type === 'refund' ? 'text-red-300' : 'text-turf-300'}`}>
              {t.type === 'refund' ? '-' : ''}{taka(t.amount)}
            </td>
            <td className="p-3 text-amber-300">
              {(t.rawGatewayResponse?.discount || 0) > 0 ? `−${taka(t.rawGatewayResponse.discount)}` : '—'}
            </td>
            <td className="p-3"><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FinancePage() {
  const [filters, setFilters] = useState({ status: '', type: '', method: '', from: '', to: '' });
  const [report, setReport] = useState({ period: 'daily', from: monthStart, to: today });
  const [preview, setPreview] = useState(null); // transactions export preview
  const [reportView, setReportView] = useState(null); // null | 'setup' | { rows, totals, periodLabel }
  const [downloading, setDownloading] = useState(false);

  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  const reportQuery = new URLSearchParams(
    Object.entries({ period: report.period, ...(report.from ? { from: report.from } : {}), ...(report.to ? { to: report.to } : {}) }),
  ).toString();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['finance', query],
    queryFn: async () => (await api.get(`/admin/finance/transactions?${query}`)).data.data,
  });

  const periodLabel = report.period === 'monthly' ? 'Month' : report.period === 'yearly' ? 'Year' : 'Date';

  const openReportSetup = () => {
    toast.success('Finance report — choose period and date range.');
    setReportView('setup');
  };

  const loadReportPreview = async () => {
    setReportView({ loading: true });
    try {
      const res = (await api.get(`/admin/finance/report?${reportQuery}`)).data.data;
      if (!res.rows?.length) {
        setReportView('setup');
        toast.error('No data for this date range');
        return;
      }
      setReportView({
        rows: res.rows,
        totals: res.totals,
        periodLabel,
      });
    } catch {
      setReportView('setup');
      toast.error('Could not load report');
    }
  };

  const openTransactionsPreview = async () => {
    setPreview({ kind: 'transactions', loading: true });
    try {
      const exportQuery = new URLSearchParams(
        Object.entries({ ...filters, limit: '5000' }).filter(([, v]) => v),
      ).toString();
      const res = (await api.get(`/admin/finance/transactions?${exportQuery}`)).data.data;
      if (!res.transactions?.length) {
        setPreview(null);
        toast.error('No transactions to export');
        return;
      }
      setPreview({
        kind: 'transactions',
        rows: res.transactions,
        totals: res.totals,
        total: res.pagination?.total ?? res.transactions.length,
        exportQuery,
      });
    } catch {
      setPreview(null);
      toast.error('Could not load transactions');
    }
  };

  const downloadPreview = async () => {
    setDownloading(true);
    try {
      if (reportView && reportView !== 'setup' && !reportView.loading) {
        const res = await api.get(`/admin/finance/export-report?${reportQuery}`, { responseType: 'blob' });
        downloadBlob(res, `finance-report-${report.period}.csv`);
        toast.success('Report CSV downloaded');
      } else if (preview && !preview.loading) {
        const res = await api.get(`/admin/finance/export-csv?${preview.exportQuery}`, { responseType: 'blob' });
        downloadBlob(res, `transactions-${Date.now()}.csv`);
        toast.success('Transactions CSV downloaded');
      }
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const txs = data?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="mt-1 text-sm text-ink-400">Overview, transaction history, and exportable reports.</p>
        </div>
        <Button onClick={openReportSetup}>Export report</Button>
      </div>

      {data?.totals && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Inflow</p><p className="mt-1 text-xl font-bold text-turf-300">{taka(data.totals.inflow)}</p></Card>
          <Card className="p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Discounts</p><p className="mt-1 text-xl font-bold text-amber-300">{taka(data.totals.discounts || 0)}</p></Card>
          <Card className="p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Refunds</p><p className="mt-1 text-xl font-bold text-red-300">{taka(data.totals.refunds)}</p></Card>
          <Card className="p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Net</p><p className="mt-1 text-xl font-bold text-white">{taka(data.totals.net)}</p></Card>
        </div>
      )}

      <Card className="overflow-hidden">
          <div className="border-b border-ink-800 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Transactions</h2>
                <p className="text-xs text-ink-500">Filter the list below or export matching rows.</p>
              </div>
              <Button variant="outline" className="!py-2" onClick={openTransactionsPreview}>Export transactions</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Field label="Status">
                <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">All</option>{['initiated', 'success', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Type">
                <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                  <option value="">All</option>{['booking', 'event', 'refund'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Method">
                <Select value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}>
                  <option value="">All</option>{['bkash', 'manual'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="From">
                <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </Field>
              <Field label="To">
                <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </Field>
            </div>
          </div>

          {isLoading ? (
            <Loading label="Loading transactions…" />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : txs.length === 0 ? (
            <EmptyState icon="💳" title="No transactions found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-ink-800 bg-ink-900/50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Status</th>
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
                      <td className="p-3 text-amber-300">{(t.rawGatewayResponse?.discount || 0) > 0 ? `−${taka(t.rawGatewayResponse.discount)}` : '—'}</td>
                      <td className="p-3"><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.pagination && (
                <div className="border-t border-ink-800 p-3 text-xs text-ink-500">
                  Showing {txs.length} of {data.pagination.total}
                </div>
              )}
            </div>
          )}
        </Card>

      {reportView && (
        <Modal
          open
          size="lg"
          onClose={() => setReportView(null)}
          title="Finance report"
          footer={
            reportView !== 'setup' && !reportView.loading ? (
              <>
                <Button variant="ghost" onClick={() => setReportView('setup')}>Back</Button>
                <Button variant="ghost" onClick={() => setReportView(null)}>Close</Button>
                <Button variant="primary" loading={downloading} onClick={downloadPreview}>Download CSV</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setReportView(null)}>Close</Button>
                <Button variant="primary" loading={reportView.loading} onClick={loadReportPreview}>View report</Button>
              </>
            )
          }
        >
          {reportView === 'setup' || reportView.loading ? (
            <div className="space-y-4">
              {reportView.loading ? <Loading label="Loading report…" /> : null}
              <Field label="Group by">
                <Select value={report.period} onChange={(e) => setReport((r) => ({ ...r, period: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  <Input type="date" value={report.from} onChange={(e) => setReport((r) => ({ ...r, from: e.target.value }))} />
                </Field>
                <Field label="To">
                  <Input type="date" value={report.to} onChange={(e) => setReport((r) => ({ ...r, to: e.target.value }))} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => setReport((r) => ({ ...r, from: monthStart, to: today }))}>This month</Button>
                <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => setReport((r) => ({ ...r, from: yearStart, to: today }))}>This year</Button>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <ReportPreviewTable rows={reportView.rows} totals={reportView.totals} periodLabel={reportView.periodLabel} />
            </div>
          )}
        </Modal>
      )}

      {preview && (
        <Modal
          open
          size="2xl"
          onClose={() => setPreview(null)}
          title="Transactions export preview"
          footer={
            <>
              <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
              <Button variant="primary" loading={downloading} disabled={preview.loading} onClick={downloadPreview}>
                Download CSV
              </Button>
            </>
          }
        >
          {preview.loading ? (
            <Loading label="Loading export data…" />
          ) : (
            <div className="space-y-3">
              {preview.totals && (
                <div className="flex flex-wrap gap-4 text-sm text-ink-400">
                  <span>Inflow: <strong className="text-turf-300">{taka(preview.totals.inflow)}</strong></span>
                  <span>Discounts: <strong className="text-amber-300">{taka(preview.totals.discounts || 0)}</strong></span>
                  <span>Refunds: <strong className="text-red-300">{taka(preview.totals.refunds)}</strong></span>
                  <span>Net: <strong className="text-white">{taka(preview.totals.net)}</strong></span>
                </div>
              )}
              <p className="text-xs text-ink-500">
                Showing {preview.rows.length}{preview.total > preview.rows.length ? ` of ${preview.total}` : ''} transactions
              </p>
              <div className="max-h-[55vh] overflow-auto">
                <TransactionsPreviewTable rows={preview.rows} />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
