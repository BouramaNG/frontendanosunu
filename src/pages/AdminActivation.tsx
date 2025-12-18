import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, CheckCircle2, Loader2 } from '@/lib/icons';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

type RoomRow = { id: number; name: string; slug?: string; type?: string; public_type?: string };

type SimpleUser = {
  id: number;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  is_moderator_verified?: boolean;
};

export default function AdminActivation() {
  const { user } = useAuthStore();

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [allUsers, setAllUsers] = useState<SimpleUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [durationDays, setDurationDays] = useState<number>(30);
  const [activating, setActivating] = useState<Record<number, boolean>>({});

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [successSub, setSuccessSub] = useState<string | undefined>('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorSub, setErrorSub] = useState<string | undefined>('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return allUsers
      .filter((u) =>
        !q
          ? true
          : [u.name ?? '', u.username ?? '', u.email ?? '']
              .join(' ')
              .toLowerCase()
              .includes(q)
      );
  }, [allUsers, userSearch]);

  const adminModerators = useMemo(() => {
    return filteredUsers.filter((u) => (u.role === 'admin' || u?.role === 'moderator'));
  }, [filteredUsers]);

  const regularUsers = useMemo(() => {
    return filteredUsers.filter((u) => u.role === 'user');
  }, [filteredUsers]);

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsLoading(true);
      try {
        const res = await api.get('/admin/black-rooms/all');
        // Essayer différentes structures de réponse
        let data = res.data?.data || res.data || [];
        if (!Array.isArray(data)) {
          console.warn('⚠️ Réponse API non-array:', data);
          data = [];
        }
        console.log('🏠 Chambres reçues du backend:', data.length, 'chambres', data);
        const mapped: RoomRow[] = data.map((r: any) => ({ id: r.id, name: r.name, slug: r.slug, type: r.type, public_type: r.public_type }));
        setRooms(mapped);
        console.log('✅ Chambres mappées:', mapped.length, 'chambres');
        if (!selectedRoomId && mapped.length > 0) setSelectedRoomId(mapped[0].id);
      } catch (e) {
        console.error('[ADMIN ACT] rooms fetch error', e);
      } finally {
        setRoomsLoading(false);
      }
    };

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await api.get('/admin/users', { params: { per_page: 200 } });
        const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalized: SimpleUser[] = list.map((u) => ({
          id: u.id,
          name: u.name ?? u.username ?? '',
          username: u.username ?? u.name ?? '',
          email: u.email ?? '',
          role: u.role ?? 'user',
          is_moderator_verified: Boolean(u.is_moderator_verified),
        }));
        setAllUsers(normalized);
      } catch (e) {
        console.error('[ADMIN ACT] users fetch error', e);
      } finally {
        setUsersLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadRooms();
      loadUsers();
    }
  }, [user?.role, selectedRoomId]);

  const handleActivate = async (targetUserId: number) => {
    if (!selectedRoomId) return;
    const targetRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!targetRoom) {
      alert("Aucune chambre sélectionnée/valide. Recharge la page et sélectionne une chambre existante.");
      return;
    }
    setActivating((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      const endpoint = targetRoom.slug
        ? `/admin/black-rooms/slug/${targetRoom.slug}/activate-subscription`
        : `/admin/black-rooms/${selectedRoomId}/activate-subscription`;
      const res = await api.post(endpoint, {
        user_id: targetUserId,
        duration_days: durationDays,
      });
      const expiresAt = res?.data?.data?.expires_at;
      setSuccessMsg('Utilisateur activé dans la Chambre');
      setSuccessSub(expiresAt ? `Expiration: ${new Date(expiresAt).toLocaleString('fr-FR')}` : undefined);
      setSuccessOpen(true);
    } catch (e: any) {
      console.error('[ADMIN ACT] activate error', e);
      const message = e?.response?.data?.message || 'Activation impossible.';
      setErrorMsg(message);
      setErrorSub('Vérifie la chambre et les droits administrateur.');
      setErrorOpen(true);
    } finally {
      setActivating((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-white/70">Accès réservé aux administrateurs.</div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Activation d'utilisateurs dans les Chambres</h1>
          <p className="text-sm text-white/60">Active un administrateur ou modérateur dans une chambre sans paiement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <div>
          <label className="block text-xs text-white/60 mb-1">Chambre {selectedRoomId ? `(ID: ${selectedRoomId})` : ''}</label>
          <div className="relative">
            <select
              className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2"
              value={selectedRoomId ?? ''}
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
              disabled={roomsLoading}
            >
              <option value="" disabled>Sélectionner une chambre…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name} (#{r.id})</option>
              ))}
            </select>
            {roomsLoading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-white/60" />}
          </div>
          {!roomsLoading && rooms.length === 0 && (
            <p className="mt-2 text-xs text-amber-300">Aucune chambre disponible. Crée/ouvre une chambre dans “Chambres Noires” avant d’activer.</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Durée (jours)</label>
          <input
            type="number"
            min={1}
            max={365}
            className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2"
            value={durationDays}
            onChange={(e) => setDurationDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))}
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Recherche utilisateur</label>
          <input
            placeholder="Nom, username, email..."
            className="w-full bg-black/30 text-white border border-white/10 rounded-lg px-3 py-2"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Admins & Modérateurs */}
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between p-3 border-b border-white/10 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Admins & Modérateurs ({adminModerators.length})</span>
          </div>
          {usersLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        <div className="divide-y divide-white/10">
          {adminModerators.length === 0 && (
            <div className="p-4 text-white/50 text-sm">Aucun admin/modérateur</div>
          )}

          {adminModerators.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3">
              <div className="text-white">
                <div className="font-semibold">{u.name || u.username || `#${u.id}`}</div>
                <div className="text-xs text-white/50">{u.role} {u.is_moderator_verified ? '· vérifié' : ''}</div>
              </div>
              <button
                onClick={() => handleActivate(u.id)}
                disabled={!selectedRoomId || !rooms.some(r => r.id === selectedRoomId) || Boolean(activating[u.id])}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 disabled:opacity-60"
                title="Activer dans la chambre"
              >
                {activating[u.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Activer</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Utilisateurs réguliers */}
      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between p-3 border-b border-white/10 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Utilisateurs ({regularUsers.length})</span>
          </div>
          {usersLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {regularUsers.length === 0 && (
            <div className="p-4 text-white/50 text-sm">Aucun utilisateur</div>
          )}

          {regularUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3">
              <div className="text-white">
                <div className="font-semibold">{u.name || u.username || `#${u.id}`}</div>
                <div className="text-xs text-white/50">{u.email}</div>
              </div>
              <button
                onClick={() => handleActivate(u.id)}
                disabled={!selectedRoomId || !rooms.some(r => r.id === selectedRoomId) || Boolean(activating[u.id])}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 disabled:opacity-60"
                title="Activer accès manuel"
              >
                {activating[u.id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Débloquer</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    <SuccessModal
      isOpen={successOpen}
      message={successMsg}
      subtitle={successSub}
      title="Opération confirmée"
      duration={2200}
      onClose={() => setSuccessOpen(false)}
    />
    <ErrorModal
      isOpen={errorOpen}
      message={errorMsg}
      subtitle={errorSub}
      title="Opération refusée"
      onClose={() => setErrorOpen(false)}
    />
    </>
  );
}
