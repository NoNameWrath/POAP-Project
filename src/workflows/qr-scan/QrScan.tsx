'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QrCode, AlertTriangle } from 'lucide-react';

// Correct: pick the named export `Scanner` from the module
const QRScannerComponent = dynamic(
  () => import('@yudiel/react-qr-scanner').then((m) => m.Scanner),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-gray-500">Loading camera…</div>,
  }
);

export function QrScan({
  enabled,
  onScanned,
}: {
  enabled: boolean;
  onScanned: (payload: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <QrCode className="w-5 h-5" /> Scan to Verify
        </h3>
        <Badge>{!open ? 'Step 2' : 'Scanning'}</Badge>
      </div>

      <div className="mt-4">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            disabled={!enabled}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50 disabled:opacity-50"
          >
            Open QR Scanner
          </button>
        )}

        {open && (
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
            <QRScannerComponent
              // Library emits an array of detected codes; grab the first
              onScan={(detected) => {
                const val = detected?.[0]?.rawValue;
                if (val) {
                  onScanned(val);
                  setOpen(false);
                }
              }}
              onError={(err) =>
                setError(err instanceof Error ? err.message : String(err ?? 'Scanner error'))
              }
              // On laptops there’s usually only a front cam; "environment" is just a hint
              constraints={{ facingMode: { ideal: 'environment' } }}
              // Use `styles` / `classNames` instead of non-existent `containerStyle`
              styles={{ container: { width: '100%' } }}
              classNames={{ video: 'w-full h-auto' }}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>
    </Card>
  );
}
