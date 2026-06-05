/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { X, Shield, User as UserIcon, LogIn, Key, HelpCircle, CheckCircle } from 'lucide-react';
import { hasSupabaseConfig } from '../lib/env';
import { signIn, signUpPublic } from '../lib/carefinderRepository';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('public');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (hasSupabaseConfig) {
      try {
        if (activeTab === 'register') {
          if (selectedRole === 'admin') {
            setErrorMsg('Admins cannot register publicly. Existing admins must invite new admins.');
            setLoading(false);
            return;
          }
          const user = await signUpPublic(name, email, password);
          onLoginSuccess(user);
          setSuccessMsg('Account registered successfully.');
        } else {
          const user = await signIn(email, password);
          onLoginSuccess(user);
          setSuccessMsg('Successfully logged in.');
        }
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1000);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Authentication failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setTimeout(() => {
      // Direct hardcoded simulation
      if (activeTab === 'login') {
        if (selectedRole === 'admin') {
          if (email === 'admin@carefinder.gov.ng' && password === 'admin123') {
            onLoginSuccess({
              id: 'usr-admin-1',
              name: 'Dr. Chidi Obi (Director)',
              email: 'admin@carefinder.gov.ng',
              role: 'admin',
              createdAt: '2026-01-01T00:00:00Z',
            });
            setSuccessMsg('Logged in as Carefinder Admin!');
            setTimeout(() => {
              setSuccessMsg('');
              onClose();
            }, 1000);
          } else {
            setErrorMsg('Invalid email or password.');
          }
        } else {
          // Public login fallback or default seed
          if (email === 'user@nigeria.ng' && password === 'user123') {
            onLoginSuccess({
              id: 'usr-public-test',
              name: 'Amina Bello Okoye',
              email: 'user@nigeria.ng',
              role: 'public',
              createdAt: '2026-02-01T00:00:00Z',
            });
          } else {
            // Log in as a custom custom user
            onLoginSuccess({
              id: `usr-custom-${Date.now()}`,
              name: email.split('@')[0].toUpperCase(),
              email,
              role: 'public',
              createdAt: new Date().toISOString(),
            });
          }
          setSuccessMsg('Successfully logged in.');
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1000);
        }
      } else {
        // Registering public user
        if (selectedRole === 'admin') {
          setErrorMsg('Admins cannot register publicly. Administrators can only be created by invite-only tools inside the Admin Portal.');
        } else {
          onLoginSuccess({
            id: `usr-${Date.now()}`,
            name: name || email.split('@')[0],
            email,
            role: 'public',
            createdAt: new Date().toISOString(),
          });
          setSuccessMsg('Account registered successfully!');
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1000);
        }
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {activeTab === 'login' ? 'Sign In' : 'Create Citizen Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Selector */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-105 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('public');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              selectedRole === 'public'
                ? 'bg-white dark:bg-slate-800 text-blue-600 border-blue-200 dark:border-slate-705 shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Citizen
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-white dark:bg-slate-800 text-blue-600 border-blue-200 dark:border-slate-705 shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Main Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-150 rounded text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border border-rose-150 rounded text-xs flex items-start gap-2 leading-relaxed">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'register' && selectedRole === 'public' && (
            <div className="space-y-1">
              <label htmlFor="auth-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Amina Bello"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder={selectedRole === 'admin' ? 'admin@carefinder.gov.ng' : 'e.g. citizen@lga.gov.ng'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-905 dark:text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-205 dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-xs rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-905 dark:text-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Please wait...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Tab toggling selection */}
          {selectedRole === 'public' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === 'login' ? 'register' : 'login');
                  setErrorMsg('');
                }}
                className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline inline-block mt-1 font-semibold cursor-pointer"
              >
                {activeTab === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
