import { QRCodeSVG } from 'qrcode.react'

export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
      <span className="text-[10px] font-medium uppercase tracking-wider text-black/60">Simulated UPI QR</span>
    </div>
  )
}
