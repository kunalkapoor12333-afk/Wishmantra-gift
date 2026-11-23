import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_TABS, IMAGE_OPTIONS } from '../../data/catalog';
import type { ProductPayload } from '../../utils/api';
import type { ImageKey, Product } from '../../utils/storeLogic';

interface AdminProductModalProps {
  open: boolean;
  editingProduct: Product | null;
  availableCategories?: string[];
  onClose: () => void;
  onSave: (payload: ProductPayload, existingId?: string) => Promise<void>;
}

export function AdminProductModal({
  open,
  editingProduct,
  availableCategories,
  onClose,
  onSave,
}: AdminProductModalProps) {
  const categoryOptions =
    availableCategories && availableCategories.length > 0
      ? availableCategories
      : CATEGORY_TABS.filter((c) => c !== 'All');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categoryOptions[0] || 'Customised Gifts');
  const [price, setPrice] = useState<number>(499);
  const [unitLabel, setUnitLabel] = useState('per set');
  const [shortDescription, setShortDescription] = useState('');
  const [details, setDetails] = useState('');
  const [customisable, setCustomisable] = useState(true);
  const [personalisationFee, setPersonalisationFee] = useState<number>(50);
  const [imageKey, setImageKey] = useState<ImageKey>('product_custom_hamper');
  const [highlight, setHighlight] = useState('');
  const [inStock, setInStock] = useState(true);
  const [stockQty, setStockQty] = useState<number>(15);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setPrice(editingProduct.price);
      setUnitLabel(editingProduct.unitLabel);
      setShortDescription(editingProduct.shortDescription);
      setDetails(editingProduct.details);
      setCustomisable(editingProduct.customisable);
      setPersonalisationFee(editingProduct.personalisationFee);
      setImageKey(editingProduct.imageKey || 'product_custom_hamper');
      setHighlight(editingProduct.highlight || '');
      setInStock(editingProduct.inStock !== false);
      setStockQty(editingProduct.stockQty ?? 15);
      setLowStockThreshold(editingProduct.lowStockThreshold ?? 5);
    } else {
      setName('');
      setCategory(categoryOptions[0] || 'Customised Gifts');
      setPrice(499);
      setUnitLabel('per set');
      setShortDescription('');
      setDetails('');
      setCustomisable(true);
      setPersonalisationFee(50);
      setImageKey('product_custom_hamper');
      setHighlight('');
      setInStock(true);
      setStockQty(15);
      setLowStockThreshold(5);
    }
    setError(null);
  }, [open, editingProduct]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Product name must be at least 2 characters.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be greater than ₹0.');
      return;
    }
    if (shortDescription.trim().length < 6) {
      setError('Please enter a short description.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          price: Math.round(price),
          unitLabel: unitLabel.trim() || 'per piece',
          shortDescription: shortDescription.trim(),
          details: details.trim() || shortDescription.trim(),
          customisable,
          personalisationFee: customisable ? Math.max(0, Math.round(personalisationFee)) : 0,
          imageKey,
          imageAlt: name.trim(),
          highlight: highlight.trim() || null,
          inStock,
          stockQty: Math.max(0, Math.round(stockQty)),
          lowStockThreshold: Math.max(1, Math.round(lowStockThreshold)),
        },
        editingProduct?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-modal-title"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h2
            id="admin-product-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {editingProduct ? 'Edit Gift Item' : 'Add New Gift Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product editor"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="admin-prod-name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Product Name
            </label>
            <input
              id="admin-prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engraved Brass Pen & Journal Set"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="admin-prod-cat"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="admin-prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-prod-price"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Price (₹)
              </label>
              <input
                id="admin-prod-price"
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#D63B70]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-prod-unit"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Unit Label
              </label>
              <input
                id="admin-prod-unit"
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="per set"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-prod-stock"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Available Stock Qty
              </label>
              <input
                id="admin-prod-stock"
                type="number"
                min={0}
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#D63B70]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-prod-threshold"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Low Stock Alert At
              </label>
              <input
                id="admin-prod-threshold"
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-[#D63B70]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-prod-image"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Studio Photo Preset
              </label>
              <select
                id="admin-prod-image"
                value={imageKey}
                onChange={(e) => setImageKey(e.target.value as ImageKey)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
              >
                {IMAGE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-prod-highlight"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Subtle Note (optional)
              </label>
              <input
                id="admin-prod-highlight"
                type="text"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                placeholder="e.g. Budget Hit, New Arrival"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-prod-short"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Short Description
            </label>
            <input
              id="admin-prod-short"
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary shown on catalog cards"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-prod-details"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Full Details
            </label>
            <textarea
              id="admin-prod-details"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Contents, sizing, and packaging details"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D63B70]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={customisable}
                onChange={(e) => setCustomisable(e.target.checked)}
                className="w-4 h-4 accent-[#D63B70] rounded"
              />
              <span>Allow Personalisation</span>
            </label>

            {customisable && (
              <div>
                <label
                  htmlFor="admin-prod-fee"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Engraving Fee (₹)
                </label>
                <input
                  id="admin-prod-fee"
                  type="number"
                  min={0}
                  value={personalisationFee}
                  onChange={(e) => setPersonalisationFee(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg tabular-nums"
                />
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-[#D63B70] rounded"
              />
              <span>Visible &amp; Active</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#D63B70] text-white text-xs font-semibold hover:bg-[#BE2D5E] transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
