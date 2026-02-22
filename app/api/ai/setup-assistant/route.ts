import { NextRequest, NextResponse } from 'next/server'
import { getTenantById } from '@/lib/db-tenants'
import { createGroqChatCompletion, isGroqConfigured } from '@/lib/groq'
import { decodeBase64 } from '@/lib/utils'

const TENANT_AI_MODULE = 'ai_setup_assistant'

interface ParsedAiPlan {
  summary: string
  modules: Array<{
    module: string
    reason: string
    setupChecklist: string[]
    rolloutStage: 'admin-first' | 'tenant-rollout'
  }>
  risks: string[]
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function getSessionContext(request: NextRequest): {
  userType: string
  tenantId: string | null
} | null {
  const sessionCookie = request.cookies.get('admin_session')
  if (!sessionCookie) return null

  const decoded = decodeBase64(sessionCookie.value)
  const parts = decoded.split(':')
  if (parts.length < 4) return null

  return {
    userType: parts[0],
    tenantId: parts.length > 4 ? parts[3] : null,
  }
}

function tryParseAiPlan(content: string): ParsedAiPlan | null {
  try {
    const parsed = JSON.parse(content) as ParsedAiPlan
    if (!parsed.summary || !Array.isArray(parsed.modules) || !Array.isArray(parsed.risks)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const session = getSessionContext(request)

  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const adminRolloutEnabled = parseBooleanEnv(process.env.AI_ADMIN_ROLLOUT_ENABLED, true)
  const tenantRolloutEnabled = parseBooleanEnv(process.env.AI_TENANT_ROLLOUT_ENABLED, false)

  let hasTenantAiModule = false
  if (session.tenantId) {
    const tenant = await getTenantById(session.tenantId)
    hasTenantAiModule = Boolean(tenant?.modules?.includes(TENANT_AI_MODULE))
  }

  const canUse =
    (session.userType === 'superadmin' && adminRolloutEnabled) ||
    (['tenant', 'admin'].includes(session.userType) &&
      tenantRolloutEnabled &&
      hasTenantAiModule)

  return NextResponse.json({
    success: true,
    data: {
      configured: isGroqConfigured(),
      canUse,
      adminRolloutEnabled,
      tenantRolloutEnabled,
      tenantModule: TENANT_AI_MODULE,
      userType: session.userType,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionContext(request)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Groq is not configured. Set GROQ_API_KEY in your environment.',
        },
        { status: 503 }
      )
    }

    const adminRolloutEnabled = parseBooleanEnv(process.env.AI_ADMIN_ROLLOUT_ENABLED, true)
    const tenantRolloutEnabled = parseBooleanEnv(process.env.AI_TENANT_ROLLOUT_ENABLED, false)

    if (session.userType === 'superadmin' && !adminRolloutEnabled) {
      return NextResponse.json(
        { success: false, message: 'AI setup assistant is disabled for admins' },
        { status: 403 }
      )
    }

    if (['tenant', 'admin'].includes(session.userType)) {
      if (!tenantRolloutEnabled) {
        return NextResponse.json(
          {
            success: false,
            message: 'Tenant rollout is not enabled yet. This is currently admin-only.',
          },
          { status: 403 }
        )
      }

      if (!session.tenantId) {
        return NextResponse.json(
          { success: false, message: 'Tenant context not found' },
          { status: 403 }
        )
      }

      const tenant = await getTenantById(session.tenantId)
      if (!tenant) {
        return NextResponse.json(
          { success: false, message: 'Tenant not found' },
          { status: 404 }
        )
      }

      if (!tenant.modules?.includes(TENANT_AI_MODULE)) {
        return NextResponse.json(
          {
            success: false,
            message: `AI setup assistant is not enabled for this tenant. Enable "${TENANT_AI_MODULE}" first.`,
          },
          { status: 403 }
        )
      }
    }

    const body = (await request.json()) as {
      businessName?: string
      businessType?: string
      goals?: string[]
      currentSetupNotes?: string
      requestedModules?: string[]
    }

    const businessName = body.businessName || 'Business'
    const businessType = body.businessType || 'garments'
    const goals = Array.isArray(body.goals) ? body.goals : []
    const requestedModules = Array.isArray(body.requestedModules) ? body.requestedModules : []
    const currentSetupNotes = body.currentSetupNotes?.trim() || 'No current setup notes provided.'

    const prompt = [
      'Create a practical, module-by-module AI setup plan for this ERP business.',
      `Business Name: ${businessName}`,
      `Business Type: ${businessType}`,
      `Goals: ${goals.length > 0 ? goals.join(', ') : 'Not specified'}`,
      `Requested Modules: ${requestedModules.length > 0 ? requestedModules.join(', ') : 'Not specified'}`,
      `Current Setup Notes: ${currentSetupNotes}`,
      '',
      'Return strict JSON only with this shape:',
      '{',
      '  "summary": "string",',
      '  "modules": [',
      '    {',
      '      "module": "string",',
      '      "reason": "string",',
      '      "setupChecklist": ["string"],',
      '      "rolloutStage": "admin-first|tenant-rollout"',
      '    }',
      '  ],',
      '  "risks": ["string"]',
      '}',
    ].join('\n')

    const aiContent = await createGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are a SaaS implementation architect for multi-tenant business software. Keep plans concrete and rollout-safe.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const parsed = tryParseAiPlan(aiContent)

    return NextResponse.json({
      success: true,
      data: {
        parsed,
        raw: parsed ? null : aiContent,
      },
    })
  } catch (error) {
    console.error('AI setup assistant error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate AI setup plan',
      },
      { status: 500 }
    )
  }
}
