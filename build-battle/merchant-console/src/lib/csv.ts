import { merchantById } from "@/data/merchants"
import { Payment, PaymentFilters, PaymentStatus } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns and the scope (NWP-101). Both arrive from the
 * client, so the route parses them here against an allowlist before they
 * reach a query or a filename.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** Card last four is opt-in: these files often go straight to a merchant. */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] =
  EXPORT_COLUMNS.filter((column) => column !== "last4")

/**
 * Parse the `columns` param. Absent means the defaults. Otherwise every name
 * must be a known column; duplicates are dropped and the requested order is
 * kept. An unknown name or an empty selection returns null, and the route
 * rejects the request rather than guessing.
 */
export function parseExportColumns(raw: string | null): ExportColumn[] | null {
  if (raw === null) return [...DEFAULT_EXPORT_COLUMNS]

  const requested = raw.split(",")
  if (
    !requested.every((name) => EXPORT_COLUMNS.includes(name as ExportColumn))
  ) {
    return null
  }

  const columns = [...new Set(requested as ExportColumn[])]
  return columns.length > 0 ? columns : null
}

export const EXPORT_SCOPES = ["filtered", "all"] as const

export type ExportScope = (typeof EXPORT_SCOPES)[number]

/** Parse the `scope` param. Absent means the current filter. */
export function parseExportScope(raw: string | null): ExportScope | null {
  if (raw === null) return "filtered"
  return EXPORT_SCOPES.includes(raw as ExportScope)
    ? (raw as ExportScope)
    : null
}

/** What goes in the filename. A closed set, so raw input never reaches it. */
export type ExportLabel = PaymentStatus | "filtered" | "all"

export function exportLabel(
  scope: ExportScope,
  filters: PaymentFilters,
): ExportLabel {
  if (scope === "all") return "all"
  if (filters.status && filters.status !== "all") return filters.status
  return "filtered"
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

export function exportFilename(date = new Date(), label?: ExportLabel): string {
  const day = date.toISOString().slice(0, 10)
  return label ? `payments-${label}-${day}.csv` : `payments-${day}.csv`
}
