function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-km-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay.')), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.kmRazorpay = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'))
    document.body.appendChild(script)
  })
}

/**
 * Open Razorpay checkout. Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
 */
export async function openRazorpayCheckout(checkout) {
  await loadRazorpayScript()
  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is unavailable.')
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: checkout.key_id,
      amount: String(checkout.amount_paise || Math.round(Number(checkout.amount || 0) * 100)),
      currency: checkout.currency || 'INR',
      name: checkout.name || 'THE MADRESAH TAYEBIYAH SOCIETY',
      description: checkout.description || checkout.order_id || '',
      order_id: checkout.order_id,
      prefill: checkout.prefill || {},
      theme: { color: '#740122' },
      handler(response) {
        resolve(response)
      },
      modal: {
        ondismiss() {
          reject(new Error('Payment cancelled.'))
        },
      },
    })
    rzp.on('payment.failed', (resp) => {
      const msg = resp?.error?.description || resp?.error?.reason || 'Payment failed.'
      reject(new Error(msg))
    })
    rzp.open()
  })
}
