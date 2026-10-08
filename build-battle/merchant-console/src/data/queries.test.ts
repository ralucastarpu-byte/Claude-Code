import { describe, expect, it } from "vitest"
import { sortPayments } from "./queries"
import { Payment } from "./types"

/**
 * The amount sort used to compare minor units as strings, so 9000 sorted
 * after 10000. Amounts are integers; they sort as numbers.
 */

const base: Payment = {
  id: "pay_0001",
  merchantId: "mch_01",
  amount: 0,
  currency: "USD",
  status: "captured",
  method: "card",
  cardBrand: "visa",
  last4: "4242",
  createdAt: "2026-03-14T10:15:00.000Z",
  description: "Order 1180",
}

const amounts = [10000, 9000, 250, 100000]
const payments = amounts.map((amount, i) => ({
  ...base,
  id: `pay_${i}`,
  amount,
}))

describe("sortPayments by amount", () => {
  it("sorts ascending numerically, not as text", () => {
    const sorted = sortPayments(payments, "amount", "asc")
    expect(sorted.map((p) => p.amount)).toEqual([250, 9000, 10000, 100000])
  })

  it("sorts descending numerically, not as text", () => {
    const sorted = sortPayments(payments, "amount", "desc")
    expect(sorted.map((p) => p.amount)).toEqual([100000, 10000, 9000, 250])
  })

  it("does not reorder the array it was given", () => {
    sortPayments(payments, "amount", "asc")
    expect(payments.map((p) => p.amount)).toEqual(amounts)
  })
})
