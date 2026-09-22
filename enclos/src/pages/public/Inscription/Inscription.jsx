import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserRound, Warehouse, Mail, LockKeyhole,
  Eye, EyeOff, ArrowRight,
  MapPin, Ruler, Map, FileText,
} from 'lucide-react';
import PublicHeader from '../../../components/common/PublicHeader';
import PublicFooter from '../../../components/common/PublicFooter';
import api from '../../../API/api';
import { clean, validateRegistration } from '../../../utils/validation';

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function Inscription() {
  const navigate = useNavigate();

  /* ── Utilisateur (classe Utilisateur) ── */
  const [nom,          setNom]          = useState('');
  const [email,        setEmail]        = useState('');
  const [telephone,    setTelephone]    = useState('');
  const [motDePasse,   setMotDePasse]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [conditions,   setConditions]   = useState(false);

  /* ── Ferme principale (classe Ferme) ── */
  const [nomFerme,     setNomFerme]     = useState('');
  const [localisation, setLocalisation] = useState('');
  const [superficie,   setSuperficie]   = useState('');
  const [coordGPS,     setCoordGPS]     = useState('');
  const [description,  setDescription]  = useState('');

  /* ── Plan (classe Plan) ── */
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const plan = plans.find(p => String(p.id) === String(selectedPlan)) || null;

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await api.getPlans();
        setPlans(data);
        if (data.length) setSelectedPlan(String(data[0].id));
      } catch (err) {
        setError(err.message || 'Impossible de charger les forfaits.');
      }
    }
    loadPlans();
  }, []);

  async function handleContinue() {
    setError('');

    const validation = validateRegistration({ nom, email, telephone, motDePasse, nomFerme, localisation, superficie, coordGPS, description, conditions, selectedPlan });
    setValidationErrors(validation.errors);
    if (validation.message) {
      setError(validation.message);
      return;
    }

    const normalizedName = clean(nom);
    const firstName = normalizedName.split(/\s+/)[0] || normalizedName;
    const lastName = normalizedName.split(/\s+/).slice(1).join(' ') || '';
    const username = clean(email).split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]+/g, '_');

    setLoading(true);
    try {
      const payload = {
        username,
        email: clean(email).toLowerCase(),
        password: motDePasse,
        password_confirm: motDePasse,
        first_name: firstName,
        last_name: lastName,
        telephone: clean(telephone),
        nom_ferme: clean(nomFerme),
        localisation: clean(localisation),
        superficie: superficie ? Number(superficie) : 0,
        coordonnees_gps: clean(coordGPS),
        description: clean(description),
      };

      sessionStorage.setItem('enclos_pending_registration', JSON.stringify(payload));
      navigate('/paiement', { state: { selectedPlan: Number(selectedPlan), registration: payload } });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader mode="steps" currentStep={1} />

      <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-8 pb-12">
        <div className="max-w-5xl mx-auto">

          <h1 className="font-serif text-[32px] leading-tight text-[#171310] mb-2">
            Créer votre compte
          </h1>
          <p className="text-[#171310]/60 text-[15px] mb-8">
            Renseignez vos informations personnelles et celles de votre première ferme.
          </p>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

            {/* ══════════════════════════════════════
                FORMULAIRE
            ══════════════════════════════════════ */}
            <section className="border border-[#E5E5E3] rounded-2xl p-6 sm:p-8 bg-white">

              {/* ── Compte ── */}
              <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">
                Votre compte
              </p>

              {/* Nom + Email */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Nom complet <span className="text-red-700">*</span>
                  </label>
                  <FieldInput icon={<UserRound className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="text"
                      placeholder="Alphonse Desire"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.nom} />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Email <span className="text-red-700">*</span>
                  </label>
                  <FieldInput icon={<Mail className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="email"
                      placeholder="alphonse@domaine.sn"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.email} />
                </div>
              </div>

              {/* Téléphone + Mot de passe */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Téléphone <span className="text-red-700">*</span>
                  </label>
                  <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center overflow-hidden bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                    <div className="px-3 h-full flex items-center bg-[#F5F4F2] border-r border-[#DCDCD9] text-[13px] font-medium text-[#171310]/60 flex-shrink-0">
                      +221
                    </div>
                    <input
                      type="tel"
                      placeholder="77 000 00 00"
                      value={telephone}
                      onChange={e => setTelephone(e.target.value)}
                      className="w-full px-3 text-[14px] bg-transparent outline-none"
                    />
                  </div>
                  <FieldError message={validationErrors.telephone} />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Mot de passe <span className="text-red-700">*</span>
                  </label>
                  <FieldInput
                    icon={<LockKeyhole className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="text-[#171310]/60 flex-shrink-0"
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword
                          ? <EyeOff className="w-4 h-4 stroke-[1.6]" />
                          : <Eye    className="w-4 h-4 stroke-[1.6]" />}
                      </button>
                    }
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
                      value={motDePasse}
                      onChange={e => setMotDePasse(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.motDePasse} />
                </div>
              </div>

              {/* ── Ferme principale ── */}
              <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">
                Votre ferme principale
              </p>

              {/* Nom ferme + Localisation */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Nom de la ferme <span className="text-red-700">*</span>
                  </label>
                  <FieldInput icon={<Warehouse className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="text"
                      placeholder="Bergerie du Baobab"
                      value={nomFerme}
                      onChange={e => setNomFerme(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.nomFerme} />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Localisation <span className="text-red-700">*</span>
                  </label>
                  <FieldInput icon={<MapPin className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="text"
                      placeholder="Ex: Ziguinchor, Sénégal"
                      value={localisation}
                      onChange={e => setLocalisation(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.localisation} />
                </div>
              </div>

              {/* Superficie + Coordonnées GPS */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Superficie (ha)
                  </label>
                  <FieldInput icon={<Ruler className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ex: 8.5"
                      value={superficie}
                      onChange={e => setSuperficie(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.superficie} />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                    Coordonnées GPS
                  </label>
                  <FieldInput icon={<Map className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />}>
                    <input
                      type="text"
                      placeholder="Ex: 14.7922, -16.9523"
                      value={coordGPS}
                      onChange={e => setCoordGPS(e.target.value)}
                      className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                    />
                  </FieldInput>
                  <FieldError message={validationErrors.coordGPS} />
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-[11px] w-4 h-4 text-[#171310]/50 stroke-[1.6]" />
                  <textarea
                    rows={3}
                    placeholder="Activité principale, particularités de l'exploitation..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full resize-none rounded-[10px] border border-[#DCDCD9] bg-white pl-9 pr-3 py-2.5 text-[14px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] focus:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all"
                  />
                </div>
                <FieldError message={validationErrors.description} />
              </div>

              {/* Conditions */}
              <label className="flex items-center gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={conditions}
                  onChange={e => setConditions(e.target.checked)}
                  className="w-4 h-4 accent-[#171310]"
                />
                <span className="text-[13px] text-[#171310]/70">
                  J'accepte les{' '}
                  <a href="#" className="underline text-[#171310]">Conditions d'Utilisation</a>
                </span>
              </label>
              <FieldError message={validationErrors.conditions || validationErrors.plan} />

              {error && <div className="mb-4 text-sm text-red-700">{error}</div>}

              {/* Bouton */}
              <button
                type="button"
                disabled={loading}
                onClick={handleContinue}
                className="w-full h-[48px] rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:translate-y-px disabled:opacity-70"
              >
                {loading ? 'Création...' : 'Continuer vers le paiement'}
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </button>
            </section>

            {/* ══════════════════════════════════════
                FORFAITS
            ══════════════════════════════════════ */}
            <aside className="border border-[#E5E5E3] rounded-2xl p-6 h-fit">
              <h2 className="font-serif text-xl text-[#171310] mb-4">Votre forfait</h2>

              {plans.length === 0 && (
                <div className="text-[13px] text-[#171310]/60">Chargement des forfaits...</div>
              )}

              {plans.map(p => {
                const active = String(selectedPlan) === String(p.id);
                return (
                  <label key={p.id} className="cursor-pointer block mb-3">
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={active}
                      onChange={() => setSelectedPlan(String(p.id))}
                      className="sr-only"
                    />
                    <div className={`h-[64px] rounded-lg px-4 flex items-center justify-between transition-colors
                      ${active ? 'bg-[#171310] text-white' : 'border border-[#E5E5E3] text-[#171310]'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-[14px] h-[14px] rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center
                          ${active ? 'border-white' : 'border-[#777]'}`}>
                          {active && <span className="w-[6px] h-[6px] rounded-full bg-white block" />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold">{p.nom}</span>
                            {active && (
                              <span className="text-[10px] bg-white text-[#171310] rounded px-1.5 py-0.5 font-medium">
                                Sélectionné
                              </span>
                            )}
                          </div>
                          <div className={`text-[12px] ${active ? 'text-white/70' : 'text-[#171310]/50'}`}>{p.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-semibold">{Number(p.prix).toLocaleString('fr-FR')} FCFA</div>
                        <div className={`text-[11px] ${active ? 'text-white/70' : 'text-[#171310]/50'}`}>/ mois</div>
                      </div>
                    </div>
                  </label>
                );
              })}

              {plan && (
                <div className="mt-1 rounded-lg bg-[#F5F4F2] px-4 py-3 text-[12px] text-[#171310]/60 space-y-1.5">
                  <div>
                    {plan.nb_fermes_max ? `${plan.nb_fermes_max} ferme${plan.nb_fermes_max > 1 ? 's' : ''}` : 'Fermes illimitées'}
                    {' · '}
                    {plan.nb_animaux_max ? `${plan.nb_animaux_max} animaux` : 'Animaux illimités'}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className={plan.acces_ia ? 'text-emerald-700' : 'text-[#171310]/40'}>
                      {plan.acces_ia ? '✓' : '✗'} Accès IA
                    </span>
                    <span className={plan.acces_support ? 'text-emerald-700' : 'text-[#171310]/40'}>
                      {plan.acces_support ? '✓' : '✗'} Support
                    </span>
                    <span className={plan.acces_analyses ? 'text-emerald-700' : 'text-[#171310]/40'}>
                      {plan.acces_analyses ? '✓' : '✗'} Analyses
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 h-[56px] bg-[#F5F4F2] rounded-lg px-4 flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#171310]">Total :</span>
                <span className="text-[16px] font-bold text-[#171310]">
                  {plan?.prix ? `${Number(plan.prix).toLocaleString('fr-FR')} FCFA / mois` : '—'}
                </span>
              </div>
            </aside>
          </div>

          {/* Lien connexion */}
          <p className="text-[13px] text-[#171310]/60 mt-6 text-center">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-[#5C3A21] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </main>

      <PublicFooter variant="simple" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper champ avec icône + suffix optionnel                         */
/* ------------------------------------------------------------------ */
function FieldInput({ icon, suffix, children }) {
  return (
    <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 gap-[10px] bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
      {icon}
      {children}
      {suffix}
    </div>
  );
}

function FieldError({ message }) {
  return message ? <p className="mt-1 text-[11px] text-red-700">{message}</p> : null;
}
