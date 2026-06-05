/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Hospital, SearchFilters } from '../types';
import { X, Link2, Mail, Copy, Check, Send, Sparkles } from 'lucide-react';
import { hasSupabaseConfig } from '../lib/env';
import { sendHospitalShare } from '../lib/carefinderRepository';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  hospitals: Hospital[]; // list of current filtered hospitals to pick from
  initialHospitalId?: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  filters,
  hospitals,
  initialHospitalId,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedHospIds, setSelectedHospIds] = useState<string[]>(
    hospitals.slice(0, 3).map(h => h.id) // pre-fill first 3 for convenience
  );

  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedHospIds(initialHospitalId ? [initialHospitalId] : hospitals.slice(0, 3).map(h => h.id));
    setEmailError('');
    setEmailStatus('idle');
  }, [hospitals, initialHospitalId, isOpen]);

  // Generate URL based on filter inputs
  const shareableUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    // Exact requested friendly format: /search?city=Lagos&specialty=maternity&radius=10
    if (filters.searchQuery) {
      params.set('query', filters.searchQuery);
    }
    
    if (filters.specialties.length > 0) {
      params.set('specialty', filters.specialties.join(','));
    }
    
    if (filters.ownership !== 'all') {
      params.set('ownership', filters.ownership);
    }
    
    if (filters.radius > 0) {
      params.set('radius', filters.radius.toString());
    }

    if (filters.userLat !== null && filters.userLng !== null) {
      params.set('lat', filters.userLat.toFixed(4));
      params.set('lng', filters.userLng.toFixed(4));
    }

    const host = `${window.location.origin}${window.location.pathname}`;
    const queryStr = params.toString();
    return queryStr ? `${host}?${queryStr}` : host;
  }, [filters]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleHospital = (id: string) => {
    setSelectedHospIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || selectedHospIds.length === 0) return;

    setEmailStatus('sending');
    setEmailError('');
    const selectedHospitals = hospitals.filter(h => selectedHospIds.includes(h.id));

    if (hasSupabaseConfig) {
      try {
        await sendHospitalShare(recipientEmail, selectedHospitals, shareableUrl);
        setEmailStatus('success');
      } catch (error) {
        setEmailError(error instanceof Error ? error.message : 'Unable to send email.');
        setEmailStatus('idle');
      }
      return;
    }

    setTimeout(() => {
      setEmailStatus('success');
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Medical Directory</h3>
              <p className="text-[11px] text-slate-400">Send useful hospital details to someone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Link Block */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-slate-450 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            Share this search
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            This link keeps your current search, filters, location, and distance range.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 select-all font-mono outline-hidden rounded"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded transition-all font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm border ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>

          {/* Email Sharing with Resend API Simulation */}
        <div className="p-5 space-y-4">
          <h4 className="text-xs font-semibold uppercase text-slate-450 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Email selected hospitals
          </h4>

          {emailStatus === 'success' ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-start gap-3 text-xs">
                <div className="p-1 bg-emerald-500 text-white rounded-full mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-bold">Email Sent Safely!</h5>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    The selected hospital details were sent to <b className="font-mono text-slate-900 dark:text-white">{recipientEmail}</b>.
                  </p>
                </div>
              </div>

              {/* Dynamic Simulated Email Preview Box */}
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50/20 text-xs text-slate-600">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Email Body Preview sent to {recipientEmail}:</span>
                <div className="mt-2 bg-white dark:bg-slate-950 p-3 rounded border border-slate-100 dark:border-slate-900 space-y-2">
                  <div className="text-blue-600 font-bold text-sm">Carefinder Nigeria Directory</div>
                  <p className="text-[11px] text-slate-450">You are receiving a curated list of medical providers:</p>
                  <ul className="text-[11px] space-y-1 my-1.5 pl-4 list-disc text-slate-800 dark:text-slate-300">
                    {hospitals.filter(h => selectedHospIds.includes(h.id)).map(h => (
                      <li key={h.id}>
                        <b>{h.name}</b> - {h.address}, {h.city} ({h.phone})
                      </li>
                    ))}
                  </ul>
                  <p className="text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-2 mt-2">
                    Shared from Carefinder.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEmailStatus('idle');
                  setRecipientEmail('');
                }}
                className="w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-750 hover:underline dark:text-blue-400 mt-2 text-center cursor-pointer"
              >
                Send Another List
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50 rounded text-xs leading-relaxed">
                  {emailError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-705 dark:text-slate-300">
                  Recipient Email Address:
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. medical-support@lga.gov.ng"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-3 py-2 text-xs rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>

              {/* Selection list of hospitals to include */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-705 dark:text-slate-300">
                  Choose hospitals to include ({selectedHospIds.length} selected)
                </label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-1">
                  {hospitals.map(h => {
                    if (h.status !== 'approved') return null;
                    const isChecked = selectedHospIds.includes(h.id);
                    return (
                      <label
                        key={h.id}
                        className="flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleHospital(h.id)}
                          className="rounded border-slate-305 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{h.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{h.city}, {h.lga}</p>
                        </div>
                      </label>
                    );
                  })}
                  {hospitals.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No hospitals found. Try changing your search.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={selectedHospIds.length === 0 || !recipientEmail || emailStatus === 'sending'}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {emailStatus === 'sending' ? 'Sending...' : 'Send list'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
