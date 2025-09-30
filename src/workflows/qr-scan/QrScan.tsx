'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QrCode, AlertTriangle } from 'lucide-react';

// Pick the *named* export `QrScanner` and return the component itself
const QRScannerComponent = dynamic(
  () =>
    import('@yudiel/react-qr-scanner').then((m) => m.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-sm text-gray-500">Loading camera…</div>
    ),
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
              onDecode={(res: string) => {
                onScanned(res);
                setOpen(false);
              }}
              onError={(err: any) => setError(err?.message || 'Scanner error')}
              // On laptops, 'environment' often doesn't exist; let the browser pick or use 'user'
              constraints={{ facingMode: { ideal: 'environment' } }}
              containerStyle={{ width: '100%' }}
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
