import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  ChevronDown,
  Clock,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  UserCheck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { DEFAULT_SITE_SETTINGS } from '../../data/catalog';
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  fetchAdminDashboard,
  setStoredAdminToken,
  updateAdminEnquiryStatus,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminSettings,
  type ProductPayload,
} from '../../utils/api';
import {
  buildWhatsAppCustomerUpdateText,
  buildWhatsAppUrl,
  formatINR,
  ORDER_STATUSES,
  type AdminDashboardSummary,
  type BestSellerStat,
  type CategoryRecord,
  type CustomerSummary,
  type EnquiryRecord,
  type EnquiryStatus,
  type OrderRecord,
  type OrderStatus,
  type Product,
  type SalesDayPoint,
  type SiteSettings,
} from '../../utils/storeLogic';
import { InvoiceReceipt } from '../InvoiceReceipt';
import { ResilientImage } from '../ResilientImage';
import { AdminProductModal } from './AdminProductModal';
import {
  CategoriesTab,
  CustomersTab,
  EnquiriesTab,
  InventoryTab,
  ReportsTab,
  WebsiteSettingsTab,
} from './AdminSecondaryTabs';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'inventory'
  | 'enquiries'
  | 'reports'
  | 'settings';

interface AdminPanelProps {
  onBackToStore: () => void;
  onSignedOut: () => void;
  onCatalogChanged: () => void;
}

function getOrderStatusStyle(status: OrderStatus): string {
  switch (status) {
    case 'Completed':
    case 'Dispatched':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Pending':
    case 'Preparing':
    case 'Ready for Pickup':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Cancelled':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Website Settings', icon: Settings },
];

