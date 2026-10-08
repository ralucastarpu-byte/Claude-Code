import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  exportFilename,
  exportLabel,
  parseExportColumns,
  parseExportScope,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV.
 *
 * Ops chooses the columns and the scope (NWP-101). Both are parsed against an
 * allowlist before anything runs. The file is built here from every matching
 * row, never from the page the browser happens to be showing.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const columns = parseExportColumns(params.get("columns"))
  if (!columns) {
    const error = params.get("columns")?.replace(/,/g, "")
      ? "One or more columns are not available for export. Choose from the export options."
      : "Choose at least one column from the export options."
    return NextResponse.json({ error }, { status: 400 })
  }

  const scope = parseExportScope(params.get("scope"))
  if (!scope) {
    return NextResponse.json(
      { error: "Scope must be the current filter or all payments." },
      { status: 400 },
    )
  }

  // "All payments" drops the filters but keeps the requested order.
  const filters = parseFilters(params)
  const scoped =
    scope === "all"
      ? {
          ...parseFilters(new URLSearchParams()),
          sort: filters.sort,
          direction: filters.direction,
        }
      : filters

  const rows = sortPayments(
    filterPayments(scoped),
    scoped.sort,
    scoped.direction,
  )

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(new Date(), exportLabel(scope, scoped))}"`,
    },
  })
}
