import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Warehouse, Mail, Lock, Eye, EyeOff,
  Plus, Check, X, AlertCircle, Camera,
  MapPin, Ruler, FileText, Map,
} from 'lucide-react';
import api from '../../../API/api';

const inputCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';

/* ------------------------------------------------------------------ */
/* Sous-composants locaux                                               */
/* ------------------------------------------------------------------ */
function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
      <h2 className="font-serif text-[17px] font-medium text-[#171310] mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function Parametres() {

  /* ── Photo de profil ── */
  const fileRef  = useRef(null);
  const [avatar, setAvatar] = useState(null);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  }

  /* ── Profil ── */
  const [nom,       setNom]       = useState('');
  const [email,     setEmail]     = useState('');
  const [tel,       setTel]       = useState('');
  const [profSaved, setProfSaved] = useState(false);

  /* ── Mot de passe ── */
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [oldPwd,   setOldPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);

  /* ── Fermes ── */
  const [fermes,      setFermes]      = useState([]);
  const [showPanel,   setShowPanel]   = useState(false);
  const [newFerme,    setNewFerme]    = useState({
    nom: '', localisation: '', superficie: '',
    description: '', coordonneesGPS: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [farmLimit, setFarmLimit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoadingProfile(true);
        setLoadingFarms(true);
        const [profile, farms, activeSubscription, plans] = await Promise.all([
          api.getCurrentUser(),
          api.getFarms(),
          api.getActiveSubscription().catch(() => null),
          api.getPlans(),
        ]);

        if (!alive) return;

        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
        setNom(fullName || profile.username || '');
        setEmail(profile.email || '');
        setTel(profile.telephone || '');

        const mappedFarms = Array.isArray(farms)
          ? farms.map(f => ({
              id: f.id,
              nom: f.nom,
              localisation: f.localisation || '',
              superficie: Number(f.superficie) || 0,
              description: f.description || '',
              coordonneesGPS: f.coordonnees_gps || '',
              dateCreation: f.date_creation || '',
              animaux: 0,
              active: false,
            }))
          : [];

        setFermes(mappedFarms);
        const activePlan = activeSubscription && Array.isArray(plans)
          ? plans.find(plan => plan.id === activeSubscription.plan)
          : null;
        setFarmLimit(activePlan?.nb_fermes_max ?? 0);
        setError('');
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Impossible de charger les informations de l’utilisateur.');
      } finally {
        if (alive) {
          setLoadingProfile(false);
          setLoadingFarms(false);
        }
      }
    }

    loadData();
    return () => { alive = false; };
  }, []);

  const peutAjouter = farmLimit !== null && fermes.length < farmLimit;

  /* ── Handlers ── */
  function saveProfile() {
    setProfSaved(true);
    setTimeout(() => setProfSaved(false), 2500);
  }

  function savePwd() {
    if (!oldPwd || !newPwd) return;
    setPwdSaved(true);
    setOldPwd(''); setNewPwd('');
    setTimeout(() => setPwdSaved(false), 2500);
  }

  async function addFerme() {
    if (!newFerme.nom.trim()) return;

    try {
      await api.createFarm({
        nom: newFerme.nom,
        localisation: newFerme.localisation,
        superficie: parseFloat(newFerme.superficie) || 0,
        description: newFerme.description,
        coordonnees_gps: newFerme.coordonneesGPS,
      });

      const farms = await api.getFarms();
      const mappedFarms = Array.isArray(farms)
        ? farms.map(f => ({
            id: f.id,
            nom: f.nom,
            localisation: f.localisation || '',
            superficie: Number(f.superficie) || 0,
            description: f.description || '',
            coordonneesGPS: f.coordonnees_gps || '',
            dateCreation: f.date_creation || '',
            animaux: 0,
            active: false,
          }))
        : [];

      setFermes(mappedFarms);
      setNewFerme({ nom: '', localisation: '', superficie: '', description: '', coordonneesGPS: '' });
      setShowPanel(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Impossible de créer la ferme.');
    }
  }

  /* ── Initiales pour l'avatar par défaut ── */
  const initiales = nom.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Titre */}
      <div className="mb-6">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Paramètres</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">Gérez votre profil et vos exploitations</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ══ PROFIL ══ */}
        <Section title="Profil">

          {/* Photo + infos côte à côte */}
          <div className="flex flex-col sm:flex-row gap-6 mb-5">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <div className="relative w-20 h-20">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#E5E5E3]"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[22px] font-bold"
                    style={{ background: 'linear-gradient(to bottom right, #60a5fa)' }}
                  >
                    {initiales}
                  </div>
                )}
                {/* Bouton caméra */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5C3A21] border-2 border-white flex items-center justify-center hover:bg-[#3B2313] transition-colors"
                  aria-label="Changer la photo"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[12px] text-[#5C3A21] hover:underline"
              >
                Changer la photo
              </button>
            </div>

            {/* Champs */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom complet">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
                  <input
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Rôle">
                <div className={`${inputCls} bg-[#F5F4F2] text-[#171310]/50 cursor-not-allowed`}>
                  Éleveur
                </div>
              </Field>

              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Téléphone">
                <div className="h-11 rounded-lg border border-[#E5E5E3] bg-white flex items-center overflow-hidden focus-within:border-[#5C3A21] transition-colors">
                  <div className="px-3 h-full flex items-center bg-[#F5F4F2] border-r border-[#E5E5E3] text-[13px] font-medium text-[#171310]/60 flex-shrink-0">
                    +221
                  </div>
                  <input
                    type="tel"
                    value={tel}
                    onChange={e => setTel(e.target.value)}
                    className="flex-1 px-3 text-[13px] text-[#171310] bg-transparent outline-none"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
            >
              {profSaved
                ? <><Check className="w-4 h-4 stroke-[2]" /> Enregistré</>
                : 'Enregistrer'}
            </button>
          </div>
        </Section>

        {/* ══ MOT DE PASSE ══ */}
        <Section title="Mot de passe">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mot de passe actuel">
              <div className="h-11 rounded-lg border border-[#E5E5E3] bg-white flex items-center px-3 gap-2 focus-within:border-[#5C3A21] transition-colors">
                <Lock className="w-4 h-4 text-[#171310]/30 flex-shrink-0" />
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPwd}
                  onChange={e => setOldPwd(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 text-[13px] text-[#171310] bg-transparent outline-none"
                />
                <button type="button" onClick={() => setShowOld(v => !v)} className="text-[#171310]/40">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Nouveau mot de passe">
              <div className="h-11 rounded-lg border border-[#E5E5E3] bg-white flex items-center px-3 gap-2 focus-within:border-[#5C3A21] transition-colors">
                <Lock className="w-4 h-4 text-[#171310]/30 flex-shrink-0" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="flex-1 text-[13px] text-[#171310] bg-transparent outline-none"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="text-[#171310]/40">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={savePwd}
              className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
            >
              {pwdSaved
                ? <><Check className="w-4 h-4 stroke-[2]" /> Modifié</>
                : 'Modifier le mot de passe'}
            </button>
          </div>
        </Section>

        {/* ══ MES FERMES ══ */}
        <Section title="Mes fermes">

          {/* Quota + bouton ajouter */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-[#171310]/60">
              <span className="font-semibold text-[#171310]">{fermes.length}</span>
              {' '} / {farmLimit ?? '—'} ferme{farmLimit > 1 ? 's' : ''} autorisée{farmLimit > 1 ? 's' : ''} par votre forfait
            </p>

            <button
              type="button"
              onClick={() => peutAjouter && setShowPanel(true)}
              disabled={!peutAjouter}
              className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[1.8]" />
              {peutAjouter ? 'Ajouter une ferme' : 'Limite atteinte'}
            </button>
          </div>

          {/* Liste */}
          <div className="flex flex-col gap-3">
            {fermes.length === 0 && !loadingFarms && (
              <div className="rounded-xl border border-[#E5E5E3] bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310]/60">
                Aucune ferme associée à cet utilisateur.
              </div>
            )}
            {fermes.map(f => (
              <div
                key={f.id}
                className="rounded-xl border border-[#E5E5E3] bg-white px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F5F4F2] flex items-center justify-center flex-shrink-0">
                    <Warehouse className="w-4 h-4 text-[#5C3A21]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#171310] flex items-center gap-2">
                      {f.nom}
                      {f.active && (
                        <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#171310]/50">
                      {f.localisation}
                      {f.superficie ? ` · ${f.superficie} ha` : ''}
                      {` · ${f.animaux} animaux`}
                    </div>
                  </div>
                </div>

                {/* Œil → page de connexion pour cette ferme */}
                <Link
                  to="/connexion"
                  title={`Accéder à ${f.nom}`}
                  className="w-8 h-8 rounded-lg border border-[#E5E5E3] flex items-center justify-center hover:bg-[#F5F4F2] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#171310]/60" />
                </Link>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ══ PANEL LATÉRAL — AJOUTER UNE FERME ══ */}

      {/* Overlay */}
      {showPanel && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Panneau */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 w-[400px] max-w-[95vw] bg-white shadow-2xl flex flex-col transition-transform duration-300
          ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
          <h2 className="font-serif text-[17px] font-medium text-[#171310]">Nouvelle ferme</h2>
          <button
            type="button"
            onClick={() => setShowPanel(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors"
          >
            <X className="w-4 h-4 text-[#171310]/50" />
          </button>
        </div>

        {/* Formulaire scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Nom */}
          <Field label="Nom de la ferme *">
            <div className="relative">
              <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
              <input
                type="text"
                autoFocus
                placeholder="Ex: Ferme du Sahel"
                value={newFerme.nom}
                onChange={e => setNewFerme(f => ({ ...f, nom: e.target.value }))}
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>

          {/* Localisation */}
          <Field label="Localisation *">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
              <input
                type="text"
                placeholder="Ex: Ziguinchor, Sénégal"
                value={newFerme.localisation}
                onChange={e => setNewFerme(f => ({ ...f, localisation: e.target.value }))}
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>

          {/* Superficie */}
          <Field label="Superficie (ha)">
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Ex: 8.5"
                value={newFerme.superficie}
                onChange={e => setNewFerme(f => ({ ...f, superficie: e.target.value }))}
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>

          {/* Coordonnées GPS */}
          <Field label="Coordonnées GPS">
            <div className="relative">
              <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/30" />
              <input
                type="text"
                placeholder="Ex: 14.7922, -16.9523"
                value={newFerme.coordonneesGPS}
                onChange={e => setNewFerme(f => ({ ...f, coordonneesGPS: e.target.value }))}
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>

          {/* Description */}
          <Field label="Description">
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-4 h-4 text-[#171310]/30" />
              <textarea
                rows={3}
                placeholder="Activité principale, particularités..."
                value={newFerme.description}
                onChange={e => setNewFerme(f => ({ ...f, description: e.target.value }))}
                className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
              />
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E5E3] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowPanel(false)}
            className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={addFerme}
            disabled={!newFerme.nom.trim()}
            className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 text-[13px] font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4 stroke-[2]" />
            Créer la ferme
          </button>
        </div>
      </div>
    </>
  );
}
