import { Download, MessageCircle, Printer } from 'lucide-react';
import { STORE_INFO } from '../data/catalog';
import {
  buildInvoiceText,
  buildWhatsAppUrl,
  formatINR,
  GST_RATE_PERCENT,
  type OrderRecord,
} from '../utils/storeLogic';

interface InvoiceReceiptProps {
  order: OrderRecord;
  compact?: boolean;
  whatsappPhone?: string;
}

export function InvoiceReceipt({
  order,
  compact = false,
  whatsappPhone,
}: InvoiceReceiptProps) {
  const cgst = Math.floor(order.gstAmount / 2);
  const sgst = order.gstAmount - cgst;
  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const paymentLabel =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'upi'
        ? 'UPI Payment'
        : order.paymentMethod === 'whatsapp'
          ? 'WhatsApp / UPI Order'
          : 'Pay at Gallery Counter';

  const handleDownloadTxt = () => {
    const content = buildInvoiceText(order);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WishMantra-Bill-${order.orderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div
        data-testid="invoice-bill-card"
        className={`printable-invoice rounded-xl bg-white border border-[#F1DCE3] ${
          compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
        } space-y-4 text-xs text-[#23191D]`}
      >
        {/* Store & Invoice Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#F6E9EE]">
          <div>
            <p className="font-display text-lg font-semibold text-[#23191D]">
              {STORE_INFO.brandName}
            </p>
            <p className="text-[11px] text-[#6E5C63]">
              {STORE_INFO.addressLine1}, {STORE_INFO.addressLine2}
            </p>
            <p className="text-[11px] text-[#6E5C63] tabular-nums">
              {STORE_INFO.phoneDisplay} · {STORE_INFO.websiteDisplay}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B83262]">
              Tax Invoice / Bill
            </p>
            <p className="font-mono text-sm font-semibold text-[#23191D]">
              #{order.orderNumber}
            </p>
            <p className="text-[11px] text-[#6E5C63]">{formattedDate}</p>
          </div>
        </div>

        {/* Customer Billing Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#F6E9EE]">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E5C63]">
              Billed To
            </p>
            <p className="font-semibold text-[#23191D]">{order.customerName}</p>
            <p className="text-[#5A4950] tabular-nums">{order.phone}</p>
            {order.email && <p className="text-[#5A4950]">{order.email}</p>}
            {order.gstin && (
              <p className="font-mono text-[11px] text-[#B83262]">
                GSTIN: {order.gstin}
              </p>
            )}
          </div>

          <div className="space-y-0.5 sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E5C63]">
              Fulfilment &amp; Payment
            </p>
            <p className="font-medium text-[#23191D]">
              {order.fulfilment === 'pickup'
                ? 'Sadar Bazaar Store Pickup'
                : `${order.address}, ${order.cityPincode}`}
            </p>
            <p className="text-[#5A4950]">{paymentLabel}</p>
          </div>
        </div>

        {/* Itemized Line Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1DCE3] text-[11px] text-[#6E5C63]">
                <th className="py-1.5 pr-2 font-semibold">Item</th>
                <th className="py-1.5 px-2 font-semibold text-center">Qty</th>
                <th className="py-1.5 px-2 font-semibold text-right">Rate</th>
                <th className="py-1.5 pl-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF2F5]">
              {order.items.map((item, idx) => {
                const unitRate = item.unitPrice + item.personalisationFee;
                return (
                  <tr key={idx} className="align-top">
                    <td className="py-2 pr-2">
                      <p className="font-medium text-[#23191D]">{item.name}</p>
                      {item.personalisation?.wrapStyle && (
                        <p className="text-[11px] text-[#6E5C63]">
                          Wrap: {item.personalisation.wrapStyle}
                        </p>
                      )}
                      {item.personalisation?.customName && (
                        <p className="text-[11px] text-[#B83262]">
                          Engraving: “{item.personalisation.customName}”
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap">
                      {formatINR(unitRate)}
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatINR(unitRate * item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & GST Breakdown */}
        <dl className="pt-3 border-t border-[#F1DCE3] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#5A4950]">
            <dt>Item Subtotal</dt>
            <dd className="tabular-nums font-medium text-[#23191D]">
              {formatINR(order.subtotal)}
            </dd>
          </div>
          {order.personalisationTotal > 0 && (
            <div className="flex justify-between text-[#5A4950]">
              <dt>Personalisation &amp; Engraving</dt>
              <dd className="tabular-nums font-medium text-[#23191D]">
                +{formatINR(order.personalisationTotal)}
              </dd>
            </div>
          )}
          {order.promoDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Promo ({order.promoCode || 'DISCOUNT'})</dt>
              <dd className="tabular-nums font-medium">
                -{formatINR(order.promoDiscount)}
              </dd>
            </div>
          )}
          <div className="flex justify-between text-[#5A4950]">
            <dt>Delivery Charges</dt>
            <dd className="tabular-nums font-medium text-[#23191D]">
              {order.deliveryFee === 0 ? 'Free' : formatINR(order.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between text-[11px] text-[#6E5C63] pt-1 border-t border-dashed border-[#F1DCE3]">
            <dt>
              Taxable Value + GST ({GST_RATE_PERCENT}% incl.: CGST {formatINR(cgst)} + SGST{' '}
              {formatINR(sgst)})
            </dt>
            <dd className="tabular-nums">{formatINR(order.taxableValue)}</dd>
          </div>
          <div className="pt-2 border-t border-[#23191D]/15 flex justify-between items-baseline text-sm font-semibold text-[#23191D]">
            <dt>Grand Total Payable</dt>
            <dd className="font-display text-lg text-[#B83262] tabular-nums">
              {formatINR(order.totalAmount)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Invoice Actions */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handlePrint}
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#EAD5DC] bg-white text-xs font-semibold text-[#23191D] hover:border-[#B83262] hover:text-[#B83262] transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadTxt}
          className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#EAD5DC] bg-white text-xs font-semibold text-[#23191D] hover:border-[#B83262] hover:text-[#B83262] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Bill</span>
        </button>

        <a
          href={buildWhatsAppUrl(buildInvoiceText(order), whatsappPhone)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="whatsapp-bill-btn"
          className="sm:col-span-2 min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Send Order &amp; Bill on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
