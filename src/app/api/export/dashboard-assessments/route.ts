import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { serverUrl } from '@/app/lib/definitions'
import { AUTH_COOKIE_LABEL } from '@/auth/constants'

/**
 * Proxies the PM dashboard Excel/PDF export: the backend session cookie is
 * httpOnly and server-only, so the browser can't hit the backend directly —
 * this route reads it server-side and streams the file back to the client.
 */
export async function GET(req: NextRequest) {
    const jar = await cookies()
    const token = jar.get(AUTH_COOKIE_LABEL)?.value
    if (!token || !serverUrl) {
        return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL('admin/charities/dashboard-assessments/export', serverUrl)
    req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value))

    let res: Response
    try {
        res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Accept: '*/*',
                cookie: `${AUTH_COOKIE_LABEL}=${encodeURIComponent(token)}`,
            },
            cache: 'no-store',
        })
    } catch {
        return NextResponse.json({ ok: false, message: 'Backend unreachable' }, { status: 503 })
    }

    if (!res.ok) {
        let message = 'Export failed'
        try {
            const data = await res.json()
            message = data?.message || message
        } catch { /* noop */ }
        return NextResponse.json({ ok: false, message }, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
            'Content-Disposition': res.headers.get('content-disposition') || 'attachment',
        },
    })
}
