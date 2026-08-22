/** Monthly fees in the same session must be selected in order (Apr before Jun, etc.). */

export function normalizeFeeForSelection(fee) {
  return {
    ...fee,
    is_monthly:
      fee.is_monthly === true ||
      fee.is_monthly === 1 ||
      fee.is_monthly === '1' ||
      String(fee.fp_main_monthly_fee ?? '') === '1',
    total: Number(fee.total ?? fee.total_amount ?? 0),
  }
}

export function sortFeesForPayment(fees) {
  return [...fees].sort((a, b) => {
    const ay = Number(a.ay_id || 0) - Number(b.ay_id || 0)
    if (ay !== 0) return ay
    const order =
      Number(a.fpp_order_no || a.order_no || 0) -
      Number(b.fpp_order_no || b.order_no || 0)
    if (order !== 0) return order
    return Number(a.f_id || 0) - Number(b.f_id || 0)
  })
}

function getMonthlyGroup(fees, fee) {
  return fees.filter(
    (row) => row.is_monthly && Number(row.ay_id) === Number(fee.ay_id),
  )
}

export function isMonthlyFeeEnabled(fees, selectedIds, fId) {
  const fee = fees.find((row) => row.f_id === fId)
  if (!fee?.is_monthly) return true

  const group = getMonthlyGroup(fees, fee)
  const index = group.findIndex((row) => row.f_id === fId)
  if (index <= 0) return true
  return selectedIds.has(group[index - 1].f_id)
}

export function toggleFeeSelection(fees, selectedIds, fId) {
  const fee = fees.find((row) => row.f_id === fId)
  if (!fee) return selectedIds

  const next = new Set(selectedIds)

  if (next.has(fId)) {
    next.delete(fId)
    if (fee.is_monthly) {
      const group = getMonthlyGroup(fees, fee)
      const index = group.findIndex((row) => row.f_id === fId)
      for (let i = index + 1; i < group.length; i += 1) {
        next.delete(group[i].f_id)
      }
    }
    return next
  }

  if (fee.is_monthly) {
    const group = getMonthlyGroup(fees, fee)
    const index = group.findIndex((row) => row.f_id === fId)
    if (index > 0) {
      for (let i = 0; i < index; i += 1) {
        if (!next.has(group[i].f_id)) {
          return selectedIds
        }
      }
    }
  }

  next.add(fId)
  return next
}

export function sumSelectedFees(fees, selectedIds) {
  return fees
    .filter((fee) => selectedIds.has(fee.f_id))
    .reduce((sum, fee) => sum + Number(fee.total || 0), 0)
}

export function formatPayAmount(amount) {
  return Number(amount || 0).toFixed(2)
}
