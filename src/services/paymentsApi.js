import { API_BASE_URL } from '@/config/apiConfig'
import { parseJson } from '@/services/apiClient'

async function postJson(path, body = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  return parseJson(response)
}

/**
 * Admin one-shot pay: credit shortfall (cash/upi) then settle from wallet.
 * @param {{ st_id: number, f_ids: number[], method: 'cash'|'upi'|'online', receipt_no?: string, ref_no?: string, remarks?: string, credit_date?: string }} payload
 */
export async function adminPayFees(payload) {
  return postJson('/fees/pay.php', payload)
}

/** Admin: credit wallet only */
export async function adminAddToWallet(payload) {
  return postJson('/fees/add_to_wallet.php', payload)
}

/** Admin: settle from wallet only */
export async function adminSettleFees(payload) {
  return postJson('/fees/settle.php', payload)
}

/** Student panel: settle from wallet (or needs_gateway) */
export async function studentPayFees(fIds) {
  return postJson('/student-panel/pay.php', {
    f_ids: (fIds || []).map(Number).filter((id) => id > 0),
  })
}

/** Create Razorpay order (keys from razorpay table status = 1) */
export async function createRazorpayOrder({ stId, fIds }) {
  const body = {
    f_ids: (fIds || []).map(Number).filter((id) => id > 0),
  }
  if (stId) body.st_id = Number(stId)
  return postJson('/fees/razorpay_order.php', body)
}

/** Verify checkout payload and settle fees */
export async function verifyRazorpayPayment(payload) {
  return postJson('/fees/razorpay_verify.php', {
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
  })
}
