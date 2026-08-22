import { useState, useEffect, useMemo } from 'react';
import { Lock, Users, Link2, Clock, X, Search, Check, Loader2, Shield, ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { supabase } from '../lib/supabase';
import { LONG_TERM_INTERESTS, SHORT_TERM_ACTIVITIES } from '../lib/types';
import type { ConnectionType as ConnType, ProjectType } from '../lib/types';

const ADMIN_PASSWORD = 'CollZap2026Admin';
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage`;

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  college_name: string | null;
  year: string | null;
  city: string | null;
  verification_method: string;
  verification_status: string;
  onboarding_completed: boolean;
  created_at: string;
}

interface AdminMatch {
  match_id: string;
  user1_id: string;
  user1_name: string | null;
  user1_email: string | null;
  user2_id: string | null;
  user2_name: string | null;
  user2_email: string | null;
  project_type: string;
  connection_type: string | null;
  status: string;
  interest_name: string | null;
  level: string | null;
  chat_room_id: string | null;
  created_at: string;
}

interface AdminPending {
  match_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  college_name: string | null;
  project_type: string;
  connection_type: string | null;
  interest_name: string | null;
  level: string | null;
  created_at: string;
  wait_minutes: number;
}

type Tab = 'users' | 'matches' | 'pending';

export function AdminScreen({ onExit }: { onExit: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  if (!authed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <button onClick={onExit} className="text-ink-500 hover:text-ink-950 mb-6 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to app
          </button>
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-8">
            <div className="w-14 h-14 rounded-btn bg-electric-50 flex items-center justify-center mb-5 mx-auto">
              <Shield className="w-7 h-7 text-electric-500" />
            </div>
            <h1 className="text-xl font-bold text-ink-950 text-center mb-1">Admin Access</h1>
            <p className="text-sm text-ink-500 text-center mb-6">Enter the admin password to continue</p>
            <Input
              type="password"
              placeholder="Admin password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(''); }}
              error={pwError}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (pwInput === ADMIN_PASSWORD) setAuthed(true);
                  else setPwError('Incorrect password');
                }
              }}
            />
            <Button
              fullWidth
              size="lg"
              className="mt-4"
              onClick={() => {
                if (pwInput === ADMIN_PASSWORD) setAuthed(true);
                else setPwError('Incorrect password');
              }}
            >
              <Lock className="w-4 h-4 mr-2" /> Unlock
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onExit={onExit} />;
}

function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [pending, setPending] = useState<AdminPending[]>([]);
  const [error, setError] = useState('');
  const [showManualMatch, setShowManualMatch] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'list', adminPassword: ADMIN_PASSWORD }),
      });

      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setUsers(data.users || []);
      setMatches(data.matches || []);
      setPending(data.pending || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const unmatch = async (matchId: string) => {
    if (!confirm('Remove this match? This will delete the chat room and all messages.')) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'unmatch', adminPassword: ADMIN_PASSWORD, matchId }),
      });

      if (!res.ok) throw new Error('Failed to unmatch');
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-12">
      {/* Header */}
      <div className="bg-white border-b border-navy-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-electric-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-electric-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink-950">CollZap Admin</h1>
              <p className="text-xs text-ink-500">Database management panel</p>
            </div>
          </div>
          <button onClick={onExit} className="text-sm text-ink-500 hover:text-ink-950 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <Users className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{users.length}</p>
            <p className="text-xs text-ink-300">Total Users</p>
          </div>
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <Link2 className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{matches.length}</p>
            <p className="text-xs text-ink-300">Active Matches</p>
          </div>
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <Clock className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{pending.length}</p>
            <p className="text-xs text-ink-300">Pending</p>
          </div>
        </div>

        {/* Tabs + Manual Match button */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-navy-700 rounded-btn p-1">
            {([
              { key: 'users', label: 'Users', icon: Users },
              { key: 'matches', label: 'Matches', icon: Link2 },
              { key: 'pending', label: 'Pending', icon: Clock },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === key ? 'bg-electric-500 text-white' : 'text-ink-500 hover:text-ink-950'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowManualMatch(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Create Manual Match
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-btn p-3 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-electric-500 animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'users' && <UsersTable users={users} />}
            {tab === 'matches' && <MatchesTable matches={matches} onUnmatch={unmatch} />}
            {tab === 'pending' && <PendingTable pending={pending} />}
          </>
        )}
      </div>

      {showManualMatch && (
        <ManualMatchModal
          users={users}
          onClose={() => setShowManualMatch(false)}
          onSuccess={() => { setShowManualMatch(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function UsersTable({ users }: { users: AdminUser[] }) {
  if (users.length === 0) return <EmptyState icon={Users} text="No users yet" />;
  return (
    <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-navy-700 text-left text-xs text-ink-500 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Full Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">College</th>
            <th className="px-4 py-3 font-medium">Year</th>
            <th className="px-4 py-3 font-medium">Verification</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} className="border-b border-navy-700 last:border-0 hover:bg-surface/50">
              <td className="px-4 py-3 text-ink-300">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-ink-950">{u.full_name || '—'}</td>
              <td className="px-4 py-3 text-ink-500">{u.email}</td>
              <td className="px-4 py-3 text-ink-500">{u.college_name || '—'}</td>
              <td className="px-4 py-3 text-ink-500">{u.year || '—'}</td>
              <td className="px-4 py-3">
                <VerificationBadge status={u.verification_status} />
              </td>
              <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTable({ matches, onUnmatch }: { matches: AdminMatch[]; onUnmatch: (id: string) => void }) {
  if (matches.length === 0) return <EmptyState icon={Link2} text="No matches yet" />;
  return (
    <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-navy-700 text-left text-xs text-ink-500 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">User 1</th>
            <th className="px-4 py-3 font-medium">User 2</th>
            <th className="px-4 py-3 font-medium">Interest</th>
            <th className="px-4 py-3 font-medium">Level</th>
            <th className="px-4 py-3 font-medium">Connection</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m, i) => (
            <tr key={m.match_id} className="border-b border-navy-700 last:border-0 hover:bg-surface/50">
              <td className="px-4 py-3 text-ink-300">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-ink-950">{m.user1_name || '—'}</div>
                <div className="text-xs text-ink-300">{shortId(m.user1_id)}</div>
              </td>
              <td className="px-4 py-3">
                {m.user2_id ? (
                  <>
                    <div className="font-medium text-ink-950">{m.user2_name || '—'}</div>
                    <div className="text-xs text-ink-300">{shortId(m.user2_id)}</div>
                  </>
                ) : (
                  <span className="text-ink-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-500">{m.interest_name || '—'}</td>
              <td className="px-4 py-3 text-ink-500">{m.level || '—'}</td>
              <td className="px-4 py-3 text-ink-500 capitalize">{m.connection_type?.replace('-', ' ') || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onUnmatch(m.match_id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-btn p-1.5 transition-colors"
                  title="Unmatch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PendingTable({ pending }: { pending: AdminPending[] }) {
  if (pending.length === 0) return <EmptyState icon={Clock} text="No pending matches" />;
  return (
    <div className="bg-white rounded-card border border-navy-700 shadow-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-navy-700 text-left text-xs text-ink-500 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Interest</th>
            <th className="px-4 py-3 font-medium">Level</th>
            <th className="px-4 py-3 font-medium">Connection</th>
            <th className="px-4 py-3 font-medium">Waiting</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((p, i) => (
            <tr key={p.match_id} className="border-b border-navy-700 last:border-0 hover:bg-surface/50">
              <td className="px-4 py-3 text-ink-300">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-ink-950">{p.full_name || '—'}</div>
                <div className="text-xs text-ink-300">{p.email}</div>
              </td>
              <td className="px-4 py-3 text-ink-500">{p.interest_name}</td>
              <td className="px-4 py-3 text-ink-500">{p.level}</td>
              <td className="px-4 py-3 text-ink-500 capitalize">{p.connection_type?.replace('-', ' ') || '—'}</td>
              <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatWait(p.wait_minutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManualMatchModal({
  users,
  onClose,
  onSuccess,
}: {
  users: AdminUser[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [user1Query, setUser1Query] = useState('');
  const [user2Query, setUser2Query] = useState('');
  const [user1Id, setUser1Id] = useState('');
  const [user2Id, setUser2Id] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('long_term');
  const [interestName, setInterestName] = useState('');
  const [connectionType, setConnectionType] = useState<ConnType>('1-on-1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const interestList = projectType === 'long_term' ? LONG_TERM_INTERESTS : SHORT_TERM_ACTIVITIES;

  const filteredUsers1 = useMemo(() => searchUsers(users, user1Query, user2Id), [users, user1Query, user2Id]);
  const filteredUsers2 = useMemo(() => searchUsers(users, user2Query, user1Id), [users, user2Query, user1Id]);

  const canSubmit = user1Id && user2Id && interestName && connectionType && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: 'manual_match',
          adminPassword: ADMIN_PASSWORD,
          user1Id,
          user2Id,
          interestName,
          connectionType,
          projectType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create match');
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-white rounded-card border border-navy-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-navy-700 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-ink-950">Create Manual Match</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-950">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-btn p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Project type */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Peer Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['long_term', 'short_term'] as const).map((pt) => (
                <button
                  key={pt}
                  onClick={() => { setProjectType(pt); setInterestName(''); }}
                  className={`px-4 py-2.5 rounded-btn text-sm font-medium border-2 transition-colors ${
                    projectType === pt
                      ? 'border-electric-500 bg-electric-50 text-electric-500'
                      : 'border-navy-700 text-ink-500 hover:border-navy-600'
                  }`}
                >
                  {pt === 'long_term' ? 'Long-Term Peer' : 'Short-Term Buddy'}
                </button>
              ))}
            </div>
          </div>

          {/* User 1 search */}
          <UserSearchPicker
            label="User 1"
            query={user1Query}
            setQuery={setUser1Query}
            results={filteredUsers1}
            selectedId={user1Id}
            onSelect={(id) => { setUser1Id(id); setUser1Query(''); }}
          />

          {/* User 2 search */}
          <UserSearchPicker
            label="User 2"
            query={user2Query}
            setQuery={setUser2Query}
            results={filteredUsers2}
            selectedId={user2Id}
            onSelect={(id) => { setUser2Id(id); setUser2Query(''); }}
          />

          {/* Interest */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              {projectType === 'long_term' ? 'Interest' : 'Activity'}
            </label>
            <select
              value={interestName}
              onChange={(e) => setInterestName(e.target.value)}
              className="w-full bg-white border border-navy-700 rounded-btn px-4 py-3 text-ink-950 outline-none focus:border-electric-500"
            >
              <option value="">Select {projectType === 'long_term' ? 'an interest' : 'an activity'}</option>
              {interestList.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Connection type */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Connection Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1-on-1', 'short_group', 'society'] as const).map((ct) => (
                <button
                  key={ct}
                  onClick={() => setConnectionType(ct)}
                  className={`px-3 py-2.5 rounded-btn text-sm font-medium border-2 transition-colors ${
                    connectionType === ct
                      ? 'border-electric-500 bg-electric-50 text-electric-500'
                      : 'border-navy-700 text-ink-500 hover:border-navy-600'
                  }`}
                >
                  {ct === '1-on-1' ? '1-on-1' : ct === 'short_group' ? 'Short Group' : 'Society'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-navy-700 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Match Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserSearchPicker({
  label,
  query,
  setQuery,
  results,
  selectedId,
  onSelect,
}: {
  label: string;
  query: string;
  setQuery: (q: string) => void;
  results: AdminUser[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = results.find((u) => u.id === selectedId) || null;
  const [showResults, setShowResults] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      {selectedId ? (
        <div className="flex items-center justify-between bg-electric-50 border border-electric-500 rounded-btn px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink-950">{selected?.full_name || 'Unknown'}</p>
            <p className="text-xs text-ink-500">{selected?.email}</p>
          </div>
          <button
            onClick={() => { onSelect(''); setQuery(''); }}
            className="text-ink-500 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full bg-white border border-navy-700 rounded-btn pl-10 pr-4 py-3 text-ink-950 placeholder-ink-300 outline-none focus:border-electric-500"
            />
          </div>
          {showResults && query && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-navy-700 rounded-btn shadow-lg max-h-48 overflow-y-auto z-20">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { onSelect(u.id); setShowResults(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface border-b border-navy-700 last:border-0"
                >
                  <p className="text-sm font-medium text-ink-950">{u.full_name || 'Unknown'}</p>
                  <p className="text-xs text-ink-500">{u.email} · {u.college_name || '—'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function searchUsers(users: AdminUser[], query: string, excludeId: string): AdminUser[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return users
    .filter((u) => u.id !== excludeId)
    .filter((u) =>
      (u.full_name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
    .slice(0, 10);
}

function VerificationBadge({ status }: { status: string }) {
  const isVerified = status.includes('Verified');
  const isPending = status.includes('Pending');
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
      isVerified
        ? 'bg-green-50 text-green-600 border border-green-200'
        : isPending
        ? 'bg-amber-50 text-amber-600 border border-amber-200'
        : 'bg-red-50 text-red-600 border border-red-200'
    }`}>
      {isVerified && <Check className="w-3 h-3" />}
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-green-50 text-green-600 border-green-200',
    matched: 'bg-electric-50 text-electric-500 border-electric-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${colorMap[status] || 'bg-surface text-ink-500 border-navy-700'}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-300">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function shortId(id: string): string {
  return id ? `${id.slice(0, 8)}...` : '—';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatWait(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}
