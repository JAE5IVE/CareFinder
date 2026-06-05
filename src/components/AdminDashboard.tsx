/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Hospital, Review, User, OwnershipType } from '../types';
import { MarkdownRenderer } from '../utils/markdown';
import { NIGERIA_BOUNDS } from '../utils/distance';
import { hasSupabaseConfig } from '../lib/env';
import { inviteAdmin, uploadHospitalPhoto } from '../lib/carefinderRepository';
import { 
  Building2, Plus, Edit, Trash2, Send, CheckCircle, ShieldAlert, 
  Terminal, ThumbsUp, Trash, AlertTriangle, MessageSquare, ListCollapse, BookOpen, Key
} from 'lucide-react';

interface AdminDashboardProps {
  hospitals: Hospital[];
  reviews: Review[];
  onAddHospital: (h: Omit<Hospital, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) => void;
  onUpdateHospital: (id: string, h: Partial<Hospital>) => void;
  onDeleteHospital: (id: string) => void;
  onUpdateReviewStatus: (id: string, status: 'approved' | 'pending' | 'hidden') => void;
  onDeleteReview: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  hospitals,
  reviews,
  onAddHospital,
  onUpdateHospital,
  onDeleteHospital,
  onUpdateReviewStatus,
  onDeleteReview,
}) => {
  const [activeTab, setActiveTab] = useState<'hospitals' | 'reviews' | 'submissions' | 'settings'>('hospitals');
  
  // Hospital Form States
  const [isEditing, setIsEditing] = useState<string | null>(null); // hospital ID if editing, or 'new' if creating
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLga, setFormLga] = useState('');
  const [formState, setFormState] = useState('Lagos');
  const [formLat, setFormLat] = useState('6.4474');
  const [formLng, setFormLng] = useState('3.4184');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSpecialties, setFormSpecialties] = useState<string[]>(['General Practice']);
  const [formOwnership, setFormOwnership] = useState<OwnershipType>('public');
  const [formPhotoUrls, setFormPhotoUrls] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Markdown fields (for live side-by-side editing previews)
  const [formVisitingHours, setFormVisitingHours] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Admin invitation simulation states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [inviteLogs, setInviteLogs] = useState<string[]>([]);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState('');

  // Available Nigerian specialties to choose from
  const availableSpecialties = [
    'Emergency', 'Maternity', 'Pediatric', 'Dental', 'Cardiology', 
    'Oncology', 'Orthopedics', 'General Practice', 'Gynecology', 'Optometry'
  ];

  // Filters for submissions (public users can submit, they start with 'pending')
  const approvedHospitals = useMemo(() => hospitals.filter(h => h.status === 'approved'), [hospitals]);
  const pendingHospitals = useMemo(() => hospitals.filter(h => h.status === 'pending'), [hospitals]);

  // Handle Form reset
  const resetForm = () => {
    setIsEditing(null);
    setFormName('');
    setFormAddress('');
    setFormCity('');
    setFormLga('');
    setFormState('Lagos');
    setFormLat('6.4474');
    setFormLng('3.4184');
    setFormPhone('');
    setFormEmail('');
    setFormSpecialties(['General Practice']);
    setFormOwnership('public');
    setFormPhotoUrls([]);
    setUploadStatus('');
    setFormDescription('## About patient services...\n\n- Bullet item\n- Standard expert diagnostics.');
    setFormVisitingHours('### Visiting Rules\n- **Weekdays:** 4:00 PM - 6:00 PM');
    setFormNotes('> **Attention Visitors:** Face masks are highly recommended in maternity wards.');
    setValidationErrors([]);
  };

  // Populate form for editing
  const startEdit = (h: Hospital) => {
    setIsEditing(h.id);
    setFormName(h.name);
    setFormAddress(h.address);
    setFormCity(h.city);
    setFormLga(h.lga);
    setFormState(h.state);
    setFormLat(h.latitude.toString());
    setFormLng(h.longitude.toString());
    setFormPhone(h.phone);
    setFormEmail(h.email);
    setFormSpecialties(h.specialties);
    setFormOwnership(h.ownership);
    setFormPhotoUrls(h.photoUrls || []);
    setFormDescription(h.description);
    setFormVisitingHours(h.visitingHours);
    setFormNotes(h.notes);
    setValidationErrors([]);
  };

  const handleSpecialtyToggle = (spec: string) => {
    setFormSpecialties(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  // Validate form fields (Zod-like rigorous coordinate bounding)
  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formName.trim()) errors.push('Hospital Name is required');
    if (!formAddress.trim()) errors.push('Street Address is required');
    if (!formLga.trim()) errors.push('Local Government Area (LGA) is required');
    if (!formPhone.trim()) errors.push('Official phone contact is required');
    
    // Check email with loose regex
    if (formEmail && !/\S+@\S+\.\S+/.test(formEmail)) {
      errors.push('Please provide a valid official email address');
    }

    // Nigerian Coordinate Bounds validations
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);

    if (isNaN(lat) || lat < NIGERIA_BOUNDS.minLat || lat > NIGERIA_BOUNDS.maxLat) {
      errors.push(`Latitude must be a valid number between ${NIGERIA_BOUNDS.minLat}° and ${NIGERIA_BOUNDS.maxLat}° for Nigeria.`);
    }
    if (isNaN(lng) || lng < NIGERIA_BOUNDS.minLng || lng > NIGERIA_BOUNDS.maxLng) {
      errors.push(`Longitude must be a valid number between ${NIGERIA_BOUNDS.minLng}° and ${NIGERIA_BOUNDS.maxLng}° for Nigeria.`);
    }

    if (formSpecialties.length === 0) {
      errors.push('Please select at least one medical specialty.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload = {
      name: formName.trim(),
      address: formAddress.trim(),
      city: formCity.trim() || 'Lagos',
      lga: formLga.trim(),
      state: formState,
      latitude: lat,
      longitude: lng,
      phone: formPhone.trim(),
      email: formEmail.trim() || 'info@carefinder.ng',
      specialties: formSpecialties,
      ownership: formOwnership,
      description: formDescription.trim(),
      visitingHours: formVisitingHours.trim(),
      notes: formNotes.trim(),
      photoUrls: formPhotoUrls,
    };

    if (isEditing === 'new') {
      onAddHospital({
        ...payload,
        status: 'approved', // Direct admin created entries are approved
      });
      setSuccessToast('Facility record created successfully!');
    } else if (isEditing) {
      onUpdateHospital(isEditing, payload);
      setSuccessToast('Facility details updated successfully!');
    }

    resetForm();
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleImageUpload = async (file: File) => {
    if (!hasSupabaseConfig) {
      setUploadStatus('Add Supabase keys before uploading real images.');
      return;
    }
    setUploadStatus('Uploading image...');
    try {
      const url = await uploadHospitalPhoto(file);
      setFormPhotoUrls(prev => [...prev, url]);
      setUploadStatus('Image uploaded.');
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Image upload failed.');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus('sending');

    if (hasSupabaseConfig) {
      setInviteLogs([`EDGE_INVITE: Calling invite-admin for ${inviteEmail}`]);
      try {
        await inviteAdmin(inviteEmail);
        setInviteLogs(prev => [...prev, 'STATUS_CODE: 201 Created']);
        setInviteStatus('success');
      } catch (error) {
        setInviteLogs(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'Invite failed.'}`]);
        setInviteStatus('idle');
      }
      return;
    }

    setInviteLogs([
      `EDGE_INVITE: Directing request to Supabase Auth Invite Edge function...`,
      `API_POST: /v1/auth/invite`,
      `AUTHORIZATION: Authenticated Admin [Token validated via RLS]`
    ]);

    setTimeout(() => {
      setInviteLogs(prev => [
        ...prev,
        `EMAIL_GATEWAY: Dispensing secure sign-up invitation link to candidate staff [${inviteEmail}]`,
        `DB_ROW: Writing profile payload to carefinder_admins with status "invited"`,
        `STATUS_CODE: 201 Created`
      ]);
      setInviteStatus('success');
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
      
      {/* Title Bar Banner */}
      <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
            <BookOpen className="w-5 h-5 text-blue-650" />
            Carefinder Registry Console
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Role-based access containing facility, testimonies, and crowdsourced submissions curations
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded gap-1 shrink-0 flex-wrap">
          <button
            onClick={() => { setActiveTab('hospitals'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'hospitals'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Manage Facilities
          </button>
          <button
            onClick={() => { setActiveTab('reviews'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Moderate Reviews
          </button>
          <button
            onClick={() => { setActiveTab('submissions'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all relative cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Civic Submissions
            {pendingHospitals.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                {pendingHospitals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('settings'); resetForm(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Staff Settings
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold border-b border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* VIEW: HOSPITALS TAB */}
      {activeTab === 'hospitals' && (
        <div className="p-6 space-y-6">
          
          {/* SHOW FORM FOR CREATE/EDIT */}
          {isEditing ? (
            <form onSubmit={handleSaveHospital} className="p-5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50/45 dark:bg-slate-950/20 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {isEditing === 'new' ? 'Seeding New Nigerian Facility' : 'Editing Facility Details'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-705 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded text-xs text-rose-805 space-y-1">
                  <p className="font-bold">Form Submission Blocked:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Grid block info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos University Teaching Hospital"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ownership Tier</label>
                  <select
                    value={formOwnership}
                    onChange={(e) => setFormOwnership(e.target.value as OwnershipType)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded cursor-pointer"
                  >
                    <option value="public">Public (Government Subsidized)</option>
                    <option value="private">Private (HMO & Corporate)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 17B Bourdillon Road"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Ikoyi or Idi-Araba"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Government Area (LGA)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eti-Osa or Surulere"
                    value={formLga}
                    onChange={(e) => setFormLga(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nigerian State</label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded cursor-pointer"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja (FCT)">Abuja (FCT)</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Enugu">Enugu</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map Pin Latitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6.4474 (Nigeria Bounds)"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map Pin Longitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3.4184"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +234 1 271 2000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Clinical Email</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@luth.org.ng"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-2 text-xs rounded"
                  />
                  {uploadStatus && <p className="text-[10px] text-slate-500">{uploadStatus}</p>}
                  {formPhotoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formPhotoUrls.map((url) => (
                        <img key={url} src={url} alt="Hospital upload preview" className="w-14 h-14 object-cover rounded border border-slate-200" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Specialties checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certified Specialties</span>
                <div className="flex flex-wrap gap-1.5">
                  {availableSpecialties.map(spec => {
                    const active = formSpecialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleSpecialtyToggle(spec)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-transparent shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-700'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SIDE-BY-SIDE MARKDOWN LIVE EDIT PREVIEWS */}
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Split-Screen Live Markdown Panels (React-MD-Editor Mock)
                </span>

                {/* Description Markdown block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description Raw Markdown</label>
                    <div data-color-mode="light">
                      <MDEditor
                        value={formDescription}
                        onChange={(value) => setFormDescription(value || '')}
                        preview="edit"
                        height={170}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Description Live HTML Render</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-850 px-4 py-3 bg-white dark:bg-slate-900 rounded-lg max-h-36 overflow-y-auto">
                      <MarkdownRenderer content={formDescription} />
                    </div>
                  </div>
                </div>

                {/* Visiting Hours markdown block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visiting Hours Raw Markdown</label>
                    <div data-color-mode="light">
                      <MDEditor
                        value={formVisitingHours}
                        onChange={(value) => setFormVisitingHours(value || '')}
                        preview="edit"
                        height={130}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">Visiting Hours Live HTML Render</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-855 px-4 py-3 bg-white dark:bg-slate-900 rounded-lg max-h-24 overflow-y-auto">
                      <MarkdownRenderer content={formVisitingHours} />
                    </div>
                  </div>
                </div>

                {/* Advisories raw markdown block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advisories / Notes Raw Markdown</label>
                    <div data-color-mode="light">
                      <MDEditor
                        value={formNotes}
                        onChange={(value) => setFormNotes(value || '')}
                        preview="edit"
                        height={130}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">Advisories Live HTML Render</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-855 px-4 py-3 bg-white dark:bg-slate-900 rounded-lg max-h-24 overflow-y-auto">
                      <MarkdownRenderer content={formNotes} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-650 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isEditing === 'new' ? 'Publish Facility Card' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // NORMAL TABLE DISPLAY OF REGISTERED ENTRIES
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Approved Clinical Records ({approvedHospitals.length})
                </h4>
                <button
                  onClick={() => setIsEditing('new')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Hospital
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-905 font-bold text-slate-505">
                    <tr>
                      <th className="p-3.5">Facility Name</th>
                      <th className="p-3.5">Zone & State</th>
                      <th className="p-3.5">Contact Item</th>
                      <th className="p-3.5">Rating (Reviews)</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {approvedHospitals.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${h.ownership === 'public' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            {h.name}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-450 font-semibold">
                          {h.city}, {h.lga} LGA ({h.state})
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {h.phone}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-500">
                          ★ {h.rating.toFixed(1)} ({h.reviewCount})
                        </td>
                        <td className="p-3.5 text-right flex justify-end gap-1 px-3.5.5">
                          <button
                            onClick={() => startEdit(h)}
                            className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you absolutely sure you want to delete this hospital entry? This cannot be undone.')) {
                                onDeleteHospital(h.id);
                              }
                            }}
                            className="p-1 px-2 text-rose-600 hover:bg-rose-50 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: REVIEWS MODERATION TAB */}
      {activeTab === 'reviews' && (
        <div className="p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Validate Witness testimonies & Patient Case Logs
          </h4>

          <div className="border border-slate-205 dark:border-slate-850 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-505 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="p-3.5">Review Author</th>
                  <th className="p-3.5">Facility Target</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5 w-1/3">Testimony Comment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {reviews.map(r => {
                  const targetHosp = hospitals.find(h => h.id === r.hospitalId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-905 dark:text-white">{r.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.userEmail}</div>
                      </td>
                      <td className="p-3.5 font-bold text-blue-600">
                        {targetHosp ? targetHosp.name : 'Unknown facility'}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-amber-500">
                        ★ {r.rating}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 italic text-xs leading-relaxed">
                        "{r.text}"
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          r.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'hidden'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        {r.status === 'pending' ? (
                          <button
                            onClick={() => onUpdateReviewStatus(r.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Approve/Show
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateReviewStatus(r.id, 'hidden')}
                            className="px-2.5 py-1 bg-slate-150 text-slate-705 hover:bg-slate-200 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteReview(r.id)}
                          className="p-1 px-2 text-rose-600 hover:bg-rose-50 rounded inline-block align-middle cursor-pointer"
                          title="Delete Permanent"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-405">
                      No citizen reviews found in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CIVIC SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-955/20 text-blue-900 dark:text-blue-300 rounded-xl border border-blue-150 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Crowdsourced Curation Sandbox Queue</p>
              <p className="leading-relaxed">
                When public users submit new hospitals using the "Propose Facility" drawer, they land here with status "pending". Registry Administrators can review coordinating bounds, verify specialties, and publish them with a single click.
              </p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
            Civic Proposals Pending Validation ({pendingHospitals.length})
          </h4>

          <div className="border border-slate-205 dark:border-slate-850 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-505 border-b border-slate-200 dark:border-slate-855">
                <tr>
                  <th className="p-3.5">Proposed Facility</th>
                  <th className="p-3.5">Coordinates (Lat, Lng)</th>
                  <th className="p-3.5">LGA (State)</th>
                  <th className="p-3.5">Contact Line</th>
                  <th className="p-3.5">Specialties</th>
                  <th className="p-3.5 text-right">Curation Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
                {pendingHospitals.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{h.address}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {h.latitude.toFixed(4)}°N, {h.longitude.toFixed(4)}°E
                    </td>
                    <td className="p-3.5">
                      {h.lga} LGA ({h.state})
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {h.phone}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {h.specialties.map(spec => (
                          <span key={spec} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-605 dark:text-slate-400 rounded text-[9px]">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          onUpdateHospital(h.id, { status: 'approved' });
                          setSuccessToast(`Crowdsourced record [${h.name}] successfully published!`);
                          setTimeout(() => setSuccessToast(''), 3000);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => onDeleteHospital(h.id)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingHospitals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      Clean Queue. No pending crowdsourced facilities need evaluation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: STAFF SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Edge Function Invites Card */}
          <div className="border border-slate-205 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600" />
              Invite New Staff Administrators (Edge Function)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No public sign-ups are allowed for Administrative privileges. You must configure invites here. This calls a mock Supabase Edge Function to safely provision users on the database.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Candidate Staff Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nurse-executive@carefinder.gov.ng"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-3 py-2 text-xs rounded-lg focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={!inviteEmail || inviteStatus === 'sending'}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded cursor-pointer"
              >
                {inviteStatus === 'sending' ? 'Executing Edge Task...' : 'Dispense Invitation Email'}
              </button>
            </form>

            {inviteStatus === 'success' && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-150">
                Invitation sent to <b>{inviteEmail}</b>. Check the API logs below for details.
              </div>
            )}
          </div>

          {/* Edge Execution Logs console */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden font-mono text-[9px] flex flex-col max-h-[280px]">
            <div className="bg-slate-900 text-slate-450 px-3 py-2 flex items-center gap-1.5 border-b border-slate-950">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Edge function: carefinder-invite-handler logs</span>
            </div>
            <div className="bg-slate-950 text-emerald-400 p-4 space-y-1 overflow-y-auto flex-1 leading-relaxed">
              {inviteLogs.length === 0 ? (
                <div className="text-slate-500 italic">No instructions run. Waiting for trigger...</div>
              ) : (
                inviteLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith('STATUS') ? 'text-emerald-300 font-bold' : log.startsWith('EMAIL') ? 'text-sky-305' : 'text-slate-550'}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
