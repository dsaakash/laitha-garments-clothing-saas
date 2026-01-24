import { NextRequest, NextResponse } from 'next/server'
import { resetTenantPassword } from '@/lib/db-tenants'

// Generate random password
function generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

// PUT /api/tenants/[id]/reset-password - Reset tenant admin password
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Generate new random password
        const newPassword = generatePassword()

        const success = await resetTenantPassword(params.id, newPassword)

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Return the new password (only time it's visible)
        return NextResponse.json({
            success: true,
            credentials: {
                password: newPassword,
                loginUrl: '/admin/login'
            },
            message: 'Password reset successfully. Save this password - it cannot be retrieved later.'
        })
    } catch (error) {
        console.error('Error resetting password:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
