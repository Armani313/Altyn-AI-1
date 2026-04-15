/**
 * Credit refund helpers with retry + durable failure log.
 *
 * Retries the refund RPC up to 3 times with linear backoff.
 * If all attempts fail, inserts a row into `refund_failures` so an admin
 * can reconcile the balance manually. The INSERT is itself best-effort —
 * a final CRITICAL log remains as a safety net.
 *
 * HIGH-2: prevents permanent credit loss when a transient DB/network error
 * occurs during the refund step after a failed AI call or storage upload.
 * MED-2 (audit 2026-04-16): durably records exhaustion so we stop losing
 * knowledge of failed refunds to stdout alone.
 */

const MAX_ATTEMPTS = 3

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = any

/**
 * Legacy single-credit refund used by existing code paths. Uses the backward-
 * compatible `refund_credit` RPC (which internally calls refund_credits_by
 * with amount=1 and reason='refund_generation').
 */
export async function refundWithRetry(
  serviceSupabase: ServiceClient,
  userId: string,
  context: string,
): Promise<void> {
  await runRefundLoop({
    serviceSupabase,
    userId,
    amount: 1,
    context,
    rpc: () => serviceSupabase.rpc('refund_credit', { p_user_id: userId }),
    // refund_failures.reason when logging exhaustion:
    reason: 'refund_generation',
    refId: null,
  })
}

/**
 * Refund N credits via `refund_credits_by` RPC (migration 021). Pass the
 * reason matching credit_transactions.reason and an optional ref_id
 * (generation id / video id / etc.) so the audit row links back to the
 * originating resource.
 */
export async function refundByWithRetry(
  serviceSupabase: ServiceClient,
  userId: string,
  amount: number,
  reason: 'refund_generation' | 'refund_video' | 'refund_upscale',
  refId: string | null,
  context: string,
): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) {
    console.error(`[${context}] refundByWithRetry: invalid amount=${amount}`)
    return
  }

  await runRefundLoop({
    serviceSupabase,
    userId,
    amount,
    context,
    rpc: () =>
      serviceSupabase.rpc('refund_credits_by', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_ref_id: refId,
      }),
    reason,
    refId,
  })
}

// ── internals ────────────────────────────────────────────────────────────────

interface RefundLoopArgs {
  serviceSupabase: ServiceClient
  userId: string
  amount: number
  context: string
  rpc: () => Promise<{ error: unknown }>
  reason: string
  refId: string | null
}

async function runRefundLoop(args: RefundLoopArgs): Promise<void> {
  const { serviceSupabase, userId, amount, context, rpc, reason, refId } = args
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { error } = await rpc()
    if (!error) return
    lastError = error
    console.error(
      `[${context}] refund attempt ${attempt}/${MAX_ATTEMPTS} failed (amount=${amount}):`,
      error,
    )
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }

  // All retries exhausted — record durably for admin follow-up.
  const errorMessage = serializeError(lastError)
  try {
    const { error: insertErr } = await serviceSupabase
      .from('refund_failures')
      .insert({
        user_id: userId,
        amount,
        reason,
        ref_id: refId,
        error: errorMessage,
        context,
      })
    if (insertErr) {
      console.error(
        `[${context}] CRITICAL: refund_failures insert also failed for user ${userId}:`,
        insertErr,
      )
    }
  } catch (insertThrown) {
    console.error(
      `[${context}] CRITICAL: refund_failures insert threw for user ${userId}:`,
      insertThrown,
    )
  }

  console.error(
    `[${context}] CRITICAL: all refund attempts exhausted for user ${userId} ` +
      `(amount=${amount}, reason=${reason}, ref=${refId ?? 'null'}) — ` +
      `recorded in refund_failures; manual review required`,
  )
}

function serializeError(err: unknown): string {
  if (!err) return ''
  if (err instanceof Error) return err.message.slice(0, 500)
  if (typeof err === 'string') return err.slice(0, 500)
  try {
    return JSON.stringify(err).slice(0, 500)
  } catch {
    return String(err).slice(0, 500)
  }
}
