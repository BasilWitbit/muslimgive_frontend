import { ExternalLink } from 'lucide-react'

function getExternalWebsiteUrl(website: string): string | null {
    const value = website.trim()
    if (!value) return null

    try {
        const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`)
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
    } catch {
        return null
    }
}

export default function CharityWebsiteLink({
    websiteUrl,
    governmentRecordUrl,
    governmentRecordLabel,
}: {
    websiteUrl?: string | null
    governmentRecordUrl?: string | null
    governmentRecordLabel?: string | null
}) {
    if (!websiteUrl?.trim() && !governmentRecordUrl?.trim()) return null

    const href = websiteUrl ? getExternalWebsiteUrl(websiteUrl) : null
    const governmentHref = governmentRecordUrl ? getExternalWebsiteUrl(governmentRecordUrl) : null

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {websiteUrl?.trim() ? <>
                <span className="font-medium text-[#667085]">Charity website:</span>
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#266DD3] underline decoration-[#266DD3]/35 underline-offset-2 hover:text-[#1f5bb5]">
                        <span className="break-all">{websiteUrl}</span>
                        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    </a>
                ) : <span className="break-all text-[#344054]">{websiteUrl}</span>}
            </> : null}
            {governmentRecordUrl?.trim() ? <>
                <span className="font-medium text-[#667085]">{governmentRecordLabel || 'Government record'}:</span>
                {governmentHref ? (
                    <a href={governmentHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#266DD3] underline decoration-[#266DD3]/35 underline-offset-2 hover:text-[#1f5bb5]">
                        <span>{governmentRecordLabel || 'Open record'}</span>
                        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    </a>
                ) : <span className="break-all text-[#344054]">{governmentRecordUrl}</span>}
            </> : null}
        </div>
    )
}
