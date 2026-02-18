import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Default theme fallback
const DEFAULT_THEME = {
    sidebarColor: '#1e293b',
    sidebarHoverColor: '#334155',
    accentColor: '#9333ea',
    accentHoverColor: '#7e22ce',
    sidebarTextColor: '#e2e8f0',
    topbarStyle: 'light',
    buttonRadius: 'rounded-xl',
}

// Helper: extract session info from cookie
function getSessionInfo(request: NextRequest) {
    const sessionCookie = request.cookies.get('admin_session')
    if (!sessionCookie) return null

    try {
        const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        const parts = decoded.split(':')
        if (parts.length < 3) return null

        const userType = parts[0]
        const tenantId = parts.length > 4 ? parts[3] : null

        return { userType, tenantId }
    } catch {
        return null
    }
}

// GET /api/theme — returns the applicable theme for the current user
export async function GET(request: NextRequest) {
    try {
        const session = getSessionInfo(request)

        // 1. If tenant user, try tenant-specific theme first
        if (session?.tenantId) {
            try {
                const tenantResult = await query(
                    'SELECT theme_settings FROM tenants WHERE id = $1',
                    [session.tenantId]
                )
                if (
                    tenantResult.rows.length > 0 &&
                    tenantResult.rows[0].theme_settings &&
                    Object.keys(tenantResult.rows[0].theme_settings).length > 0
                ) {
                    return NextResponse.json({
                        success: true,
                        data: { ...DEFAULT_THEME, ...tenantResult.rows[0].theme_settings },
                        source: 'tenant',
                    })
                }
            } catch (err) {
                console.error('Error fetching tenant theme:', err)
            }
        }

        // 2. Fall back to platform default
        try {
            const platformResult = await query(
                "SELECT value FROM platform_settings WHERE key = 'theme'"
            )
            if (platformResult.rows.length > 0) {
                return NextResponse.json({
                    success: true,
                    data: { ...DEFAULT_THEME, ...platformResult.rows[0].value },
                    source: 'platform',
                })
            }
        } catch (err) {
            // Table might not exist yet — that's OK, return default
            console.error('Error fetching platform theme (table may not exist yet):', err)
        }

        // 3. Hardcoded fallback
        return NextResponse.json({
            success: true,
            data: DEFAULT_THEME,
            source: 'default',
        })
    } catch (error) {
        console.error('GET /api/theme error:', error)
        return NextResponse.json({
            success: true,
            data: DEFAULT_THEME,
            source: 'default',
        })
    }
}

// PUT /api/theme — save theme settings
export async function PUT(request: NextRequest) {
    try {
        const session = getSessionInfo(request)
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            sidebarColor,
            sidebarHoverColor,
            accentColor,
            accentHoverColor,
            sidebarTextColor,
            topbarStyle,
            buttonRadius,
        } = body

        const themeData: Record<string, string> = {}
        if (sidebarColor) themeData.sidebarColor = sidebarColor
        if (sidebarHoverColor) themeData.sidebarHoverColor = sidebarHoverColor
        if (accentColor) themeData.accentColor = accentColor
        if (accentHoverColor) themeData.accentHoverColor = accentHoverColor
        if (sidebarTextColor) themeData.sidebarTextColor = sidebarTextColor
        if (topbarStyle) themeData.topbarStyle = topbarStyle
        if (buttonRadius) themeData.buttonRadius = buttonRadius

        // Super admin → save to platform_settings
        if (session.userType === 'superadmin') {
            await query(
                `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ('theme', $1::jsonb, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
                [JSON.stringify(themeData)]
            )

            return NextResponse.json({
                success: true,
                data: { ...DEFAULT_THEME, ...themeData },
                message: 'Platform theme saved successfully',
            })
        }

        // Tenant → save to tenants.theme_settings
        if (session.tenantId) {
            await query(
                `UPDATE tenants SET theme_settings = $1::jsonb, updated_at = NOW() WHERE id = $2`,
                [JSON.stringify(themeData), session.tenantId]
            )

            return NextResponse.json({
                success: true,
                data: { ...DEFAULT_THEME, ...themeData },
                message: 'Theme saved successfully',
            })
        }

        return NextResponse.json(
            { success: false, message: 'Unable to determine user context' },
            { status: 400 }
        )
    } catch (error) {
        console.error('PUT /api/theme error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to save theme' },
            { status: 500 }
        )
    }
}

// DELETE /api/theme — reset tenant theme to platform default
export async function DELETE(request: NextRequest) {
    try {
        const session = getSessionInfo(request)
        if (!session?.tenantId) {
            return NextResponse.json(
                { success: false, message: 'Only tenants can reset to platform default' },
                { status: 400 }
            )
        }

        await query(
            `UPDATE tenants SET theme_settings = '{}'::jsonb, updated_at = NOW() WHERE id = $1`,
            [session.tenantId]
        )

        // Return the platform default
        try {
            const platformResult = await query(
                "SELECT value FROM platform_settings WHERE key = 'theme'"
            )
            if (platformResult.rows.length > 0) {
                return NextResponse.json({
                    success: true,
                    data: { ...DEFAULT_THEME, ...platformResult.rows[0].value },
                    message: 'Theme reset to platform default',
                })
            }
        } catch {
            // ignore
        }

        return NextResponse.json({
            success: true,
            data: DEFAULT_THEME,
            message: 'Theme reset to default',
        })
    } catch (error) {
        console.error('DELETE /api/theme error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to reset theme' },
            { status: 500 }
        )
    }
}
