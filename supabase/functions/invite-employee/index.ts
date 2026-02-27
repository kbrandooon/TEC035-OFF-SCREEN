import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function: invite-employee
 *
 * Handles two distinct flows based on whether the invited email already has
 * a Supabase Auth account:
 *
 * A) Existing user  → add directly to `tenant_members`, mark invitation as
 *                     accepted, return { method: 'direct' }.  No email sent;
 *                     the user logs in normally and sees the new studio.
 *
 * B) New user       → create invitation record, send magic-link via
 *                     `inviteUserByEmail`, return { method: 'email' }.
 *                     User completes the /accept-invite onboarding form.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401)
    }

    // ── 1. Verify caller's JWT ───────────────────────────────────────────────
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !caller) {
      return json({ error: 'Unauthorized: invalid session' }, 401)
    }

    const tenantId = caller.app_metadata?.tenant_id as string | undefined
    const callerRole = caller.app_metadata?.role as string | undefined

    if (!tenantId || callerRole !== 'admin') {
      return json(
        { error: 'Forbidden: solo los admins pueden invitar empleados' },
        403
      )
    }

    // ── 2. Parse request body ────────────────────────────────────────────────
    const { email, roleId } = (await req.json()) as {
      email?: string
      roleId?: string
    }

    if (!email || !roleId) {
      return json({ error: 'Se requiere email y roleId' }, 400)
    }

    // ── 3. Admin client ──────────────────────────────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ── 4. Detect if the user already has an account ─────────────────────────
    // We look them up in `profiles` (our app table) which is 1:1 with auth.users.
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // ── CASE A: Existing user ─────────────────────────────────────────────────
    if (existingProfile) {
      // Guard: already a member of THIS tenant?
      const { data: existingMember } = await adminClient
        .from('tenant_members')
        .select('user_id')
        .eq('user_id', existingProfile.id)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (existingMember) {
        return json({ error: 'Este usuario ya es miembro del estudio' }, 409)
      }

      // Add directly to tenant_members — no invitation email needed.
      const { error: memberError } = await adminClient
        .from('tenant_members')
        .insert({
          user_id: existingProfile.id,
          tenant_id: tenantId,
          role_id: roleId,
        })

      if (memberError) {
        return json({ error: memberError.message }, 500)
      }

      // Record the invitation as immediately accepted for audit trail.
      await adminClient.from('tenant_invitations').upsert(
        {
          tenant_id: tenantId,
          role_id: roleId,
          invited_by: caller.id,
          email: email.toLowerCase(),
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,email', ignoreDuplicates: false }
      )

      return json({ success: true, method: 'direct' })
    }

    // ── CASE B: New user — send magic-link invitation ─────────────────────────
    const { data: invitation, error: inviteDbError } = await adminClient
      .from('tenant_invitations')
      .upsert(
        {
          tenant_id: tenantId,
          role_id: roleId,
          invited_by: caller.id,
          email: email.toLowerCase(),
        },
        { onConflict: 'tenant_id,email', ignoreDuplicates: false }
      )
      .select('token')
      .single()

    if (inviteDbError || !invitation) {
      return json(
        { error: inviteDbError?.message ?? 'Error al crear la invitación' },
        500
      )
    }

    const origin =
      req.headers.get('origin') ??
      req.headers.get('referer')?.split('/').slice(0, 3).join('/') ??
      'http://localhost:5173'

    const redirectTo = `${origin}/accept-invite?token=${invitation.token}`

    const { error: emailError } =
      await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo })

    if (emailError) {
      return json({ error: emailError.message }, 500)
    }

    return json({ success: true, method: 'email' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return json({ error: message }, 500)
  }
})

/** Helper to return JSON responses with CORS headers */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
