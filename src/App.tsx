/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Hospital, Review, SearchFilters, User } from './types';
import { SEEDED_HOSPITALS, SEEDED_REVIEWS } from './data/hospitals';
import { calculateDistance, DEFAULT_NIGERIA_COORDS } from './utils/distance';
import { filterHospitals, HospitalSort, sortHospitals } from './utils/search';
import { MapContainer } from './components/MapContainer';
import { CSVExportModal } from './components/CSVExportModal';
import { ShareModal } from './components/ShareModal';
import { AuthModal } from './components/AuthModal';
import { HospitalDetail } from './components/HospitalDetail';
import { AdminDashboard } from './components/AdminDashboard';
import { hasSupabaseConfig } from './lib/env';
import {
  createHospital,
  createReview,
  deleteHospital,
  deleteReview,
  getCurrentUser,
  listHospitals,
  listReviews,
  signOut,
  updateHospital,
  updateReviewStatus,
} from './lib/carefinderRepository';

import {
  Sparkles,
  Building,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Share2,
  LogIn,
  LogOut,
  Shield,
  Star,
  MapPin,
  PlusCircle,
  X,
  RefreshCw,
  Sliders,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';

export default function App() {
  // ----- PERSISTENT STATE LIFECYCLE -----
  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const cached = localStorage.getItem('carefinder_hospitals');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached hospitals:', e);
      }
    }
    return SEEDED_HOSPITALS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = localStorage.getItem('carefinder_reviews');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached reviews:', e);
      }
    }
    return SEEDED_REVIEWS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('carefinder_current_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached user:', e);
      }
    }
    return null; // Start unauthenticated
  });

  const [backendStatus, setBackendStatus] = useState(hasSupabaseConfig ? 'Connecting to Carefinder records...' : 'Local sample data is active.');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('carefinder_theme') === 'dark');

  // Save states to localStorage on modifications
  useEffect(() => {
    localStorage.setItem('carefinder_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem('carefinder_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('carefinder_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('carefinder_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('carefinder_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let isMounted = true;

    async function hydrateFromSupabase() {
      try {
        const remoteHospitals = await listHospitals();
        if (!isMounted) return;
        setHospitals(remoteHospitals.length ? remoteHospitals : SEEDED_HOSPITALS);
        setBackendStatus('Connected to live Carefinder records.');

        const [reviewsResult, userResult] = await Promise.allSettled([
          listReviews(),
          getCurrentUser(),
        ]);
        if (!isMounted) return;
        if (reviewsResult.status === 'fulfilled' && reviewsResult.value.length) {
          setReviews(reviewsResult.value);
        }
        if (userResult.status === 'fulfilled') {
          setCurrentUser(userResult.value);
        }
      } catch (error) {
        console.error('Supabase hydration failed:', error);
        if (isMounted) setBackendStatus('Could not load live records. Showing local sample data.');
      }
    }

    hydrateFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // ----- MODALS & SELECTIONS -----
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'directory' | 'admin'>('directory');

  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareHospitalId, setShareHospitalId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProposeOpen, setIsProposeOpen] = useState(false); // Propose care facility side drawer

  // ----- SEARCH & FILTERS ENGINE -----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'public' | 'private'>('all');
  const [visibleResultCount, setVisibleResultCount] = useState(50);
  const [radiusFilter, setRadiusFilter] = useState<number>(0); // 0 = disabled

  // User position tracking (default Lagos)
  const [userLat, setUserLat] = useState<number | null>(DEFAULT_NIGERIA_COORDS.latitude);
  const [userLng, setUserLng] = useState<number | null>(DEFAULT_NIGERIA_COORDS.longitude);

  const [sortBy, setSortBy] = useState<HospitalSort>('distance');

  // Load URL-encoded share parameters on mount (Fulfills exact reproduction criteria)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('query') || params.get('city') || params.get('q');
    const specParam = params.get('specialty') || params.get('specialties');
    const ownerParam = params.get('ownership');
    const radiusParam = params.get('radius');
    const latParam = params.get('lat');
    const lngParam = params.get('lng');

    if (queryParam) setSearchQuery(queryParam);
    if (specParam) setSelectedSpecialties(specParam.split(','));
    if (ownerParam === 'public' || ownerParam === 'private') setOwnershipFilter(ownerParam);
    if (radiusParam) {
      const parsedR = parseInt(radiusParam, 10);
      if (!isNaN(parsedR)) setRadiusFilter(parsedR);
    }
    if (latParam && lngParam) {
      const parsedLat = parseFloat(latParam);
      const parsedLng = parseFloat(lngParam);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setUserLat(parsedLat);
        setUserLng(parsedLng);
      }
    }
  }, []);

  // Sync Geolocation permission automatically on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Gently populate coords if none was forced via shareable links
          const params = new URLSearchParams(window.location.search);
          if (!params.get('lat')) {
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
          }
        },
        () => undefined
      );
    }
  }, []);

  // Recalculate average ratings and counts based on live reviews state
  const validatedHospitals = useMemo(() => {
    return hospitals.map(h => {
      const hospReviews = reviews.filter(r => r.hospitalId === h.id && r.status === 'approved');
      if (hospReviews.length === 0) {
        return h; // Return seeded baseline if no reviews
      }
      const totalRating = hospReviews.reduce((sum, r) => sum + r.rating, 0);
      return {
        ...h,
        rating: Number((totalRating / hospReviews.length).toFixed(1)),
        reviewCount: hospReviews.length,
      };
    });
  }, [hospitals, reviews]);

  // Filtering pipelines
  const filteredHospitals = useMemo(() => {
    return filterHospitals(validatedHospitals, {
      searchQuery,
      specialties: selectedSpecialties,
      ownership: ownershipFilter,
      radius: radiusFilter,
      userLat,
      userLng,
    });
  }, [validatedHospitals, searchQuery, selectedSpecialties, ownershipFilter, radiusFilter, userLat, userLng]);

  // Dynamic sorting
  const sortedHospitals = useMemo(() => {
    // We only display 'approved' status hospitals in directory list, 'pending' go to admin review portal
    const approvedOnly = filteredHospitals.filter(h => h.status === 'approved');
    
    return sortHospitals(approvedOnly, sortBy, userLat, userLng);
  }, [filteredHospitals, sortBy, userLat, userLng]);

  useEffect(() => {
    setVisibleResultCount(50);
  }, [searchQuery, selectedSpecialties, ownershipFilter, radiusFilter, sortBy]);

  const visibleHospitals = sortedHospitals.slice(0, visibleResultCount);

  // Propose Facility input states (Civic Crowdsourcing)
  const [proposeName, setProposeName] = useState('');
  const [proposeAddress, setProposeAddress] = useState('');
  const [proposeLga, setProposeLga] = useState('');
  const [proposeState, setProposeState] = useState('Lagos');
  const [proposePhone, setProposePhone] = useState('');
  const [proposeSpecialties, setProposeSpecialties] = useState<string[]>(['General Practice']);
  const [proposeOwnership, setProposeOwnership] = useState<Hospital['ownership']>('public');
  const [proposeSuccess, setProposeSuccess] = useState(false);

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeName.trim() || !proposeAddress.trim() || !proposeLga.trim()) return;

    // Simulate placing within currently selected coordinates margin or random Lagos center offset
    const randomOffsetLat = (Math.random() - 0.5) * 0.06;
    const randomOffsetLng = (Math.random() - 0.5) * 0.06;
    const baseLat = userLat || DEFAULT_NIGERIA_COORDS.latitude;
    const baseLng = userLng || DEFAULT_NIGERIA_COORDS.longitude;

    const newProposal: Hospital = {
      id: `hosp-proposal-${Date.now()}`,
      name: proposeName.trim(),
      address: proposeAddress.trim(),
      city: 'Lagos Island',
      lga: proposeLga.trim(),
      state: proposeState,
      latitude: Number((baseLat + randomOffsetLat).toFixed(5)),
      longitude: Number((baseLng + randomOffsetLng).toFixed(5)),
      phone: proposePhone.trim() || '+234 800 CIVILIAN',
      email: 'props@carefinder.ng',
      specialties: proposeSpecialties,
      ownership: proposeOwnership,
      visitingHours: '### General Hours\n- Morning: 10AM - 1PM\n- Afternoon: 4PM - 6PM',
      description: '## Public Proposal\nSubmitted via Civic Carefinder dashboard. Awaiting registrar credentials approval.',
      notes: '> **Under review:** Submitter requested verify emergency infrastructure.',
      rating: 4.0,
      reviewCount: 0,
      status: 'pending', // Pending Admin moderation!
      createdAt: new Date().toISOString(),
    };

    setHospitals(prev => [newProposal, ...prev]);
    setProposeSuccess(true);
    
    // reset form fields
    setProposeName('');
    setProposeAddress('');
    setProposeLga('');
    setTimeout(() => {
      setProposeSuccess(false);
      setIsProposeOpen(false);
    }, 1800);
  };

  const handleRestartSeeds = () => {
    if (window.confirm('Reset local records back to the starter hospitals? This clears local changes.')) {
      localStorage.removeItem('carefinder_hospitals');
      localStorage.removeItem('carefinder_reviews');
      setHospitals(SEEDED_HOSPITALS);
      setReviews(SEEDED_REVIEWS);
      setSelectedHospitalId(null);
      setActiveView('directory');
    }
  };

  // ----- SUB-HANDLERS -----
  const handleAddReview = (newRevData: Omit<Review, 'id' | 'createdAt'>) => {
    if (hasSupabaseConfig) {
      createReview(newRevData)
        .then((newRev) => setReviews(prev => [newRev, ...prev]))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    const newRev: Review = {
      ...newRevData,
      id: `rev-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReviews(prev => [newRev, ...prev]);
  };

  const handleAddHospital = (newHospData: Omit<Hospital, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) => {
    if (hasSupabaseConfig) {
      createHospital(newHospData)
        .then((newHosp) => setHospitals(prev => [newHosp, ...prev]))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    const newHosp: Hospital = {
      ...newHospData,
      id: `hosp-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    setHospitals(prev => [newHosp, ...prev]);
  };

  const handleUpdateHospital = (id: string, updatedFields: Partial<Hospital>) => {
    if (hasSupabaseConfig) {
      updateHospital(id, updatedFields)
        .then(() => setHospitals(prev => prev.map(h => h.id === id ? { ...h, ...updatedFields } : h)))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    setHospitals(prev => prev.map(h => h.id === id ? { ...h, ...updatedFields } : h));
  };

  const handleDeleteHospital = (id: string) => {
    if (hasSupabaseConfig) {
      deleteHospital(id)
        .then(() => setHospitals(prev => prev.filter(h => h.id !== id)))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    setHospitals(prev => prev.filter(h => h.id !== id));
    if (selectedHospitalId === id) setSelectedHospitalId(null);
  };

  const handleUpdateReviewStatus = (id: string, status: 'approved' | 'pending' | 'hidden') => {
    if (hasSupabaseConfig) {
      updateReviewStatus(id, status)
        .then(() => setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r)))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleDeleteReview = (id: string) => {
    if (hasSupabaseConfig) {
      deleteReview(id)
        .then(() => setReviews(prev => prev.filter(r => r.id !== id)))
        .catch((error) => setBackendStatus(error.message));
      return;
    }
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleLogOut = () => {
    signOut().catch(() => undefined);
    setCurrentUser(null);
    localStorage.removeItem('carefinder_current_user');
    setActiveView('directory');
  };

  const openShareModal = (hospitalId?: string) => {
    setShareHospitalId(hospitalId || null);
    setIsShareModalOpen(true);
  };

  // List of unique LGA suggestions to show as clicks in Lagos
  const lgaSuggestions = ['Surulere', 'Eti-Osa', 'Kosofe', 'Mainland', 'Municipal'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-105 dark:bg-slate-950 dark:text-slate-100 pb-12 transition-colors">
      
      {/* GLOBAL NAVBAR BANNER */}
      <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-250 dark:border-slate-800 shadow-sm" id="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
          
          {/* Logo Brand */}
          <div 
            onClick={() => { setSelectedHospitalId(null); setActiveView('directory'); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-700 shadow-md shadow-teal-700/20 group-hover:scale-105 transition-all flex items-center justify-center overflow-hidden">
              <img src="/favicon.svg" alt="" className="h-10 w-10" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Carefinder <b className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 rounded">NIGERIA</b>
              </span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Find trusted hospitals near you</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {hospitals.filter(h => h.ownership === 'public').length} Public hospitals
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {hospitals.filter(h => h.ownership === 'private').length} Private hospitals
            </span>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-300"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                    {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-600" />}
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-widest">
                    {currentUser.role === 'admin' ? 'admin' : 'citizen'}
                  </span>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveView(activeView === 'admin' ? 'directory' : 'admin')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-400 rounded-lg transition-all border border-blue-100 dark:border-blue-950"
                  >
                    {activeView === 'admin' ? 'Back to Search' : 'Admin Dashboard'}
                  </button>
                )}

                <button
                  onClick={handleLogOut}
                  className="p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-950/30"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-slate-900 border border-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* ADMIN CONSOLE VIEW PORTAL */}
      {activeView === 'admin' && currentUser?.role === 'admin' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="mb-4">
            <button
              onClick={() => setActiveView('directory')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              ← Back to Carefinder Map & List Directory
            </button>
          </div>
          <AdminDashboard
            hospitals={hospitals}
            reviews={reviews}
            backendStatus={backendStatus}
            onRestartSeeds={handleRestartSeeds}
            onAddHospital={handleAddHospital}
            onUpdateHospital={handleUpdateHospital}
            onDeleteHospital={handleDeleteHospital}
            onUpdateReviewStatus={handleUpdateReviewStatus}
            onDeleteReview={handleDeleteReview}
          />
        </div>
      ) : selectedHospitalId ? (
        /* FACILITY DETAILS PAGE VIEW OVERLAYAL */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1">
          {(() => {
            const h = hospitals.find(x => x.id === selectedHospitalId);
            if (!h) {
              setSelectedHospitalId(null);
              return null;
            }
            return (
              <HospitalDetail
                hospital={h}
                reviews={reviews}
                currentUser={currentUser}
                onBack={() => setSelectedHospitalId(null)}
                onRequestSignIn={() => setIsAuthModalOpen(true)}
                onAddReview={handleAddReview}
              />
            );
          })()}
        </div>
      ) : (
        /* STANDARD DOCK COMBINATION: GEO-MAP + SEARCH FILTERS + SORTABLE LIST VIEW */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* LEFT 5 COLUMNS: RIGOROUS MULTI-SEARCH FILTERS ENGINE */}
          <section className="lg:col-span-5 space-y-6">
                        {/* Filter controls box container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  Search hospitals
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecialties([]);
                    setOwnershipFilter('all');
                    setRadiusFilter(0);
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Main search text field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Hospital name, city or LGA
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Reddington, Ikoyi, or Surulere"
                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3.5 py-2 pl-10 text-xs rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick suggestion LGA tabs */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Quick areas</label>
                <div className="flex flex-wrap gap-1">
                  {lgaSuggestions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                        searchQuery.toLowerCase() === tag.toLowerCase()
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ownership categories */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Ownership
                </label>
                <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-transparent dark:border-slate-850">
                  {(['all', 'public', 'private'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setOwnershipFilter(option)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded uppercase tracking-wider text-center transition-all ${
                        ownershipFilter === option
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm'
                          : 'text-slate-450 hover:text-slate-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialties Multi Checkboxes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Medical services
                </label>
                <div className="grid grid-cols-2 gap-2 border border-slate-100 dark:border-slate-800 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {['Emergency', 'Maternity', 'Pediatric', 'Dental', 'Cardiology', 'Oncology', 'Orthopedics', 'General Practice'].map(spec => {
                    const active = selectedSpecialties.includes(spec);
                    return (
                      <label
                        key={spec}
                        className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg"
                      >
                        <input
                           type="checkbox"
                          checked={active}
                          onChange={() => {
                            setSelectedSpecialties(prev =>
                              prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
                            );
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{spec}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Civic drawer proposal and CSV options */}
              <div className="flex justify-between items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex-wrap">
                <button
                  onClick={() => setIsProposeOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  <PlusCircle className="w-4 h-4" />
                  Suggest a Hospital
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCSVModalOpen(true)}
                    className="p-1.5 border border-blue-105 hover:bg-blue-50 rounded text-blue-600 dark:border-blue-900 dark:hover:bg-blue-950/30 dark:text-blue-400 flex items-center gap-1 text-[11px] font-bold"
                    title="Download hospital list"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => openShareModal()}
                    className="p-1.5 border border-blue-105 hover:bg-blue-50 rounded text-blue-600 dark:border-blue-900 dark:hover:bg-blue-950/30 dark:text-blue-400 flex items-center gap-1 text-[11px] font-bold"
                    title="Share hospital list"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>

            </div>

            {/* Georeference Spatial Radius Visualizer Mapping panel */}
            <MapContainer
              hospitals={sortedHospitals.slice(0, 250)}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={setSelectedHospitalId}
              userLat={userLat}
              userLng={userLng}
              radius={radiusFilter}
              onUpdateUserCoords={(lat, lng) => {
                setUserLat(lat);
                setUserLng(lng);
              }}
              onUpdateRadius={setRadiusFilter}
            />
          </section>          {/* RIGHT 7 COLUMNS: ACTIVE DIRECTORIES LIST VIEW */}
          <section className="lg:col-span-7 space-y-4">
            
            {/* Sort toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Matching Hospitals ({sortedHospitals.length})
                </span>
                {radiusFilter > 0 && userLat && (
                  <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                    Showing hospitals within {radiusFilter} km
                  </p>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-450" />
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as HospitalSort)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] p-1.5 px-2.5 rounded-lg font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="distance">Closest to me</option>
                  <option value="rating">Highest rated</option>
                  <option value="name">A-Z name</option>
                </select>
              </div>
            </div>

            {/* Results cards dynamic grid listing */}
            <div className="space-y-3 max-h-[1050px] overflow-y-auto pr-1">
              {visibleHospitals.map(h => {
                const distance = userLat && userLng ? calculateDistance(userLat, userLng, h.latitude, h.longitude) : null;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 p-5 rounded-xl cursor-pointer shadow-sm transition-all hover:scale-[1.005] duration-200 group flex flex-col md:flex-row gap-4"
                  >
                    
                    {/* Specialty tags card column */}
                    <div className="flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest font-extrabold rounded-md ${
                          h.ownership === 'public'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400'
                            : h.ownership === 'private'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {h.ownership}
                        </span>
                        
                        {h.rating >= 4.5 && (
                          <span className="px-2 py-0.5 text-[9.5px] font-bold bg-amber-50 text-amber-700 rounded-md flex items-center gap-1">
                            ★ Top-Rated
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {h.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {h.address}, {h.city} ({h.lga} LGA)
                        </p>
                      </div>

                      {/* Snippet specialties */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {h.specialties.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded font-semibold">
                            {s}
                          </span>
                        ))}
                        {h.specialties.length > 3 && (
                          <span className="text-[9.5px] text-slate-400 font-semibold self-center pl-1">
                            +{h.specialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Numeric and metric visual badges column */}
                    <div className="flex md:flex-col justify-between items-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-slate-100 md:border-l dark:border-slate-850 md:pl-4 space-y-1">
                      
                      {/* Metric distance coordinates */}
                      {distance !== null && (
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Distance</span>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                            {distance} km away
                          </p>
                        </div>
                      )}

                      {/* Cumulative aggregate ratings */}
                      <div className="text-right flex items-center gap-1.5 bg-amber-50/50 p-1.5 px-3 rounded-lg border border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/30">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-800 dark:text-amber-400 font-mono leading-none">{h.rating.toFixed(1)}</div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-none mt-1 font-semibold">({h.reviewCount}) reviews</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospitalId(h.id);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                        >
                          View / Rate
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareModal(h.id);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Share
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}

              {visibleHospitals.length < sortedHospitals.length && (
                <button
                  type="button"
                  onClick={() => setVisibleResultCount(count => count + 50)}
                  className="w-full py-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 rounded-lg"
                >
                  Show 50 more hospitals
                </button>
              )}

              {sortedHospitals.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-4 shadow-sm">
                  <AlertCircle className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No facilities match these filters</p>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                    Try another hospital name, clear some filters, or increase the distance range.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialties([]);
                      setOwnershipFilter('all');
                      setRadiusFilter(0);
                    }}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

          </section>

        </main>
      )}
          {/* CIVIL CROWDSOURCING PROPOSE DRAWER / SLIDEOUT SHEET PANEL */}
      {isProposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between animate-slide-left border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  Suggest a Hospital
                </h3>
                <button
                  onClick={() => setIsProposeOpen(false)}
                  className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {proposeSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg space-y-1.5 animate-pulse text-xs">
                  <h4 className="font-bold">Crowdsourced Entry Received!</h4>
                  <p className="text-[11px] leading-relaxed">
                    Thank you. Your suggestion has been sent for review before it appears publicly.
                  </p>
                </div>
              ) : (
                <form id="propose-form" onSubmit={handleProposeSubmit} className="space-y-3.5">
                  <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 text-blue-900 dark:text-blue-300 rounded text-xs leading-relaxed">
                    Add the details you know. An admin will check it before publishing.
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-450">Hospital name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Surulere Community Care"
                      value={proposeName}
                      onChange={(e) => setProposeName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-450">Street address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 56 Ishaga Road"
                      value={proposeAddress}
                      onChange={(e) => setProposeAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-450">LGA</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Surulere or Eti-Osa"
                      value={proposeLga}
                      onChange={(e) => setProposeLga(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-450">Ownership</label>
                    <select
                      value={proposeOwnership}
                      onChange={(e) => setProposeOwnership(e.target.value as Hospital['ownership'])}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded text-slate-800 dark:text-slate-200"
                    >
                      <option value="public">Public hospital</option>
                      <option value="private">Private hospital</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-450">Phone number</label>
                    <input
                      type="text"
                      placeholder="e.g. +234 803 111 2222"
                      value={proposePhone}
                      onChange={(e) => setProposePhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-450">Services offered</span>
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded max-h-24 overflow-y-auto">
                      {['Emergency', 'Maternity', 'Pediatric', 'Dental', 'General Practice'].map(spec => {
                        const active = proposeSpecialties.includes(spec);
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => {
                              setProposeSpecialties(prev =>
                                prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
                              );
                            }}
                            className={`p-1.5 text-[10px] font-semibold border rounded text-left transition-colors ${
                              active ? 'bg-blue-600 border-transparent text-white' : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {!proposeSuccess && (
              <div className="border-t border-slate-100 dark:border-slate-800 pr-0 pt-4 flex gap-2">
                <button
                  onClick={() => setIsProposeOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  form="propose-form"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                >
                  Send suggestion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAILED MODAL PORTALS CONTAINER LIST */}
      <CSVExportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        hospitals={sortedHospitals}
        searchQuery={searchQuery}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        filters={{ searchQuery, specialties: selectedSpecialties, ownership: ownershipFilter, radius: radiusFilter, userLat, userLng }}
        hospitals={sortedHospitals}
        initialHospitalId={shareHospitalId}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={setCurrentUser}
      />

    </div>
  );
}

