import { useEffect, useState } from 'react';
import {
  Download,
  MessageCircle,
  Minus,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  buildWhatsAppUrl,
  ENQUIRY_STATUSES,
  formatINR,
  type BestSellerStat,
  type CategoryRecord,
  type CustomerSummary,
  type EnquiryRecord,
  type EnquiryStatus,
  type OrderRecord,
  type Product,
  type SiteSettings,
} from '../../utils/storeLogic';
import { ResilientImage } from '../ResilientImage';

interface CategoriesTabProps {
  categories: CategoryRecord[];
  onCreateCategory: (payload: { name: string; description: string }) => Promise<void>;
  onDeleteCategory: (cat: CategoryRecord) => Promise<void>;
}

export function CategoriesTab({
  categories,
  onCreateCategory,
  onDeleteCategory,
}: CategoriesTabProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreateCategory({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 h-fit">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Add Category</h2>
        <p className="text-xs text-slate-500 mb-4">
          Organise gift collections for Haryana &amp; Ambala shoppers.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="cat-name-input" className="block text-xs font-medium text-slate-700 mb-1">
              Category Name
            </label>
            <input
              id="cat-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Festive Combos"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>
          <div>
            <label htmlFor="cat-desc-input" className="block text-xs font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="cat-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short category summary..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>
          <button
            type="submit"
            disabled={saving || name.trim().length < 2}
            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{saving ? 'Adding...' : 'Add Category'}</span>
          </button>
        </form>
      </section>

      <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Store Categories ({categories.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Products</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{cat.description || '—'}</td>
                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 whitespace-nowrap">
                    {cat.activeCount} / {cat.productCount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={cat.productCount > 0}
                      onClick={() => onDeleteCategory(cat)}
                      title={
                        cat.productCount > 0
                          ? 'Reassign products before deleting'
                          : `Delete ${cat.name}`
                      }
                      aria-label={`Delete category ${cat.name}`}
                      className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function CustomersTab({
  customers,
  searchQuery,
}: {
  customers: CustomerSummary[];
  searchQuery: string;
}) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      )
    : customers;

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Customers Directory ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatically built from completed and pending storefront bills.
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          No customers match your search.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">City</th>
                <th className="py-3 px-4 font-semibold text-center">Orders</th>
                <th className="py-3 px-4 font-semibold text-right">Total Spend</th>
                <th className="py-3 px-4 font-semibold text-right">Last Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cust) => (
                <tr key={cust.phone || cust.name} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{cust.name}</p>
                    {cust.email && <p className="text-slate-500">{cust.email}</p>}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-slate-700">{cust.phone}</td>
                  <td className="py-3.5 px-4 text-slate-600">{cust.city}</td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-medium text-slate-800">
                    {cust.ordersCount}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-slate-900">
                    {formatINR(cust.totalSpent)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    #{cust.lastOrderNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function InventoryTab({
  products,
  searchQuery,
  onAdjustStock,
}: {
  products: Product[];
  searchQuery: string;
  onAdjustStock: (product: Product, nextQty: number) => Promise<void>;
}) {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const q = searchQuery.trim().toLowerCase();

  const filtered = products.filter((p) => {
    const qty = p.stockQty ?? 15;
    const thresh = p.lowStockThreshold ?? 5;
    if (filter === 'low' && !(qty > 0 && qty <= thresh)) return false;
    if (filter === 'out' && qty > 0) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Stock &amp; Inventory Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track stock units and restock low-inventory gifts in one click.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          {(
            [
              { id: 'all', label: 'All Stock' },
              { id: 'low', label: 'Low Stock' },
              { id: 'out', label: 'Out of Stock' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                filter === f.id
                  ? 'bg-white text-[#D63B70] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
              <th className="py-3 px-4 font-semibold">Product</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-center">Units in Stock</th>
              <th className="py-3 px-4 font-semibold text-right">Quick Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const qty = p.stockQty ?? 15;
              const thresh = p.lowStockThreshold ?? 5;
              const statusLabel =
                qty <= 0 ? 'Out of Stock' : qty <= thresh ? 'Low Stock' : 'In Stock';
              const statusStyle =
                qty <= 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : qty <= thresh
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <ResilientImage
                          src={p.image}
                          alt={p.imageAlt}
                          className="w-full h-full object-cover"
                          fallbackTitle={p.name}
                        />
                      </div>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{p.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease stock for ${p.name}`}
                        onClick={() => onAdjustStock(p, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:border-[#D63B70] hover:text-[#D63B70] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="min-w-[2.2rem] text-center font-semibold tabular-nums text-slate-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase stock for ${p.name}`}
                        onClick={() => onAdjustStock(p, qty + 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:border-[#D63B70] hover:text-[#D63B70] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onAdjustStock(p, qty + 10)}
                      className="px-3 py-1.5 rounded-lg bg-[#FDF2F6] border border-[#F7D8E4] text-[#D63B70] font-semibold hover:bg-[#D63B70] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      +10 Units
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EnquiriesTab({
  enquiries,
  searchQuery,
  onUpdateEnquiry,
}: {
  enquiries: EnquiryRecord[];
  searchQuery: string;
  onUpdateEnquiry: (id: number, status: EnquiryStatus, reply: string) => Promise<void>;
}) {
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? enquiries.filter(
        (e) =>
          e.customerName.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      )
    : enquiries;

  return (
    <section className="space-y-4">
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-sm text-slate-500">
          No customer enquiries match your filter.
        </div>
      ) : (
        filtered.map((enq) => {
          const draft = replyDrafts[enq.id] ?? enq.adminReply ?? '';
          const statusStyle =
            enq.status === 'Resolved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';

          return (
            <article
              key={enq.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{enq.subject}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {enq.customerName} · {enq.phone}
                    {enq.city ? ` · ${enq.city}` : ''}
                  </p>
                </div>
                <select
                  aria-label={`Status for enquiry from ${enq.customerName}`}
                  value={enq.status}
                  onChange={(e) =>
                    onUpdateEnquiry(enq.id, e.target.value as EnquiryStatus, draft)
                  }
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer ${statusStyle}`}
                >
                  {ENQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                {enq.message}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  aria-label={`Reply note for ${enq.customerName}`}
                  value={draft}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [enq.id]: e.target.value }))
                  }
                  placeholder="Write response note or quote..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEnquiry(
                      enq.id,
                      enq.status === 'Open' ? 'Replied' : enq.status,
                      draft
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] cursor-pointer whitespace-nowrap"
                >
                  Save Reply
                </button>
                <a
                  href={buildWhatsAppUrl(
                    `Hi ${enq.customerName}, regarding your WishMantra enquiry "${enq.subject}": ${
                      draft.trim() || 'Our Ambala studio team has reviewed your request.'
                    }`,
                    enq.phone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

export function ReportsTab({
  orders,
  products,
  bestSellers,
}: {
  orders: OrderRecord[];
  products: Product[];
  bestSellers: BestSellerStat[];
}) {
  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  const cancelledCount = orders.filter((o) => o.status === 'Cancelled').length;
  const totalRevenue = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalGst = activeOrders.reduce((s, o) => s + o.gstAmount, 0);

  // Category revenue map
  const prodCatMap = new Map(products.map((p) => [p.id, p.category]));
  const catRev = new Map<string, number>();
  for (const ord of activeOrders) {
    for (const item of ord.items) {
      const cat = prodCatMap.get(item.productId) ?? 'Other';
      const val = (item.unitPrice + item.personalisationFee) * item.quantity;
      catRev.set(cat, (catRev.get(cat) ?? 0) + val);
    }
  }
  const catRows = Array.from(catRev.entries()).sort((a, b) => b[1] - a[1]);

  const handleExportCsv = () => {
    const header = 'BillNumber,Date,Customer,Phone,City,Fulfilment,Status,Taxable,GST,Total\n';
    const body = orders
      .map(
        (o) =>
          `"${o.orderNumber}","${o.createdAt.slice(0, 10)}","${o.customerName.replace(/"/g, '""')}","${o.phone}","${o.cityPincode.replace(/"/g, '""')}","${o.fulfilment}","${o.status}",${o.taxableValue},${o.gstAmount},${o.totalAmount}`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WishMantra-Sales-Report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium text-slate-500">Net Billed Sales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatINR(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{activeOrders.length} active bills</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-medium text-slate-500">GST Collected (12%)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {formatINR(totalGst)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Included in final invoices</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Cancelled Bills</p>
            <p className="mt-2 text-2xl font-semibold text-red-600 tabular-nums">
              {cancelledCount}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue by Category</h3>
          <div className="space-y-3">
            {catRows.map(([cat, rev]) => {
              const pct = totalRevenue > 0 ? Math.min(100, Math.round((rev / totalRevenue) * 100)) : 0;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{cat}</span>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {formatINR(rev)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D63B70]"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Performing Gifts</h3>
          <ul className="divide-y divide-slate-100 text-xs">
            {bestSellers.map((item) => (
              <li key={item.productId} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-slate-500">{item.category}</p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold text-slate-900">{formatINR(item.revenue)}</p>
                  <p className="text-slate-500">{item.unitsSold} sold</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function WebsiteSettingsTab({
  settings,
  onSaveSettings,
}: {
  settings: SiteSettings;
  onSaveSettings: (patch: Partial<SiteSettings>) => Promise<void>;
}) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-6 max-w-2xl">
      <h2 className="text-sm font-semibold text-slate-900">Website &amp; Store Settings</h2>
      <p className="text-xs text-slate-500 mt-0.5 mb-5">
        Changes save to SQLite and update the live storefront banner, cart delivery rules, and footer immediately.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-store-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Store Display Name
            </label>
            <input
              id="set-store-name"
              type="text"
              value={form.storeName}
              onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>
          <div>
            <label htmlFor="set-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              Gallery Phone / WhatsApp
            </label>
            <input
              id="set-phone"
              type="text"
              value={form.phoneDisplay}
              onChange={(e) => setForm((p) => ({ ...p, phoneDisplay: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="set-announcement" className="block text-xs font-semibold text-slate-700 mb-1">
            Top Announcement Bar Text
          </label>
          <input
            id="set-announcement"
            type="text"
            value={form.announcementText}
            onChange={(e) => setForm((p) => ({ ...p, announcementText: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-free-thresh" className="block text-xs font-semibold text-slate-700 mb-1">
              Free Delivery Threshold (₹)
            </label>
            <input
              id="set-free-thresh"
              type="number"
              min={0}
              value={form.freeDeliveryThreshold}
              onChange={(e) =>
                setForm((p) => ({ ...p, freeDeliveryThreshold: Number(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#D63B70]"
            />
          </div>
          <div>
            <label htmlFor="set-del-fee" className="block text-xs font-semibold text-slate-700 mb-1">
              Standard Delivery Fee (₹)
            </label>
            <input
              id="set-del-fee"
              type="number"
              min={0}
              value={form.standardDeliveryFee}
              onChange={(e) =>
                setForm((p) => ({ ...p, standardDeliveryFee: Number(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#D63B70]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="set-address" className="block text-xs font-semibold text-slate-700 mb-1">
            Store Address
          </label>
          <input
            id="set-address"
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
          />
        </div>

        <div>
          <label htmlFor="set-hours" className="block text-xs font-semibold text-slate-700 mb-1">
            Opening Hours
          </label>
          <input
            id="set-hours"
            type="text"
            value={form.hours}
            onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.promoCodesEnabled}
            onChange={(e) => setForm((p) => ({ ...p, promoCodesEnabled: e.target.checked }))}
            className="w-4 h-4 accent-[#D63B70] rounded"
          />
          <span>Enable Promo Codes (WISH5 &amp; GIFT100) in Cart</span>
        </label>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2.5 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
