import React, { useEffect, useState } from 'react';
import { X, Download, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { submitLead } from '../../api';
import { BRAND } from '../../brand';

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultResource?: string;
}

export function LeadMagnetModal({
  isOpen,
  onClose,
  defaultResource = '2026 High-Society Destination Guide',
}: LeadMagnetModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [resource, setResource] = useState(defaultResource);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResource(defaultResource);
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen, defaultResource]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await submitLead({
        name,
        email,
        vision: `Lead magnet download: ${resource}`,
        planTitle: resource,
        planTagline: 'Planning guide',
      });
      setSubmitted(true);
    } catch {
      setError('Could not submit — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const content = `${BRAND.fullName.toUpperCase()}
========================================
RESOURCE: ${resource}
Prepared for: ${name || 'Valued Guest'} (${email})
Date: ${new Date().toLocaleDateString()}

DESTINATION EVENT PLANNING COMPENDIUM
----------------------------------------
1. European Villa Directory (Lake Como, Ravello, Provence)
2. High-Society Budget Allocation Matrix (Floral, Culinary, Lighting, AV)
3. 100-Point Vendor & Production Countdown Timeline

For questions or to schedule a private consultation:
Email: ${BRAND.email.concierge} | Tel: ${BRAND.phone}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.replace(/\s+/g, '_')}_MeridianAtelier.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/70 md:backdrop-blur-md">
      <div className="bg-champagne border border-navy/10 rounded-t-2xl sm:rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[min(92dvh,40rem)] overflow-y-auto">
        <div className="bg-navy text-champagne px-6 py-6 relative sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-navy/80 text-sage hover:text-champagne transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
            id="lead-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sage font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusive Resource</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-champagne">Download Planning Guide</h3>
          <p className="text-xs text-champagne/70 font-light mt-1">
            Receive our complementary destination & budget kit.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate/70 tracking-wider block">Select Guide:</label>
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                  id="lead-modal-resource-select"
                >
                  <option value="2026 High-Society Destination Guide">2026 High-Society Destination Guide</option>
                  <option value="Bespoke Event Budget & Timeline Kit">Bespoke Event Budget & Timeline Kit</option>
                  <option value="Luxury Venue Selection Matrix">Luxury Venue Selection Matrix</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate/70 tracking-wider block">Your Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage placeholder-slate/40"
                  id="lead-modal-name-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-slate/70 tracking-wider block">Your Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage placeholder-slate/40"
                  id="lead-modal-email-input"
                />
              </div>

              {error && <p className="text-xs text-rose-600 text-center">{error}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-navy text-champagne text-xs uppercase tracking-widest font-semibold hover:bg-sage transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  id="lead-modal-submit-btn"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSubmitting ? 'Preparing Access...' : 'Download Guide Now'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate/70 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                <span>Your information is strictly confidential.</span>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-champagne border border-sage flex items-center justify-center text-sage mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8 text-sage" />
              </div>

              <div>
                <h4 className="font-serif font-semibold text-xl text-navy">Guide Ready!</h4>
                <p className="text-xs text-slate mt-1 font-light">
                  Thank you, <span className="font-medium text-navy">{name || 'Guest'}</span>. Your copy of{' '}
                  <span className="italic font-medium">{resource}</span> is ready below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 rounded-full bg-navy text-champagne text-xs uppercase tracking-widest font-semibold hover:bg-sage transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                id="lead-modal-download-file-btn"
              >
                <Download className="w-4 h-4" />
                <span>Save Guide File</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate/70 hover:text-navy block mx-auto pt-2 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