export function AdminPanel({
  onBackToStore,
  onSignedOut,
  onCatalogChanged,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    activeProducts: 0,
    averageBillValue: 0,
  });
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerStat[]>([]);
  const [salesSeries, setSalesSeries] = useState<SalesDayPoint[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [globalSearch, setGlobalSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderRecord | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const notify = (message: string) => {
    setActionFeedback(message);
    window.setTimeout(() => {
      setActionFeedback((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  const applyDashboardData = useCallback(
    (data: Awaited<ReturnType<typeof fetchAdminDashboard>>) => {
      setSummary(data.summary);
      setOrders(data.orders);
      setProducts(data.products);
      setCategories(data.categories);
      setCustomers(data.customers);
      setEnquiries(data.enquiries);
      setBestSellers(data.bestSellers);
      setSalesSeries(data.salesSeries);
      setSettings(data.settings);
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAdminDashboard();
      applyDashboardData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard.';
      if (message.toLowerCase().includes('unauthorized')) {
        setStoredAdminToken(null);
        onSignedOut();
        return;
      }
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [applyDashboardData, onSignedOut]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingOrder(null);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const lowStockList = useMemo(
    () =>
      products.filter((p) => (p.stockQty ?? 15) <= (p.lowStockThreshold ?? 5)),
    [products]
  );

  const openEnquiriesCount = useMemo(
    () => enquiries.filter((e) => e.status === 'Open').length,
    [enquiries]
  );

  const totalAlertsCount =
    summary.pendingOrders + summary.lowStockProducts + openEnquiriesCount;

  const filteredOrders = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderStatusFilter !== 'All' && order.status !== orderStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q)
      );
    });
  }, [orders, globalSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, globalSearch]);

  const refreshSilently = async () => {
    const refreshed = await fetchAdminDashboard();
    applyDashboardData(refreshed);
  };

  const handleOrderStatusChange = async (orderId: number, status: OrderStatus) => {
    try {
      const updated = await updateAdminOrderStatus(orderId, status);
      await refreshSilently();
      notify(`Order #${updated.orderNumber} marked ${status}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update order.');
    }
  };

  const handleToggleStock = async (product: Product) => {
    const nextInStock = product.inStock === false;
    try {
      const updated = await updateAdminProduct(product.id, { inStock: nextInStock });
      await refreshSilently();
      onCatalogChanged();
      notify(`${updated.name} marked ${nextInStock ? 'In Stock' : 'Out of Stock'}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update stock.');
    }
  };

  const handleAdjustStock = async (product: Product, nextQty: number) => {
    try {
      const updated = await updateAdminProduct(product.id, {
        stockQty: nextQty,
        inStock: nextQty > 0,
      });
      await refreshSilently();
      onCatalogChanged();
      notify(`${updated.name} stock updated to ${updated.stockQty} units.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update stock.');
    }
  };

  const handleSaveProduct = async (payload: ProductPayload, existingId?: string) => {
    if (existingId) {
      const updated = await updateAdminProduct(existingId, payload);
      notify(`Updated "${updated.name}".`);
    } else {
      const created = await createAdminProduct(payload);
      notify(`Added "${created.name}" to storefront.`);
    }
    await refreshSilently();
    onCatalogChanged();
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteAdminProduct(product.id);
      await refreshSilently();
      onCatalogChanged();
      notify(`Removed "${product.name}".`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  const handleCreateCategory = async (payload: { name: string; description: string }) => {
    try {
      const cat = await createAdminCategory(payload);
      await refreshSilently();
      notify(`Category "${cat.name}" created.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const handleDeleteCategory = async (cat: CategoryRecord) => {
    try {
      await deleteAdminCategory(cat.id);
      await refreshSilently();
      notify(`Category "${cat.name}" deleted.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  const handleUpdateEnquiry = async (
    id: number,
    status: EnquiryStatus,
    reply: string
  ) => {
    try {
      const updated = await updateAdminEnquiryStatus(id, status, reply);
      await refreshSilently();
      notify(`Enquiry from ${updated.customerName} updated (${updated.status}).`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update enquiry.');
    }
  };

  const handleSaveSettings = async (patch: Partial<SiteSettings>) => {
    try {
      await updateAdminSettings(patch);
      await refreshSilently();
      onCatalogChanged();
      notify('Website settings saved.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  const handleSignOut = () => {
    setStoredAdminToken(null);
    onSignedOut();
  };

  const activeTabLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Overview';
  const maxChartRevenue = Math.max(1000, ...salesSeries.map((d) => d.revenue));

  return (
    <div className="min-h-screen bg-[#F7F7F9] text-slate-900 flex">
      {/* Narrow Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-white border-r border-slate-200/80">
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-slate-900 flex items-center gap-1.5">
            <span>WishMantra</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D63B70]" aria-hidden="true" />
          </span>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#FDF2F6] text-[#D63B70] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
          <p className="font-medium text-slate-700">Sadar Bazaar Gallery</p>
          <p>Ambala Cantt, Haryana</p>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden flex bg-black/40"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="w-60 bg-white h-full border-r border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display text-xl font-semibold">WishMantra</span>
              <button
                type="button"
                aria-label="Close admin navigation"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium ${
                      active
                        ? 'bg-[#FDF2F6] text-[#D63B70] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navigation: Logo (mobile), Search Bar, Notifications Icon, Profile Menu */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(false);
                setProfileMenuOpen(false);
                setMobileNavOpen(true);
              }}
              aria-label="Open admin menu"
              className="lg:hidden min-w-[38px] min-h-[38px] inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>

            <span className="lg:hidden font-display text-lg font-semibold text-slate-900 shrink-0">
              WishMantra
            </span>

            <div className="relative flex-1 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search orders, products, customers, or enquiries"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders, products, customers..."
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F9] border border-slate-200/80 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#D63B70]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications, ${totalAlertsCount} active alerts`}
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setProfileMenuOpen(false);
                }}
                className="relative min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#D63B70] hover:border-[#F7D8E4] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {totalAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D63B70] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {totalAlertsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Admin notifications"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-3 space-y-2 z-40 text-xs"
                >
                  <p className="font-semibold text-slate-900 px-1">Store Alerts</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('orders');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#FDF2F6] flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-slate-700">Pending Orders</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold tabular-nums">
                      {summary.pendingOrders}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inventory');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#FDF2F6] flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-slate-700">Low Stock Products</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold tabular-nums">
                      {summary.lowStockProducts}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('enquiries');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#FDF2F6] flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-slate-700">Open Enquiries</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FDF2F6] text-[#D63B70] font-semibold tabular-nums">
                      {openEnquiriesCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileMenuOpen}
                className="inline-flex items-center gap-2 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-[#F7D8E4] cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#FDF2F6] text-[#D63B70] font-semibold flex items-center justify-center">
                  W
                </span>
                <span className="hidden sm:inline">Admin</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 z-40 text-xs">
                  <div className="px-2.5 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">WishMantra Studio</p>
                    <p className="text-[11px] text-slate-500">Ambala Cantt</p>
                  </div>
                  <button
                    type="button"
                    onClick={onBackToStore}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>View Storefront</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{activeTabLabel}</h1>
            </div>
            {(activeTab === 'products' || activeTab === 'overview') && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            )}
          </div>

          {/* Mobile Search Input */}
          <div className="sm:hidden relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Mobile admin search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search orders, products, customers..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>

          {actionFeedback && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800"
            >
              {actionFeedback}
            </div>
          )}

          {loadError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 flex items-center justify-between"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadDashboard}
                className="underline font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse"
                  />
                ))}
              </div>
              <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 6 Requested KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Total Orders</p>
                        <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
                          {summary.totalOrders}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] text-[#D63B70] flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Total Revenue</p>
                        <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
                          {formatINR(summary.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold text-base">
                        ₹
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Total Products</p>
                        <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
                          {summary.totalProducts}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] text-[#D63B70] flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Total Customers</p>
                        <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
                          {summary.totalCustomers}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] text-[#D63B70] flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Pending Orders</p>
                        <p className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums">
                          {summary.pendingOrders}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Low Stock Products</p>
                        <p className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums">
                          {summary.lowStockProducts}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Sales Overview Chart + Best-Selling Products */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-sm font-semibold text-slate-900">
                            Sales Overview (Last 7 Days)
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Avg. bill value {formatINR(summary.averageBillValue)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('reports')}
                          className="text-xs font-medium text-[#D63B70] hover:underline cursor-pointer"
                        >
                          Full Report
                        </button>
                      </div>

                      <div
                        data-testid="sales-overview-chart"
                        className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-4 border-b border-slate-100 pb-2"
                      >
                        {salesSeries.map((point) => {
                          const heightPct =
                            point.revenue > 0
                              ? Math.max(12, Math.round((point.revenue / maxChartRevenue) * 100))
                              : 4;
                          return (
                            <div
                              key={point.dateKey}
                              className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                            >
                              <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                                {point.revenue > 0 ? formatINR(point.revenue) : '—'}
                              </span>
                              <div className="w-full max-w-[36px] flex-1 flex items-end">
                                <div
                                  className={`w-full rounded-t-md ${
                                    point.revenue > 0 ? 'bg-[#E85C8D]' : 'bg-slate-100'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                  title={`${point.label}: ${formatINR(point.revenue)} (${point.ordersCount} orders)`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:gap-4 pt-2">
                        {salesSeries.map((point) => (
                          <span
                            key={point.dateKey}
                            className="flex-1 text-center text-[11px] font-medium text-slate-500"
                          >
                            {point.label}
                          </span>
                        ))}
                      </div>
                    </section>

                    {/* Best-selling Products */}
                    <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-900">
                          Best-selling Products
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('products')}
                          className="text-xs font-medium text-[#D63B70] hover:underline cursor-pointer"
                        >
                          All Products
                        </button>
                      </div>
                      {bestSellers.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">
                          No sales recorded yet.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {bestSellers.map((item) => (
                            <li
                              key={item.productId}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                  <ResilientImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    fallbackTitle={item.name}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-slate-500 tabular-nums">
                                    {item.unitsSold} sold
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                                {formatINR(item.revenue)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  {/* Recent Orders + Low Stock Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">
                          Recent Orders
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-medium text-[#D63B70] hover:underline cursor-pointer"
                        >
                          View All Orders
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                              <th className="py-2.5 px-4 font-medium">Bill #</th>
                              <th className="py-2.5 px-4 font-medium">Customer</th>
                              <th className="py-2.5 px-4 font-medium">Status</th>
                              <th className="py-2.5 px-4 font-medium text-right">Total</th>
                              <th className="py-2.5 px-4 font-medium text-right">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orders.slice(0, 5).map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50/60">
                                <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                                  #{order.orderNumber}
                                </td>
                                <td className="py-3 px-4 text-slate-700">
                                  {order.customerName}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${getOrderStatusStyle(
                                      order.status
                                    )}`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-semibold tabular-nums whitespace-nowrap">
                                  {formatINR(order.totalAmount)}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <a
                                      href={buildWhatsAppUrl(
                                        buildWhatsAppCustomerUpdateText(order, settings.storeName),
                                        order.phone
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`WhatsApp customer for order #${order.orderNumber}`}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>WhatsApp</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setViewingOrder(order)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:border-[#D63B70] hover:text-[#D63B70] cursor-pointer whitespace-nowrap"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>View Bill</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-900">
                          Low Stock Alerts
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('inventory')}
                          className="text-xs font-medium text-[#D63B70] hover:underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>

                      {lowStockList.length === 0 ? (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">
                          All products have healthy stock levels.
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {lowStockList.slice(0, 5).map((item) => {
                            const qty = item.stockQty ?? 0;
                            return (
                              <li
                                key={item.id}
                                className="rounded-lg border border-slate-100 bg-[#FAFAFC] p-3 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {item.name}
                                  </p>
                                  <p
                                    className={`font-medium tabular-nums ${
                                      qty <= 0 ? 'text-red-600' : 'text-amber-600'
                                    }`}
                                  >
                                    {qty <= 0 ? 'Out of stock' : `${qty} left in stock`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(item, qty + 10)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FDF2F6] border border-[#F7D8E4] text-[#D63B70] font-semibold hover:bg-[#D63B70] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  +10 Restock
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 tabular-nums">
                      Showing {filteredProducts.length} products
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductModalOpen(true);
                      }}
                      className="w-full sm:w-auto min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Gift Item</span>
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No catalog items found.
                    </div>
                  ) : (
                    <>
                      <div className="md:hidden divide-y divide-slate-100">
                        {filteredProducts.map((product) => {
                          const active = product.inStock !== false;
                          return (
                            <div key={product.id} className="p-4 flex items-center gap-3 text-xs">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <ResilientImage
                                  src={product.image}
                                  alt={product.imageAlt}
                                  className="w-full h-full object-cover"
                                  fallbackTitle={product.name}
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-semibold text-slate-900 truncate">
                                  {product.name}
                                </p>
                                <p className="text-slate-500">
                                  {product.category} ·{' '}
                                  <span className="font-semibold text-slate-900 tabular-nums">
                                    {formatINR(product.price)}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStock(product)}
                                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer ${
                                      active
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                        : 'text-red-700 bg-red-50 border-red-200'
                                    }`}
                                  >
                                    {active ? 'In Stock' : 'Out of Stock'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setProductModalOpen(true);
                                    }}
                                    aria-label={`Mobile edit ${product.name}`}
                                    className="p-1.5 rounded-md border border-slate-200 text-slate-600"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product)}
                                    aria-label={`Mobile delete ${product.name}`}
                                    className="p-1.5 rounded-md border border-slate-200 text-slate-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                              <th className="py-3 px-4 font-semibold">Item</th>
                              <th className="py-3 px-4 font-semibold">Category</th>
                              <th className="py-3 px-4 font-semibold text-right">Price</th>
                              <th className="py-3 px-4 font-semibold text-center">Stock</th>
                              <th className="py-3 px-4 font-semibold">Status</th>
                              <th className="py-3 px-4 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((product) => {
                              const active = product.inStock !== false;
                              return (
                                <tr key={product.id} className="hover:bg-slate-50/60">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                        <ResilientImage
                                          src={product.image}
                                          alt={product.imageAlt}
                                          className="w-full h-full object-cover"
                                          fallbackTitle={product.name}
                                        />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {product.name}
                                        </p>
                                        <p className="text-slate-500">{product.unitLabel}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-slate-700">
                                    {product.category}
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                                    {formatINR(product.price)}
                                  </td>
                                  <td className="py-3 px-4 text-center tabular-nums text-slate-700">
                                    {product.stockQty ?? 15}
                                  </td>
                                  <td className="py-3 px-4">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStock(product)}
                                      className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer ${
                                        active
                                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : 'text-red-700 bg-red-50 border-red-200'
                                      }`}
                                    >
                                      {active ? 'In Stock' : 'Hidden'}
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProduct(product);
                                          setProductModalOpen(true);
                                        }}
                                        aria-label={`Edit ${product.name}`}
                                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-[#D63B70] hover:border-[#D63B70] cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(product)}
                                        aria-label={`Delete ${product.name}`}
                                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <CategoriesTab
                  categories={categories}
                  onCreateCategory={handleCreateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center gap-1.5">
                    {(['All', ...ORDER_STATUSES] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                          orderStatusFilter === status
                            ? 'bg-[#FDF2F6] text-[#D63B70] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No orders match the current filter.
                    </div>
                  ) : (
                    <>
                      <div className="md:hidden divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                          <div key={order.id} className="p-4 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-semibold text-slate-900">
                                #{order.orderNumber}
                              </span>
                              <span className="font-semibold text-sm text-slate-900 tabular-nums">
                                {formatINR(order.totalAmount)}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-900">{order.customerName}</p>
                              <p className="text-slate-500 tabular-nums">{order.phone}</p>
                              <p className="text-slate-500">
                                {order.fulfilment === 'pickup'
                                  ? 'Store Pickup · Sadar Bazaar'
                                  : `${order.address}, ${order.cityPincode}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`Mobile status for order #${order.orderNumber}`}
                                value={order.status}
                                onChange={(e) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    e.target.value as OrderStatus
                                  )
                                }
                                className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${getOrderStatusStyle(
                                  order.status
                                )}`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <a
                                href={buildWhatsAppUrl(
                                  buildWhatsAppCustomerUpdateText(order, settings.storeName),
                                  order.phone
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp ${order.customerName}`}
                                className="min-h-[40px] inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setViewingOrder(order)}
                                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#D63B70] hover:text-[#D63B70] whitespace-nowrap cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Bill</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                              <th className="py-3 px-4 font-semibold">Bill #</th>
                              <th className="py-3 px-4 font-semibold">Customer &amp; Fulfilment</th>
                              <th className="py-3 px-4 font-semibold">Items &amp; Engraving</th>
                              <th className="py-3 px-4 font-semibold text-right">Amount</th>
                              <th className="py-3 px-4 font-semibold">Status</th>
                              <th className="py-3 px-4 font-semibold text-right">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50/60 align-top">
                                <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                                  #{order.orderNumber}
                                </td>
                                <td className="py-3.5 px-4 space-y-0.5">
                                  <p className="font-semibold text-slate-900">
                                    {order.customerName}
                                  </p>
                                  <p className="text-slate-500 tabular-nums">{order.phone}</p>
                                  <p className="text-slate-500">
                                    {order.fulfilment === 'pickup'
                                      ? 'Store Pickup · Sadar Bazaar'
                                      : `${order.address}, ${order.cityPincode}`}
                                  </p>
                                </td>
                                <td className="py-3.5 px-4 space-y-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-slate-700">
                                      <span className="font-medium tabular-nums">
                                        {item.quantity}×
                                      </span>{' '}
                                      {item.name}
                                      {item.personalisation?.customName && (
                                        <span className="block text-[#D63B70]">
                                          Engrave: “{item.personalisation.customName}”
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </td>
                                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                                  <span className="font-semibold text-slate-900">
                                    {formatINR(order.totalAmount)}
                                  </span>
                                  <span className="block text-[11px] text-slate-500">
                                    GST {formatINR(order.gstAmount)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    aria-label={`Status for order #${order.orderNumber}`}
                                    value={order.status}
                                    onChange={(e) =>
                                      handleOrderStatusChange(
                                        order.id,
                                        e.target.value as OrderStatus
                                      )
                                    }
                                    className={`px-2.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer ${getOrderStatusStyle(
                                      order.status
                                    )}`}
                                  >
                                    {ORDER_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <a
                                      href={buildWhatsAppUrl(
                                        buildWhatsAppCustomerUpdateText(order, settings.storeName),
                                        order.phone
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`WhatsApp customer for order #${order.orderNumber}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>WhatsApp</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setViewingOrder(order)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-[#D63B70] hover:text-[#D63B70] cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>View Bill</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              )}

              {activeTab === 'customers' && (
                <CustomersTab customers={customers} searchQuery={globalSearch} />
              )}

              {activeTab === 'inventory' && (
                <InventoryTab
                  products={products}
                  searchQuery={globalSearch}
                  onAdjustStock={handleAdjustStock}
                />
              )}

              {activeTab === 'enquiries' && (
                <EnquiriesTab
                  enquiries={enquiries}
                  searchQuery={globalSearch}
                  onUpdateEnquiry={handleUpdateEnquiry}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsTab
                  orders={orders}
                  products={products}
                  bestSellers={bestSellers}
                />
              )}

              {activeTab === 'settings' && (
                <WebsiteSettingsTab
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </>
          )}
        </main>
      </div>

      <AdminProductModal
        open={productModalOpen}
        editingProduct={editingProduct}
        availableCategories={categories.map((c) => c.name)}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={() => setViewingOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Tax Invoice for Order #${viewingOrder.orderNumber}`}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#FDF9FA] rounded-t-2xl sm:rounded-2xl border border-[#F1DCE3] shadow-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-[#23191D]">
                Order Bill #{viewingOrder.orderNumber}
              </h2>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                aria-label="Close invoice viewer"
                className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-[#EAD5DC] bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <InvoiceReceipt
              order={viewingOrder}
              whatsappPhone={settings.phoneDisplay}
            />
          </div>
        </div>
      )}
    </div>
  );
}
