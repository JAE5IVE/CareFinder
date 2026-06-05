/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hospital } from '../types';
import { X, FileSpreadsheet, Download, Check, AlertCircle } from 'lucide-react';
import { buildCsvContent, buildCsvFilename, DEFAULT_CSV_COLUMNS } from '../utils/csv';

interface CSVExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  searchQuery: string;
}

export const CSVExportModal: React.FC<CSVExportModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  searchQuery,
}) => {
  const [columns, setColumns] = useState(DEFAULT_CSV_COLUMNS);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setColumns(columns.map(col => col.key === key ? { ...col, enabled: !col.enabled } : col));
  };

  const handleExport = () => {
    const activeCols = columns.filter(c => c.enabled);
    if (activeCols.length === 0) return;

    const csvContent = buildCsvContent(hospitals, activeCols);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filename = buildCsvFilename(searchQuery);

    // Download trigger
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export to CSV</h3>
              <p className="text-[11px] text-slate-400">Select columns to export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Exporting <b className="text-blue-600 dark:text-blue-400">{hospitals.length} match(es)</b> in search index.
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
            {columns.map(col => (
              <label
                key={col.key}
                className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded cursor-pointer transition-colors"
              >
                <span className="text-xs font-medium text-slate-705 dark:text-slate-300">{col.label}</span>
                <input
                  type="checkbox"
                  checked={col.enabled}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            ))}
          </div>

          {columns.filter(c => c.enabled).length === 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 rounded text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please select at least one column to finalize the CSV download.</span>
            </div>
          )}

          {/* Traceability preview */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
            <span className="text-slate-400">Output Filename:</span>
            <div className="mt-1 text-slate-705 dark:text-slate-300 font-bold truncate">
              {buildCsvFilename(searchQuery)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:border-slate-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={columns.filter(c => c.enabled).length === 0 || downloadSuccess}
            className={`px-4 py-2 text-xs font-bold text-white rounded transition-all shadow-sm flex items-center gap-1.5 ${
              downloadSuccess
                ? 'bg-emerald-600'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Trigger Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
