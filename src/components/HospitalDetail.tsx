/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Hospital, Review, User } from '../types';
import { MarkdownRenderer } from '../utils/markdown';
import { Phone, Mail, Clock, Shield, Award, Calendar, AlertTriangle, Star, Send, ChevronLeft, MapPin } from 'lucide-react';

interface HospitalDetailProps {
  hospital: Hospital;
  reviews: Review[];
  currentUser: User | null;
  onBack: () => void;
  onRequestSignIn: () => void;
  onAddReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
}

export const HospitalDetail: React.FC<HospitalDetailProps> = ({
  hospital,
  reviews,
  currentUser,
  onBack,
  onRequestSignIn,
  onAddReview,
}) => {
  const [newRating, setNewRating] = useState<number>(5);
  const [newText, setNewText] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Filter reviews for this hospital
  const hospitalReviews = useMemo(() => {
    return reviews.filter(r => r.hospitalId === hospital.id);
  }, [reviews, hospital.id]);

  // Only show approved reviews unless currentUser is admin
  const visibleReviews = useMemo(() => {
    return hospitalReviews.filter(r => r.status === 'approved' || (r.status !== 'hidden' && (currentUser?.role === 'admin' || r.userEmail === currentUser?.email)));
  }, [hospitalReviews, currentUser]);

  const ratingDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0]; // 5 stars back to 1 star
    let approvedReviews = hospitalReviews.filter(r => r.status === 'approved');
    approvedReviews.forEach(r => {
      const idx = 5 - r.rating;
      if (idx >= 0 && idx < 5) {
        distribution[idx]++;
      }
    });
    return distribution;
  }, [hospitalReviews]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    onAddReview({
      hospitalId: hospital.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      rating: newRating,
      text: newText.trim(),
      status: 'pending',
    });

    setNewText('');
    setNewRating(5);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-fade-in space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-200 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Directory
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${
              hospital.ownership === 'public'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                : 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900'
            }`}>
              {hospital.ownership} Healthcare
            </span>

            {hospital.rating >= 4.5 && (
              <span className="bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Top-Rated
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {hospital.name}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            {hospital.address}, {hospital.city}, LGA {hospital.lga}, {hospital.state} State
          </p>
        </div>

        {/* Rating Block */}
        <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-sm">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-905 dark:text-white font-mono flex items-center justify-end gap-1">
              <Star className="w-4 h-4 fill-amber-450 stroke-amber-450 text-amber-505" />
              {hospital.rating.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              based on {hospital.reviewCount} review(s)
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Core details, visiting rules & notes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Description */}
          <section className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
              About this hospital
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/40 dark:bg-slate-950/20 text-xs leading-relaxed text-slate-700 dark:text-slate-350">
              <MarkdownRenderer content={hospital.description} />
            </div>
          </section>

          {/* Specialties Checklist */}
          <section className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
              Services available
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {hospital.specialties.map(spec => (
                <span
                  key={spec}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-transparent dark:border-slate-700"
                >
                  {spec}
                </span>
              ))}
            </div>
          </section>

          {/* Guidelines notes */}
          {hospital.notes && (
            <section className="space-y-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
                Notes for patients
              </h3>
              <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/10 p-4 rounded text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed flex-1">
                  <MarkdownRenderer content={hospital.notes} />
                </div>
              </div>
            </section>
          )}

          {/* Reviews list index */}
          <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Patient Reviews</span>
              <span className="text-xs font-bold text-slate-400 font-mono">({visibleReviews.length})</span>
            </h3>

            {visibleReviews.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-450">
                No reviews yet. If you have visited this hospital, you can be the first to rate it.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleReviews.map(r => (
                  <div key={r.id} className="border border-slate-200 dark:border-slate-800/60 p-4 rounded bg-white dark:bg-slate-900/50 space-y-2 mt-1 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-909 dark:text-white">{r.userName}</span>
                        {r.status === 'pending' && (
                          <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold bg-amber-50 dark:bg-amber-950/40 border border-amber-205 text-amber-600 rounded">
                            Pending Approval
                          </span>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-205 dark:text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans mt-1">
                      {r.text}
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono text-right">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

         </div>

        {/* Right Column: Contact panels, Quick timings & Submit review panel */}
        <div className="space-y-6">
          
          {/* Action Details Contact Card */}
          <div className="border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-950/30 space-y-4 rounded-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Contact
            </h4>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-start gap-2.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <Phone className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-500" />
                <div>
                  <div className="font-bold text-slate-400 text-[9px] uppercase">Phone</div>
                  <div className="font-mono mt-0.5 text-slate-800 dark:text-white">{hospital.phone}</div>
                </div>
              </a>

              <a
                href={`mailto:${hospital.email}`}
                className="flex items-start gap-2.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <Mail className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-500" />
                <div>
                  <div className="font-bold text-slate-400 text-[9px] uppercase">Email</div>
                  <div className="font-mono mt-0.5 text-slate-800 dark:text-white">{hospital.email}</div>
                </div>
              </a>

              <div className="flex items-start gap-2.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-450 dark:text-slate-400 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-650" />
                    Visiting hours
                  </div>
                  <div className="mt-2 text-xs text-slate-605 dark:text-slate-300">
                    <MarkdownRenderer content={hospital.visitingHours} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating distribution breakdown */}
          <div className="border border-slate-205 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-3.5 shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
              Rating summary
            </h4>
            <div className="space-y-2">
              {ratingDistribution.map((count, i) => {
                const stars = 5 - i;
                const total = Math.max(hospitalReviews.filter(r => r.status === 'approved').length, 1);
                const percent = Math.min((count / total) * 100, 100);
                return (
                  <div key={stars} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                    <span className="w-3 font-mono">{stars}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-amber-450 rounded"
                      />
                    </div>
                    <span className="w-5 text-right font-mono text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Form Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950/20 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
              Rate this hospital
            </h4>

            {reviewSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Review submitted for moderation.
              </div>
            )}

            {!currentUser ? (
              <div className="text-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs space-y-2">
                <p className="text-slate-500 leading-relaxed">
                  Sign in as a citizen to rate this hospital and leave a short review.
                </p>
                <button
                  type="button"
                  onClick={onRequestSignIn}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold"
                >
                  Sign In to Rate
                </button>
              </div>
            ) : currentUser.role === 'admin' ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/10 text-blue-800 dark:text-blue-400 text-xs rounded border border-blue-100 text-center">
                Admins do not post public ratings. You are authorized to moderate reviews through the Registry Console.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Product/Care Rating:
                  </span>
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const ratingVal = i + 1;
                      const active = hoverRating !== null ? ratingVal <= hoverRating : ratingVal <= newRating;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setHoverRating(ratingVal)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setNewRating(ratingVal)}
                          className="p-0.5 focus:outline-hidden cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 transition-all text-amber-500 ${
                              active ? 'fill-amber-500' : 'text-slate-350 dark:text-slate-805'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400">
                    Your review
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. The emergency unit was clean and the nurses attended to us quickly..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Review
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

// Help helper icon to support the layout trigger
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

