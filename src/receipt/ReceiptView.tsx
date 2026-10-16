import type { ReceiptSale } from '@/features/pos/api'
import type { StoreSettings } from '@/features/settings/api'
import { formatAmount } from '@/lib/currency'
import { formatManilaDateTime } from '@/lib/manilaTime'
import './receipt.css'

export type PaperWidth = 58 | 80

const NOT_OFFICIAL_RECEIPT = 'This is not an official receipt.'

type ReceiptViewProps = {
  sale: ReceiptSale
  settings: StoreSettings
  paperWidth: PaperWidth
  /** Adds a "REPRINT" label, for receipts printed again from Transactions. */
  reprint?: boolean
}

const statusLabels = { completed: null, voided: 'VOIDED', refunded: 'REFUNDED' } as const

// Receipt layout from section 9 of the UI guide: black monospace text, no colors or images.
export default function ReceiptView({
  sale,
  settings,
  paperWidth,
  reprint = false,
}: ReceiptViewProps) {
  const statusLabel = statusLabels[sale.status]
  // The footer from settings may already include the "not an official receipt" line.
  const footerHasNotice = settings.receipt_footer.toLowerCase().includes('not an official receipt')

  return (
    <div className="receipt" data-width={paperWidth}>
      <div className="receipt-center">
        <p className="receipt-store">{settings.store_name.toUpperCase()}</p>
        {settings.address && <p>{settings.address}</p>}
        {settings.contact_no && <p>{settings.contact_no}</p>}
      </div>

      {(reprint || statusLabel) && (
        <p className="receipt-center receipt-strong">
          {[reprint && '*** REPRINT ***', statusLabel && `*** ${statusLabel} ***`]
            .filter(Boolean)
            .join(' ')}
        </p>
      )}

      <hr className="receipt-rule" />
      <p>Receipt #: {sale.receipt_no}</p>
      <p>Date: {formatManilaDateTime(sale.created_at)}</p>
      <p>Cashier: {sale.cashier?.full_name}</p>

      <hr className="receipt-rule" />
      <div className="receipt-items receipt-head">
        <span>Item</span>
        <span className="receipt-right">Qty</span>
        <span className="receipt-right">Amount</span>
      </div>
      {sale.items.map((item) => (
        <div key={item.id} className="receipt-items">
          <span>{item.product_name}</span>
          <span className="receipt-right">{item.quantity}</span>
          <span className="receipt-right">{formatAmount(item.line_total)}</span>
        </div>
      ))}

      <hr className="receipt-rule" />
      <ReceiptRow label="Subtotal" amount={sale.subtotal} />
      {sale.discount > 0 && <ReceiptRow label="Discount" amount={-sale.discount} />}
      <ReceiptRow label="TOTAL" amount={sale.total} strong />
      {sale.vat_amount > 0 && (
        <ReceiptRow label={`VAT included (${settings.vat_rate}%)`} amount={sale.vat_amount} />
      )}
      <ReceiptRow label="Cash" amount={sale.cash_received} />
      <ReceiptRow label="Change" amount={sale.change} />

      <hr className="receipt-rule" />
      <div className="receipt-center">
        {!footerHasNotice && <p>{NOT_OFFICIAL_RECEIPT}</p>}
        {settings.receipt_footer && <p>{settings.receipt_footer}</p>}
      </div>
    </div>
  )
}

function ReceiptRow({
  label,
  amount,
  strong = false,
}: {
  label: string
  amount: number
  strong?: boolean
}) {
  return (
    <div className={strong ? 'receipt-row receipt-strong' : 'receipt-row'}>
      <span>{label}</span>
      <span>{formatAmount(amount)}</span>
    </div>
  )
}
