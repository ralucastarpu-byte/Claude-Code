"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import type { ExportColumn, ExportScope } from "@/lib/csv"
import { Download } from "lucide-react"
import { useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created (UTC)",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

const choiceClass =
  "size-4 shrink-0 accent-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"

/**
 * Export options for the payments table (NWP-101).
 *
 * Counts come from the server, from the same query builder that writes the
 * file, so the number shown is the number of rows the file will contain.
 * The file itself is built by the export route; this only chooses the URL.
 */
export function ExportDialog({
  columns,
  defaultColumns,
  exportQuery,
  filteredCount,
  allCount,
}: {
  columns: readonly ExportColumn[]
  defaultColumns: readonly ExportColumn[]
  exportQuery: string
  filteredCount: number
  allCount: number
}) {
  const [selected, setSelected] = useState<Set<ExportColumn>>(
    () => new Set(defaultColumns),
  )
  const [scope, setScope] = useState<ExportScope>("filtered")

  const toggle = (column: ExportColumn) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(column)) next.delete(column)
      else next.add(column)
      return next
    })
  }

  // Keep the canonical column order, whatever order they were ticked in.
  const chosen = columns.filter((column) => selected.has(column))
  const count = scope === "all" ? allCount : filteredCount

  const query = new URLSearchParams(exportQuery)
  query.set("columns", chosen.join(","))
  query.set("scope", scope)
  const href = `/api/payments/export?${query.toString()}`

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose what goes in the CSV before you download it.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
              Payments
            </legend>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="export-scope"
                value="filtered"
                checked={scope === "filtered"}
                onChange={() => setScope("filtered")}
                className={choiceClass}
              />
              Current filter
              <span className="tabular-nums text-gray-500">
                ({filteredCount.toLocaleString()})
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="export-scope"
                value="all"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className={choiceClass}
              />
              All payments
              <span className="tabular-nums text-gray-500">
                ({allCount.toLocaleString()})
              </span>
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            {columns.map((column) => (
              <label
                key={column}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  name="export-columns"
                  value={column}
                  checked={selected.has(column)}
                  onChange={() => toggle(column)}
                  className={choiceClass}
                />
                {COLUMN_LABELS[column]}
              </label>
            ))}
          </fieldset>

          <p
            id="export-summary"
            className="text-sm text-gray-700 dark:text-gray-300"
            aria-live="polite"
          >
            {chosen.length === 0
              ? "Select at least one column to download."
              : count === 0
                ? "No payments match this filter. The file will contain only the header row."
                : `${count.toLocaleString()} ${count === 1 ? "payment" : "payments"} will be exported.`}
          </p>
        </DrawerBody>

        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full sm:w-fit">
              Cancel
            </Button>
          </DrawerClose>
          {chosen.length === 0 ? (
            <Button
              className="w-full sm:w-fit"
              disabled
              aria-describedby="export-summary"
            >
              Download CSV
            </Button>
          ) : (
            <Button className="w-full sm:w-fit" asChild>
              <a href={href} aria-describedby="export-summary">
                Download CSV
              </a>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
