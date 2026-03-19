/**
 * refundWithRetry
 *
 * Retries the `refund_credit` RPC up to 3 times with linear backoff.
 * Logs a CRITICAL warning if all attempts fail so admins can investigate.
 *
 * HIGH-2: prevents permanent credit loss when a transient DB/network error
 * occurs during the refund step after a failed AI call or storage upload.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refundWithRetry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceSupabase: any,
  userId: string,
  context: string,
): Promise<void> {
  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { error } = await serviceSupabase.rpc('refund_credit', { p_user_id: userId })
    if (!error) return
    console.error(`[${context}] refund attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error)
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }
  console.error(
    `[${context}] CRITICAL: all refund attempts exhausted for user ${userId} — manual review required`
  )
}
