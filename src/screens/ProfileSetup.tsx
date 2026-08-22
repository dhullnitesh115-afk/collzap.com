import { useState, useRef } from 'react';
import { Camera, ArrowLeft, ArrowRight, Link2, Eye } from 'lucide-react';
import { Button, Input, TextArea, ProgressBar } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { YEARS, STORY_PROMPTS } from '../lib/types';

export function ProfileSetup({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const { data, update } = useOnboarding();
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(data.photoUrl);
  const [fullName, setFullName] = useState(data.fullName || (data.verificationMethod === 'fee_slip' ? data.fullName : ''));
  const [collegeName, setCollegeName] = useState(data.collegeName || '');
  const [year, setYear] = useState(data.year);
  const [city, setCity] = useState(data.city);
  const [stories, setStories] = useState([data.storyAchievement, data.storySerious, data.storyLookingFor]);
  const [proofLink, setProofLink] = useState(data.proofOfWorkLink);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const completion = [
    photoUrl,
    fullName,
    collegeName,
    year,
    city,
    stories[0],
    stories[1],
    stories[2],
  ].filter(Boolean).length;
  const completionPct = Math.round((completion / 8) * 100);

  const handlePhoto = async (file: File) => {
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop();
    const path = `${user?.id || 'pending'}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadErr) {
      // Show error instead of silently falling back to a temporary local URL
      setError('Photo upload failed. Please try again.');
    } else {
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    update({
      photoUrl,
      fullName,
      collegeName,
      year,
      city,
      storyAchievement: stories[0],
      storySerious: stories[1],
      storyLookingFor: stories[2],
      proofOfWorkLink: proofLink,
    });

    if (user) {
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        college_name: collegeName,
        year,
        city,
        photo_url: photoUrl,
        verification_method: data.verificationMethod,
        verification_doc_url: data.verificationDocUrl,
        story_achievement: stories[0],
        story_serious: stories[1],
        story_looking_for: stories[2],
        proof_of_work_link: proofLink,
        onboarding_completed: false,
      });
      if (upsertErr) {
        setError('Failed to save profile. Please try again.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onNext();
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="flex items-center justify-between p-5">
          <button onClick={() => setShowPreview(false)} className="text-ink-500 hover:text-ink-950">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-ink-500">Profile Preview</span>
        </div>
        <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden mb-6 animate-bounce-in">
            <div className="h-24 bg-gradient-to-br from-electric-500 to-electric-700" />
            <div className="px-5 pb-5 -mt-12">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-surface mb-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-ink-300" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-ink-950">{fullName || 'Your Name'}</h2>
              <p className="text-sm text-ink-500">{collegeName || 'College'} · {year || 'Year'}</p>
              <p className="text-sm text-ink-300 mt-0.5">{city || 'City'}</p>
              {proofLink && (
                <a className="inline-flex items-center gap-1 text-sm text-electric-500 mt-2" href={proofLink} target="_blank" rel="noreferrer">
                  <Link2 className="w-3.5 h-3.5" /> Proof of Work
                </a>
              )}
              <div className="mt-4 space-y-3">
                {STORY_PROMPTS.map((prompt, i) => (
                  <div key={i}>
                    <p className="text-xs text-electric-500 font-medium">{prompt}</p>
                    <p className="text-sm text-ink-700 mt-0.5">{stories[i] || 'Not answered yet'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button fullWidth size="lg" onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Looks Good — Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center justify-between p-5">
        <button onClick={onBack} className="text-ink-500 hover:text-ink-950">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-ink-500">Profile Setup</span>
      </div>

      <div className="px-6 pb-4">
        <ProgressBar value={completionPct} />
        <p className="text-xs text-ink-300 mt-1.5">{completionPct}% complete</p>
      </div>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar pb-8">
        <h1 className="text-2xl font-bold mb-6 text-ink-950">Set up your profile</h1>

        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full border-2 border-navy-700 overflow-hidden bg-white hover:border-electric-500 transition-colors shadow-card"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {uploading ? (
                  <span className="text-xs text-ink-300">Uploading...</span>
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-ink-300" />
                    <span className="text-xs text-ink-300 mt-1">Add Photo</span>
                  </>
                )}
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhoto(f);
            }}
          />
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="College / Institute Name"
            placeholder="e.g. IIT Delhi, NIT Warangal"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Year</label>
            <select
              className="w-full bg-white border border-navy-700 rounded-btn px-4 py-3 text-ink-950 outline-none focus:border-electric-500 transition-colors"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Input
            label="City"
            placeholder="e.g. Delhi"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="pt-2">
            <p className="text-sm font-medium text-ink-700 mb-3">Tell your story (max 100 chars each)</p>
            {STORY_PROMPTS.map((prompt, i) => (
              <div key={i} className="mb-3">
                <TextArea
                  placeholder={prompt}
                  maxLength={100}
                  rows={2}
                  value={stories[i]}
                  onChange={(e) => {
                    const next = [...stories];
                    next[i] = e.target.value;
                    setStories(next);
                  }}
                />
                <p className="text-right text-xs text-ink-300 mt-0.5">{(stories[i] || '').length}/100</p>
              </div>
            ))}
          </div>

          <Input
            label="Proof of Work Link (optional)"
            placeholder="GitHub, portfolio, LinkedIn..."
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" size="lg" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button size="lg" fullWidth onClick={saveProfile} disabled={saving || uploading || completion < 6}>
            {saving ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-btn px-4 py-2 mt-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
