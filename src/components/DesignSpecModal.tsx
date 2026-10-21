import React from 'react';
import { FileText, ShieldCheck, CheckCircle2, Users, Flame, Smartphone, ArrowRight, Printer } from 'lucide-react';

interface DesignSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const DesignSpecModal: React.FC<DesignSpecModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeSection, setActiveSection] = React.useState<number>(1);

  if (!isOpen) return null;

  const sections = [
    { id: 1, title: '1. Design Principles' },
    { id: 2, title: '2. User Journey Maps' },
    { id: 3, title: '3. Information Architecture' },
    { id: 4, title: '4. Screen Specs (Mobile-First)' },
    { id: 5, title: '5. Interaction & UX Details' },
    { id: 6, title: '6. Visual & Component System' },
    { id: 7, title: '7. Edge Cases & Invariants' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-amber-50 p-5 sm:p-6 flex items-center justify-between border-b-2 border-amber-500/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">
                Senior Product Design Document &amp; System Blueprint
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                2151 Kundiya Mahayagya Event Platform
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Print Specification"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Spec</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
            >
              Close Spec ✕
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-rose-900 text-amber-100 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-800 leading-relaxed font-sans">
          
          {/* SECTION 1: DESIGN PRINCIPLES */}
          {activeSection === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                1. Core Design Principles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">1</span>
                    Family Integrity Invariant (Never Split a Family)
                  </h4>
                  <p className="text-xs text-stone-600">
                    A sacred Yagya is fundamentally a family and community ritual. The user experience must give total, unwavering reassurance that all attending family members will sit side-by-side at the same physical Kund.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">2</span>
                    Progressive Disclosure &amp; Single-Coordinator Model
                  </h4>
                  <p className="text-xs text-stone-600">
                    Requiring individual accounts for elders and children creates insurmountable friction. By assigning a single Yagyakarta (group coordinator) who registers 1–8 members in one consolidated flow, registration time drops from 20 minutes to 3 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">3</span>
                    Mobile Thumb-Zone Ergonomics &amp; 1-Tap Presets
                  </h4>
                  <p className="text-xs text-stone-600">
                    Over 85% of registrations occur on mobile smartphones in varying outdoor lighting. All primary controls exceed 44×44px hitboxes. 1-tap presets (&quot;All 8 Days&quot;, &quot;Copy to all&quot;) eliminate cognitive fatigue across 8 days × 2 sessions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">4</span>
                    Deterministic Best-Fit Packing with Transparent Status
                  </h4>
                  <p className="text-xs text-stone-600">
                    Rather than a black-box lottery, the system matches families using Best-Fit logic (minimizing empty seats while strictly respecting capacity ≤8). Confirmed allocations remain stable and verifiable.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">5</span>
                    Devotional Dignity Balanced with Modern Usability
                  </h4>
                  <p className="text-xs text-stone-600">
                    Sacred color harmony (deep vermilion, sacred saffron, warm ivory, antique gold) respects the Mahayagya tradition without succumbing to cluttered devotional banners that obscure actionable form elements.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <h4 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-900 text-white text-xs flex items-center justify-center font-mono">6</span>
                    Zero-Deadlock Gate Retrieval &amp; Offline Resilient Passes
                  </h4>
                  <p className="text-xs text-stone-600">
                    At the event grounds in Agra, connectivity may fluctuate. Passes provide high-contrast QR codes, offline print readiness, SMS receipts, and instant 1-step retrieval via phone number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: USER JOURNEY MAPS */}
          {activeSection === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                2. User Journey Maps
              </h3>
              
              <div className="space-y-4">
                {/* Journey 1 */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-rose-900 text-sm">
                    Journey A: Yagyakarta Registration Flow (Landing to E-Pass)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">1. Discovery</div>
                      <p className="text-[11px] text-stone-500 mt-1">Lands via poster QR / WhatsApp link. Views devotional banner &amp; event guidelines.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">2. Coordinator</div>
                      <p className="text-[11px] text-stone-500 mt-1">Enters name, verified 10-digit mobile, city, gotra, and devotional intent.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">3. Group Members</div>
                      <p className="text-[11px] text-stone-500 mt-1">Adds 1–8 family members. System prompts for secondary mobile if ≥3 members.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">4. Family Sessions</div>
                      <p className="text-[11px] text-stone-500 mt-1">Selects dates and sessions once for the entire family across the 8-day calendar.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">5. Allocation &amp; Pass</div>
                      <p className="text-[11px] text-stone-500 mt-1">Engine assigns Best-Fit Kund. Generates instant printable E-Pass with QR &amp; gate instructions.</p>
                    </div>
                  </div>
                </div>

                {/* Journey 2 */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-rose-900 text-sm">
                    Journey B: Devotee Gate Arrival &amp; Booking Retrieval
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">1. Lookup</div>
                      <p className="text-[11px] text-stone-500 mt-1">Devotee arrives at Agra venue; types their 10-digit mobile number or Booking ID.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">2. E-Pass Verification</div>
                      <p className="text-[11px] text-stone-500 mt-1">Displays Kund # (e.g. Kund #108 - Zone A) and QR code for scanning at gate volunteer desk.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">3. Guided Seating</div>
                      <p className="text-[11px] text-stone-500 mt-1">Volunteers escort the full family directly to their assigned Kund without seat competition.</p>
                    </div>
                  </div>
                </div>

                {/* Journey 3 */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-rose-900 text-sm">
                    Journey C: Event Administrator Operations &amp; Live Balancing
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">1. 8-Day Overview</div>
                      <p className="text-[11px] text-stone-500 mt-1">Admin monitors live capacity (17,208 seats/session) across Morning &amp; Afternoon.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">2. 2,151 Kund Grid</div>
                      <p className="text-[11px] text-stone-500 mt-1">Filter by Zone (A–G) or status (0/8, 1–7/8, 8/8). Click any Kund to inspect seated families.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <div className="font-bold text-stone-900">3. Safe Reassignment</div>
                      <p className="text-[11px] text-stone-500 mt-1">Admin moves a family if needed; system validates target Kund has sufficient contiguous room.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: INFORMATION ARCHITECTURE */}
          {activeSection === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                3. Information Architecture (Strict Public vs Admin Separation)
              </h3>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                    <div className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                      Public Portal (Devotee Facing Only)
                    </div>
                    <ul className="space-y-1.5 text-stone-700">
                      <li>• <strong>Hero Landing:</strong> Clean unobstructed banner (no text overlays), venue/date metadata cleanly below with icons, short purpose line, and primary CTA.</li>
                      <li>• <strong>Registration Wizard:</strong>
                        <ul className="pl-4 pt-1 space-y-1 text-stone-500">
                          <li>- Step 1: Coordinator (Yagyakarta) Profile with sticky bottom action</li>
                          <li>- Step 2: Dynamic Members (1–8) with proactive 2-mobile check on 3rd member</li>
                          <li>- Step 3: 8-Day Calendar (1-tap presets, comfortable touch toggles, proper &quot;Both&quot; chip)</li>
                          <li>- Step 4: Concise Summary Review with optional schedule expansion &amp; Best-Fit allocation</li>
                        </ul>
                      </li>
                      <li>• <strong>E-Pass Confirmation:</strong> Prominent Print Pass and Download PDF actions; QR gate token; minimal footer during forms.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                    <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                      Admin Operations Console (Post-Login Only)
                    </div>
                    <ul className="space-y-1.5 text-stone-700">
                      <li>• <strong>Access Gate:</strong> Secure passcode modal accessed discreetly via minimal footer link.</li>
                      <li>• <strong>2,151 Kund Grid:</strong> Tri-state visual differentiation using patterns and icons (✓ full, ◐ partial, ○ empty) in addition to colors.</li>
                      <li>• <strong>Slide-Over Inspector:</strong> Displays seated devotee names, phones, and seat availability.</li>
                      <li>• <strong>Safe Reassignment:</strong> Real-time capacity check ensuring families are never split.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DETAILED SCREEN SPECS */}
          {activeSection === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                4. Refined Screen Descriptions (Mobile-First)
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900 text-sm">Screen 1: Landing Page (Clean Banner &amp; Focused CTA)</div>
                  <p className="text-stone-600">
                    <strong>Purpose:</strong> Instant clarity without clutter.
                    <br /><strong>Layout:</strong> Completely unobstructed banner without text overlays. Clean venue &amp; date metadata below the banner. Single short purpose line and primary CTA (&quot;परिवार का पंजीकरण करें&quot;), followed by a single reassurance line. Secondary guidelines collapsed out of the main flow. No admin controls exposed.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900 text-sm">Screen 2: Coordinator &amp; Member Management</div>
                  <p className="text-stone-600">
                    <strong>Ergonomics:</strong> Sticky bottom action bar keeps the &quot;Continue&quot; CTA anchored within the thumb reach zone. Proactively prompts for secondary emergency mobile as soon as the 3rd participant is added.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900 text-sm">Screen 3: 8-Day Calendar &amp; Session Toggles</div>
                  <p className="text-stone-600">
                    <strong>Touch Targets:</strong> All buttons meet &ge; 44px hitboxes. The previous small &quot;Select Both&quot; text link is upgraded to a prominent toggle chip. Native scrollbars are suppressed for smooth mobile swipe gestures.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900 text-sm">Screen 4: Review, Confirmation &amp; Printable Pass</div>
                  <p className="text-stone-600">
                    <strong>Review:</strong> Displays concise summary by default with optional schedule expansion.
                    <br /><strong>Pass:</strong> Prominently features Printable Pass, PDF Download, and WhatsApp Share without encroaching on the core confirmation status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: INTERACTION & UX DETAILS */}
          {activeSection === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                5. Interaction &amp; UX Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">How &quot;Add Participant&quot; Feels:</strong>
                  <p className="text-stone-600 mt-1">
                    Smooth card expansion with automatic focus and default relationship selection. The button clearly displays current count (`3/8 Members`). If reaching 8, the button transitions to a disabled confirmation badge explaining that 8 completes one full Kund.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">Session Selection on Small Screens:</strong>
                  <p className="text-stone-600 mt-1">
                    Instead of a dense 128-cell matrix, users interact with segmented pill switches (`min-h-[44px]`) on a per-day basis, complemented by 1-tap presets that configure all days in a single tap.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">Group Integrity Communication:</strong>
                  <p className="text-stone-600 mt-1">
                    Never uses dry technical database jargon like &quot;atomic allocation transaction&quot;. Uses natural language: &quot;Guaranteed Together Seating — All attending members of your family will sit side-by-side at Kund #108.&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: VISUAL & COMPONENT SYSTEM */}
          {activeSection === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                6. Visual &amp; Component Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">Color Palette (60-30-10 Rule)</div>
                  <ul className="space-y-1 text-stone-600">
                    <li>• <strong>60% Canvas:</strong> Clean warm stone (#faf8f5) &amp; crisp white for sunlight readability.</li>
                    <li>• <strong>30% Surfaces:</strong> Deep devotional crimson (#881337) and warm ivory borders.</li>
                    <li>• <strong>10% Accent:</strong> Consecrated marigold amber (#d97706 / #f59e0b) for key action buttons.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900">Typography &amp; Numerals</div>
                  <ul className="space-y-1 text-stone-600">
                    <li>• <strong>Headings:</strong> Plus Jakarta Sans bold with Rozha One / Serif devotional accents.</li>
                    <li>• <strong>Body Text:</strong> Plus Jakarta Sans 14px–16px (1.5 line height).</li>
                    <li>• <strong>Metrics &amp; Codes:</strong> Always `tabular-nums` monospace for Kund numbers and seats.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: EDGE CASES */}
          {activeSection === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-rose-950 pb-2 border-b border-stone-200">
                7. Edge Cases Explicitly Addressed
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">1. Group of Exactly 8:</strong>
                  <p className="text-stone-600 mt-0.5">
                    Forms a perfect complete Kund. The allocation engine matches this group exclusively to a pristine empty Kund (0/8), achieving 100% capacity utilization with zero wasted seats.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">2. Group of 3 with Only 1 Mobile Number:</strong>
                  <p className="text-stone-600 mt-0.5">
                    Step 2 blocks progression with an explicit validation banner: &quot;Groups of 3+ require at least two distinct mobile numbers for event safety and gate communication.&quot; If identical numbers are entered, validation rejects with an inline explanation.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">3. Participant Selecting Only 1 Session on 1 Day:</strong>
                  <p className="text-stone-600 mt-0.5">
                    Supported seamlessly. The allocation engine calculates seat demand per session independently, placing the devotee in an existing partial Kund for that single session without tying up seats in others.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">4. Partial Cancellation of Sessions:</strong>
                  <p className="text-stone-600 mt-0.5">
                    In the Booking Retrieval screen, users can release specific sessions. That specific session&apos;s seats are immediately returned to the Kund pool, while their other sessions remain stable and locked.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <strong className="text-stone-900">5. Attempt to Register &gt; 8 Participants:</strong>
                  <p className="text-stone-600 mt-0.5">
                    Add Participant button is capped at 8 with compassionate guidance advising the user to register as two separate groups so both groups receive dedicated, comfortable Kund seating.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Prepared by Senior Product Designer · 2151 Kundiya Mahayagya</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-900 text-amber-100 font-bold hover:bg-rose-950 transition-colors"
          >
            Close Document
          </button>
        </div>

      </div>
    </div>
  );
};
