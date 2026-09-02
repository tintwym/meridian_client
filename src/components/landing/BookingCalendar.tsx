import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, MapPin, CheckCircle, Sparkles, Download, ArrowRight, Video, Building, Map } from 'lucide-react';
import { TimeSlot } from '../../landingTypes';
import { submitLead } from '../../api';
import { BRAND } from '../../brand';

interface BookingCalendarProps {
  onBookingSuccess?: (bookingRef: string) => void;
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 't1', time: '10:00 AM EST', period: 'morning', available: true },
  { id: 't2', time: '11:30 AM EST', period: 'morning', available: true },
  { id: 't3', time: '02:00 PM EST', period: 'afternoon', available: true },
  { id: 't4', time: '03:30 PM EST', period: 'afternoon', available: false },
  { id: 't5', time: '05:00 PM EST', period: 'evening', available: true }
];

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ onBookingSuccess }) => {
  // Date Picker State: Default to next week
  const today = new Date();
  const defaultDateStr = new Date(today.setDate(today.getDate() + 5)).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM EST');
  const [consultationType, setConsultationType] = useState<'Virtual Zoom' | 'In-Person Studio' | 'On-Site Venue'>('Virtual Zoom');
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventType: 'Weddings',
    guestCount: 150,
    budgetRange: '$75,000 - $150,000',
    eventLocation: 'Napa Valley, CA',
    specialRequests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientEmail) return;

    setBookingError(null);
    setIsSubmitting(true);
    const bookingRef = `MERIDIAN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await submitLead({
        name: formData.clientName,
        email: formData.clientEmail,
        phone: formData.clientPhone || undefined,
        location: formData.eventLocation,
        date: selectedDate,
        budget: formData.budgetRange,
        vision: [
          `Consultation booking (${bookingRef})`,
          `Type: ${consultationType}`,
          `Slot: ${selectedTime}`,
          `Event: ${formData.eventType}, ~${formData.guestCount} guests`,
          formData.specialRequests ? `Notes: ${formData.specialRequests}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        planTitle: 'Consultation request',
        planTagline: consultationType,
      });
      setConfirmedRef(bookingRef);
      onBookingSuccess?.(bookingRef);
    } catch (err) {
      console.error('Booking submit failed:', err);
      setBookingError('Could not submit your request. Please try again or email concierge@meridianatelier.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadICS = () => {
    if (!confirmedRef) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Meridian Atelier//Consultation//EN
BEGIN:VEVENT
SUMMARY:Meridian Atelier Luxury Event Consultation (${confirmedRef})
DESCRIPTION:Private strategy session with ${BRAND.fullName}. Format: ${consultationType}. Contact ${BRAND.email.concierge}.
LOCATION:${consultationType === 'Virtual Zoom' ? 'Zoom Video Call Link' : formData.eventLocation}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MeridianAtelier_Consultation_${confirmedRef}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="booking" className="relative overflow-hidden border-b border-ink/8 bg-paper py-20 text-ink md:py-24">
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
          <p className="font-app-sans text-[11px] font-semibold tracking-[0.22em] text-atlantic uppercase">
            Booking
          </p>
          <h2 className="font-app-display text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
            Book a strategy call
          </h2>
          <p className="font-app-sans text-base leading-relaxed text-ink/55">
            A 45-minute session to map venues, timeline, and budget for your Singapore or destination celebration.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-10 md:p-12">
          
          {!confirmedRef ? (
            <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Date & Slot Picker */}
              <div className="lg:col-span-5 space-y-6">
                
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate/70 block mb-2">
                    1. Choose Consultation Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-3.5 rounded-2xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage shadow-inner font-mono cursor-pointer"
                    id="booking-date-picker"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate/70 block mb-2">
                    2. Select Preferred Time Slot:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DEFAULT_TIME_SLOTS.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`px-3.5 py-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                            !slot.available
                              ? 'opacity-40 bg-navy/8 text-champagne/50 cursor-not-allowed border-navy/10'
                              : isSelected
                              ? 'bg-navy text-champagne border-navy shadow-sm'
                              : 'bg-champagne text-navy border-navy/10 hover:border-sage'
                          }`}
                          id={`booking-slot-${slot.id}`}
                        >
                          <span>{slot.time}</span>
                          {isSelected && <Sparkles className="w-3 h-3 text-sage" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consultation Format Options */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate/70 block mb-2">
                    3. Consultation Format:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'Virtual Zoom', icon: Video },
                      { type: 'In-Person Studio', icon: Building },
                      { type: 'On-Site Venue', icon: Map }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = consultationType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setConsultationType(item.type as any)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'bg-navy text-champagne border-navy'
                              : 'bg-champagne text-slate border-navy/10 hover:border-sage'
                          }`}
                          id={`consultation-format-${item.type.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-sage' : 'text-sage'}`} />
                          <span className="text-[10px] font-mono tracking-wider">{item.type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Inquiry Form Inputs */}
              <div className="lg:col-span-7 space-y-5 bg-champagne p-8 rounded-[28px] border border-navy/10 shadow-sm">
                
                <h3 className="font-serif font-semibold text-xl text-navy mb-2">
                  4. Event & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="clientName"
                      placeholder="e.g. Victoria Vance"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-input-name"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="clientEmail"
                      placeholder="e.g. victoria@example.com"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-input-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="clientPhone"
                      placeholder="+1 (555) 019-2831"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-input-phone"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Event Category
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-select-eventtype"
                    >
                      <option value="Weddings">Wedding Celebration</option>
                      <option value="Corporate">Corporate Gala & Summit</option>
                      <option value="Private Soirées">Private Soirée / Milestone</option>
                      <option value="Destination">Destination Luxury Event</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Estimated Guest Scale
                    </label>
                    <input
                      type="number"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-input-guestcount"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                      Budget Tier
                    </label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                      id="booking-select-budget"
                    >
                      <option value="$50,000 - $75,000">$50,000 - $75,000</option>
                      <option value="$75,000 - $150,000">$75,000 - $150,000</option>
                      <option value="$150,000 - $300,000">$150,000 - $300,000</option>
                      <option value="$300,000+">$300,000+ Ultra-Luxury</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                    Envisioned Location / Venue
                  </label>
                  <input
                    type="text"
                    name="eventLocation"
                    placeholder="e.g. Napa Valley Estate or Amalfi Coast Villa"
                    value={formData.eventLocation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                    id="booking-input-location"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-slate/70 block mb-1">
                    Special Vision Notes / Aesthetic Preferences
                  </label>
                  <textarea
                    rows={2}
                    name="specialRequests"
                    placeholder="Share any preferred color palettes, dietary requirements, or theme ideas..."
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-champagne border border-navy/10 text-navy text-sm focus:outline-none focus:border-sage"
                    id="booking-input-notes"
                  />
                </div>

                <div className="pt-2">
                  {bookingError ? (
                    <p className="mb-3 text-center text-sm text-red-700" role="alert">
                      {bookingError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-navy text-champagne text-xs uppercase tracking-widest font-semibold hover:bg-sage transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    id="booking-submit-btn"
                  >
                    <span>{isSubmitting ? 'Reserving Strategy Slot...' : 'Confirm Strategy Session'}</span>
                    <ArrowRight className="w-4 h-4 text-sage" />
                  </button>
                </div>

              </div>

            </form>
          ) : (
            /* Booking Confirmation View */
            <div className="max-w-2xl mx-auto text-center space-y-6 py-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-champagne border border-sage flex items-center justify-center text-sage mx-auto shadow-md">
                <CheckCircle className="w-10 h-10 text-sage" />
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-sage block mb-1">
                  Confirmation Code: {confirmedRef}
                </span>
                <h3 className="text-3xl font-serif font-light text-navy">
                  Consultation Successfully Reserved!
                </h3>
                <p className="text-slate text-sm mt-2 font-light">
                  Thank you, <span className="font-semibold text-navy">{formData.clientName}</span>. A calendar invitation has been prepared for <span className="font-medium text-navy">{selectedDate}</span> at <span className="font-medium text-navy">{selectedTime}</span>.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-6 rounded-2xl bg-champagne border border-navy/10 text-left text-xs space-y-2 font-mono text-slate">
                <div className="flex justify-between">
                  <span>Client Name:</span>
                  <span className="text-navy font-semibold">{formData.clientName} ({formData.clientEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="text-navy font-semibold">{consultationType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Event Category:</span>
                  <span className="text-navy font-semibold">{formData.eventType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest Scale & Budget:</span>
                  <span className="text-navy font-semibold">{formData.guestCount} Guests • {formData.budgetRange}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={handleDownloadICS}
                  className="px-6 py-3.5 rounded-full bg-navy text-champagne text-xs uppercase tracking-widest font-semibold hover:bg-sage transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                  id="booking-download-ics-btn"
                >
                  <Download className="w-4 h-4 text-sage" />
                  <span>Download .ICS Calendar File</span>
                </button>

                <button
                  onClick={() => setConfirmedRef(null)}
                  className="px-6 py-3.5 rounded-full bg-champagne text-navy border border-navy/10 hover:border-sage text-xs uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Schedule Another Date
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
