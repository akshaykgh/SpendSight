import { useState, useCallback, useRef } from 'react';
import clsx from 'clsx';

interface Props {
  onUpload: (file: File) => void;
  isUploading: boolean;
  uploadError?: string;
}

function validate(file: File): string | null {
  if (!file.name.endsWith('.csv')) return 'Only .csv files are supported';
  if (file.size > 50 * 1024 * 1024) return 'File must be under 50 MB';
  return null;
}

export function UploadZone({ onUpload, isUploading, uploadError }: Props) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) { setLocalError(err); return; }
      setLocalError('');
      onUpload(file);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handle(file);
    },
    [handle]
  );

  const error = localError || uploadError;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117] p-6">
      <div className="w-full max-w-xl">
        {}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            ML-Powered · Real-time Analysis
          </span>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Transaction Analyzer
          </h1>
          <p className="text-gray-400">
            Upload your CSV to detect anomalies, fraud signals, and categorize every transaction.
          </p>
        </div>

        {}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={clsx(
            'relative rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all duration-200 select-none',
            dragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.015]'
              : 'border-gray-700 bg-[#1a1d27] hover:border-indigo-500/60 hover:bg-white/2',
            isUploading && 'cursor-not-allowed opacity-60 pointer-events-none'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <p className="text-white font-medium">Uploading file…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                dragging ? 'bg-indigo-500/20' : 'bg-gray-800'
              )}>
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">
                  {dragging ? 'Release to upload' : 'Drop CSV or click to browse'}
                </p>
                <p className="text-gray-500 text-sm mt-1">Up to 50 MB supported</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {}
        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {['Anomaly Detection', 'Fraud Signals', 'Category AI', 'Velocity Burst', 'Merchant Risk'].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-gray-800/80 text-gray-400 text-xs border border-gray-700/80">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
