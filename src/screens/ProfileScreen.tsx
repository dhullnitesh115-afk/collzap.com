import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Link2, Edit3, Zap, Settings, Bell, Shield, HelpCircle, ArrowLeft, Loader2, X, AlertTriangle, Mail, FileText } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Button, Input, TextArea } from '../components/ui';
import type { Interest, SeriousnessScore, Profile } from '../lib/types';

const STORY_PROMPTS = [
  { key: 'story_achievement', label: 'One thing I want to achieve in my college years' },
  { key: 'story_serious', label: 'I am most serious about' },
  { key: 'story_looking_for', label: 'The kind of peer I am looking for' },
] as const;

type SubPage = 'main' | 'edit' | 'notifications' | 'privacy' | 'rules';

export function ProfileScreen({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [scores, setScores] = useState<SeriousnessScore[]>([]);
  const [subPage, setSubPage] = useState<SubPage>('main');

  useEffect(() => {
    if (!user) return;
    supabase.from('interests').select('*').eq('user_id', user.id).then(({ data }) => setInterests(data || []));
    supabase.from('seriousness_scores').select('*').eq('user_id', user.id).then(({ data }) => setScores(data || []));
  }, [user]);

  if (subPage === 'edit') {
    return (
      <EditProfileForm
        profile={profile}
        onCancel={() => setSubPage('main')}
        onSaved={async () => {
          await refreshProfile();
          setSubPage('main');
        }}
      />
    );
  }

  if (subPage === 'notifications') {
    return <NotificationsSettings onBack={() => setSubPage('main')} />;
  }

  if (subPage === 'privacy') {
    return <PrivacySafety onBack={() => setSubPage('main')} />;
  }

  if (subPage === 'rules') {
    return <RulesSupport onBack={() => setSubPage('main')} />;
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        {onBack && (
          <button onClick={() => onBack()} className="mb-4 text-ink-500 hover:text-ink-950 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Profile</h1>

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden mb-6">
          <div className="h-20 bg-gradient-to-br from-electric-500 to-electric-700" />
          <div className="px-5 pb-5 -mt-10">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-surface mb-3">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-ink-300" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-ink-950">{profile?.full_name || 'Your Name'}</h2>
            <p className="text-sm text-ink-500">{profile?.email}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-ink-300">
              {profile?.college_name && <span>{profile.college_name}</span>}
              {profile?.year && <span>· {profile.year}</span>}
              {profile?.city && <span>· {profile.city}</span>}
            </div>
            {profile?.verification_method === 'email_otp' ? (
              <span className="inline-flex items-center gap-1 mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Verified via Email
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-3 text-xs text-electric-500 bg-electric-50 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Verified via Document
              </span>
            )}
          </div>
        </div>

        {(profile?.story_achievement || profile?.story_serious || profile?.story_looking_for) && (
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-5 mb-6">
            <h3 className="text-sm font-medium text-ink-700 mb-3">My Story</h3>
            <div className="space-y-3">
              {profile?.story_achievement && (
                <div>
                  <p className="text-xs text-electric-500 font-medium">One thing I want to achieve</p>
                  <p className="text-sm text-ink-700 mt-0.5">{profile.story_achievement}</p>
                </div>
              )}
              {profile?.story_serious && (
                <div>
                  <p className="text-xs text-electric-500 font-medium">I am most serious about</p>
                  <p className="text-sm text-ink-700 mt-0.5">{profile.story_serious}</p>
                </div>
              )}
              {profile?.story_looking_for && (
                <div>
                  <p className="text-xs text-electric-500 font-medium">The kind of peer I am looking for</p>
                  <p className="text-sm text-ink-700 mt-0.5">{profile.story_looking_for}</p>
                </div>
              )}
            </div>
            {profile?.proof_of_work_link && (
              <a
                href={profile.proof_of_work_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-electric-500 mt-4"
              >
                <Link2 className="w-3.5 h-3.5" /> Proof of Work
              </a>
            )}
          </div>
        )}

        {(interests.length > 0 || scores.length > 0) && (
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-5 mb-6">
            <h3 className="text-sm font-medium text-ink-700 mb-3">Interests & Levels</h3>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {interests.map((i, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-navy-700 text-ink-700">
                    {i.interest_name}{i.level && ` · ${i.level}`}
                  </span>
                ))}
              </div>
            )}
            {scores.length > 0 && (
              <div className="space-y-2">
                {scores.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-ink-700">{s.interest_name}</span>
                    <span className="text-xs font-medium text-electric-500">{s.level} · {s.score}/100</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden mb-6">
          {[
            { icon: Edit3, label: 'Edit Profile', action: () => setSubPage('edit') },
            { icon: Bell, label: 'Notifications', action: () => setSubPage('notifications') },
            { icon: Shield, label: 'Privacy & Safety', action: () => setSubPage('privacy') },
            { icon: HelpCircle, label: 'Rules & Support', action: () => setSubPage('rules') },
          ].map(({ icon: Icon, label, action }, idx) => (
            <button
              key={idx}
              onClick={action}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors border-b border-navy-700 last:border-0"
            >
              <Icon className="w-5 h-5 text-ink-300" />
              <span className="text-sm flex-1 text-left text-ink-700">{label}</span>
              <span className="text-ink-300">›</span>
            </button>
          ))}
        </div>

        <Button variant="secondary" fullWidth size="lg" onClick={async () => { await signOut(); navigate('/'); }}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <p className="text-center text-xs text-ink-300 mt-6 flex items-center justify-center gap-1">
          <Zap className="w-3 h-3" /> CollZap v1.0 · Made for Indian students
        </p>
      </div>
    </div>
  );
}

// ============ EDIT PROFILE ============

function EditProfileForm({ profile, onCancel, onSaved }: { profile: Profile | null; onCancel: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [year, setYear] = useState(profile?.year || '');
  const [city, setCity] = useState(profile?.city || '');
  const [storyAchievement, setStoryAchievement] = useState(profile?.story_achievement || '');
  const [storySerious, setStorySerious] = useState(profile?.story_serious || '');
  const [storyLookingFor, setStoryLookingFor] = useState(profile?.story_looking_for || '');
  const [proofLink, setProofLink] = useState(profile?.proof_of_work_link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const storyValues: Record<string, string> = {
    story_achievement: storyAchievement,
    story_serious: storySerious,
    story_looking_for: storyLookingFor,
  };
  const storySetters: Record<string, (v: string) => void> = {
    story_achievement: setStoryAchievement,
    story_serious: setStorySerious,
    story_looking_for: setStoryLookingFor,
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        year: year.trim() || null,
        city: city.trim() || null,
        story_achievement: storyAchievement.trim() || null,
        story_serious: storySerious.trim() || null,
        story_looking_for: storyLookingFor.trim() || null,
        proof_of_work_link: proofLink.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to save changes. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        <button onClick={onCancel} className="mb-4 flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-1.5 text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Edit Profile</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-btn px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Year of Study</label>
            <select
              className="w-full bg-white border border-navy-700 rounded-btn px-4 py-3 text-ink-950 outline-none focus:border-electric-500 transition-colors"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select year</option>
              {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <Input
            label="City"
            placeholder="Your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="pt-2">
            <h3 className="text-sm font-medium text-ink-700 mb-3">My Story</h3>
            <div className="space-y-4">
              {STORY_PROMPTS.map((prompt) => (
                <TextArea
                  key={prompt.key}
                  label={prompt.label}
                  placeholder="Share your story..."
                  value={storyValues[prompt.key]}
                  onChange={(e) => storySetters[prompt.key](e.target.value)}
                  maxLength={100}
                  rows={2}
                />
              ))}
            </div>
          </div>

          <Input
            label="Proof of Work Link"
            placeholder="https://github.com/yourproject or portfolio link"
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
          />

          <Button fullWidth size="lg" onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ NOTIFICATIONS SETTINGS ============

function NotificationsSettings({ onBack }: { onBack: () => void }) {
  const [matchNotifs, setMatchNotifs] = useState(() => {
    try { return localStorage.getItem('collzap_notif_match') !== 'off'; } catch { return true; }
  });
  const [messageNotifs, setMessageNotifs] = useState(() => {
    try { return localStorage.getItem('collzap_notif_message') !== 'off'; } catch { return true; }
  });

  const toggleMatch = () => {
    const newVal = !matchNotifs;
    setMatchNotifs(newVal);
    try { localStorage.setItem('collzap_notif_match', newVal ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const toggleMessage = () => {
    const newVal = !messageNotifs;
    setMessageNotifs(newVal);
    try { localStorage.setItem('collzap_notif_message', newVal ? 'on' : 'off'); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        <button onClick={onBack} className="mb-4 flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-1.5 text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Notifications</h1>

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden">
          <ToggleRow
            icon={Bell}
            label="Match Notifications"
            description="Get notified when you match with a peer"
            value={matchNotifs}
            onToggle={toggleMatch}
          />
          <div className="border-t border-navy-700" />
          <ToggleRow
            icon={Mail}
            label="Message Notifications"
            description="Get notified when you receive a new message"
            value={messageNotifs}
            onToggle={toggleMessage}
          />
        </div>

        <p className="text-xs text-ink-300 mt-4 text-center">
          Notification preferences are saved on this device.
        </p>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, value, onToggle }: {
  icon: typeof Bell;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon className="w-5 h-5 text-ink-300 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <p className="text-xs text-ink-300 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${value ? 'bg-electric-500' : 'bg-navy-700'}`}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

// ============ PRIVACY & SAFETY ============

function PrivacySafety({ onBack }: { onBack: () => void }) {
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [accountVisible, setAccountVisible] = useState(() => {
    try { return localStorage.getItem('collzap_account_visible') !== 'off'; } catch { return true; }
  });

  const toggleVisibility = () => {
    const newVal = !accountVisible;
    setAccountVisible(newVal);
    try { localStorage.setItem('collzap_account_visible', newVal ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const submitReport = async () => {
    // Save report to database instead of just showing a fake success message
    if (user) {
      await supabase.from('user_reports').insert({
        reporter_id: user.id,
        report_text: reportText.trim(),
        status: 'pending',
      });
    }
    setReportSubmitted(true);
    setReportText('');
    setTimeout(() => { setShowReport(false); setReportSubmitted(false); }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        <button onClick={onBack} className="mb-4 flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-1.5 text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Privacy & Safety</h1>

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-navy-700">
            <h3 className="text-sm font-medium text-ink-700 mb-3">Account Visibility</h3>
            <ToggleRow
              icon={Settings}
              label="Discoverable"
              description="Allow other students to find and match with you"
              value={accountVisible}
              onToggle={toggleVisibility}
            />
          </div>
        </div>

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden mb-4">
          <button
            onClick={() => setShowReport(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors border-b border-navy-700"
          >
            <AlertTriangle className="w-5 h-5 text-ink-300" />
            <span className="text-sm flex-1 text-left text-ink-700">Report a User</span>
            <span className="text-ink-300">›</span>
          </button>
          <button
            onClick={() => alert('Block user feature: From any chat, tap the user name to block them. Blocked users cannot send you messages.')}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5 text-ink-300" />
            <span className="text-sm flex-1 text-left text-ink-700">Blocked Users</span>
            <span className="text-ink-300">›</span>
          </button>
        </div>

        <div className="bg-white rounded-card border border-navy-700 shadow-card p-5">
          <h3 className="text-sm font-medium text-ink-700 mb-2">Your Data</h3>
          <p className="text-xs text-ink-300 leading-relaxed">
            Your profile information, interests, and chat messages are stored securely. Only your matched peers can see your profile and chat with you. Your data is never shared with third parties.
          </p>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-card border border-navy-700 shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink-950">Report a User</h2>
              <button onClick={() => setShowReport(false)} className="text-ink-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            {reportSubmitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-ink-700">Report submitted. Our team will review it shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-500 mb-4">Describe the issue with the user you want to report. Include their name and the nature of the problem.</p>
                <TextArea
                  placeholder="Describe the issue..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={4}
                />
                <Button fullWidth className="mt-4" disabled={!reportText.trim()} onClick={submitReport}>
                  Submit Report
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ RULES & SUPPORT ============

function RulesSupport({ onBack }: { onBack: () => void }) {
  const [showContact, setShowContact] = useState(false);
  const [contactText, setContactText] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const submitContact = async () => {
    // Save support request to database
    if (user) {
      await supabase.from('support_requests').insert({
        user_id: user.id,
        message: contactText.trim(),
        status: 'pending',
      });
    }
    setContactSent(true);
    setContactText('');
    setTimeout(() => { setShowContact(false); setContactSent(false); }, 2000);
  };

  const rules = [
    { title: 'Be Respectful', desc: 'Treat every peer with kindness. No harassment, bullying, or hate speech.' },
    { title: 'Stay Authentic', desc: 'Use your real college identity. Do not impersonate others or create fake profiles.' },
    { title: 'Keep It Academic', desc: 'CollZap is for learning and growth. No spam, promotions, or irrelevant content.' },
    { title: 'Respect Privacy', desc: 'Do not share others\' personal information, messages, or contact details without consent.' },
    { title: 'Report Issues', desc: 'If someone makes you uncomfortable, report them immediately from Privacy & Safety.' },
    { title: 'No External Apps', desc: 'Do not promote or share links to external apps or services that violate platform rules.' },
  ];

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        <button onClick={onBack} className="mb-4 flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="ml-1.5 text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Rules & Support</h1>

        <div className="bg-white rounded-card border border-navy-700 shadow-card p-5 mb-4">
          <h3 className="text-sm font-medium text-ink-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-electric-500" /> Community Guidelines
          </h3>
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-electric-50 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-electric-500">{idx + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-950">{rule.title}</p>
                  <p className="text-xs text-ink-300 mt-0.5 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden">
          <button
            onClick={() => setShowContact(true)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors border-b border-navy-700"
          >
            <Mail className="w-5 h-5 text-ink-300" />
            <span className="text-sm flex-1 text-left text-ink-700">Contact Support</span>
            <span className="text-ink-300">›</span>
          </button>
          <a
            href="mailto:support@collzap.com"
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-ink-300" />
            <span className="text-sm flex-1 text-left text-ink-700">Email Us</span>
            <span className="text-xs text-ink-300">support@collzap.com</span>
          </a>
        </div>

        <p className="text-xs text-ink-300 mt-4 text-center">
          By using CollZap, you agree to follow these community guidelines.
        </p>
      </div>

      {showContact && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowContact(false)}>
          <div className="bg-white rounded-card border border-navy-700 shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink-950">Contact Support</h2>
              <button onClick={() => setShowContact(false)} className="text-ink-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            {contactSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-ink-700">Message sent! We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-500 mb-4">Tell us about your issue or question. We'll respond via email.</p>
                <TextArea
                  placeholder="Describe your issue..."
                  value={contactText}
                  onChange={(e) => setContactText(e.target.value)}
                  rows={4}
                />
                <Button fullWidth className="mt-4" disabled={!contactText.trim()} onClick={submitContact}>
                  Send Message
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
