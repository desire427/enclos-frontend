import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Plus } from 'lucide-react';
import api from '../../../API/api';

const inputCls  = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';
const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';

const ESPECE_CHOICES = [
  { value: 'bovin',  label: 'Bovin'  },
  { value: 'ovin',   label: 'Ovin'   },
  { value: 'caprin', label: 'Caprin' },
  { value: 'porcin', label: 'Porcin' },
];

export default function ModifierAnimal() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Champs */
  const [nom,           setNom]           = useState('');
  const [espece,        setEspece]        = useState('bovin');
  const [race,          setRace]          = useState('');
  const [sexe,          setSexe]          = useState('femelle');
  const [dateNaissance, setDateNaissance] = useState('');
  const [poids,         setPoids]         = useState('');
  const [presence,     setPresence]     = useState('present');
  const [etatSante,    setEtatSante]    = useState('sain');
  const [couleur,       setCouleur]       = useState('');
  const [observations,  setObservations]  = useState('');

  /* Races dynamiques */
  const [races,         setRaces]         = useState([]);
  const [racesLoading,  setRacesLoading]  = useState(false);

  /* UI */
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [numIdent, setNumIdent] = useState('');

  /* Chargement de l'animal */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAnimal(id);
        setNumIdent(data.numero_identification || '');
        setNom(data.nom || '');
        setEspece(data.espece || 'bovin');
        setRace(data.race ? String(data.race) : '');
        setSexe(data.sexe || 'femelle');
        setDateNaissance(data.date_naissance || '');
        setPoids(data.poids_naissance != null ? String(data.poids_naissance) : '');
        setPresence(data.presence || 'present');
        setEtatSante(data.etat_sante || 'sain');
        setCouleur(data.couleur || '');
        setObservations(data.observations || '');
      } catch (err) {
        setError(err.message || 'Impossible de charger cet animal.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  /* Rechargement des races quand l'espèce change */
  useEffect(() => {
    async function loadRaces() {
      if (!espece) return;
      try {
        setRacesLoading(true);
        const data = await api.getRaces(espece);
        setRaces(Array.isArray(data) ? data : []);
      } catch {
        setRaces([]);
      } finally {
        setRacesLoading(false);
      }
    }
    loadRaces();
  }, [espece]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      await api.updateAnimal(id, {
        nom,
        espece,
        race:            race || null,
        sexe,
        date_naissance:  dateNaissance || null,
        poids_naissance: poids || 0,
        presence,
        etat_sante:      etatSante,
        couleur,
        observations,
      });
      // Si l'état de santé est "gestation", ouvrir le formulaire de gestation
      // Si l'état de santé est "malade" ou "en_traitement", ouvrir le formulaire de suivi santé
      if (etatSante === 'gestation') {
        navigate(`/gestation/ajouter?animal=${id}`);
      } else if (etatSante === 'malade' || etatSante === 'en_traitement') {
        navigate(`/sante/ajouter?animal=${id}&statut=${etatSante === 'malade' ? 'Malade' : 'En traitement'}`);
      } else {
        navigate(`/cheptel/${id}`);
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link to={`/cheptel/${id}`} className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour
      </Link>

      <div className="mt-5">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Modifier un animal</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">
          {numIdent ? `Animal — ${numIdent}` : 'Mettez à jour les informations de l\'animal'}
        </p>
      </div>

      {error   && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}
      {loading && <div className="mt-4 text-[13px] text-[#171310]/50">Chargement…</div>}

      {!loading && (
        <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

          {/* ── Informations générales ── */}
          <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">
            Informations générales
          </p>

          {/* Numéro (lecture seule) + Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#171310] mb-2">Identifiant</label>
              <input type="text" value={numIdent} readOnly
                className="h-11 w-full rounded-lg border border-[#E5E5E3] bg-[#F5F4F2] px-3 text-[13px] text-[#171310]/60 outline-none cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="nom" className="block text-[13px] font-semibold text-[#171310] mb-2">
                Nom <span className="text-[#171310]/40 font-normal">(optionnel)</span>
              </label>
              <input id="nom" type="text" placeholder="Ex: Django" value={nom} onChange={e => setNom(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Espèce + Race */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="espece" className="block text-[13px] font-semibold text-[#171310] mb-2">Espèce</label>
              <div className="relative">
                <select id="espece" className={selectCls} value={espece} onChange={e => setEspece(e.target.value)}>
                  {ESPECE_CHOICES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
              </div>
            </div>
            <div>
              <label htmlFor="race" className="block text-[13px] font-semibold text-[#171310] mb-2">Race</label>
              <div className="relative">
                <select id="race" className={selectCls} value={race} onChange={e => setRace(e.target.value)}>
                  <option value="">— Aucune race —</option>
                  {racesLoading
                    ? <option disabled>Chargement…</option>
                    : races.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)
                  }
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
              </div>
            </div>
          </div>

          {/* Sexe + Date de naissance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#171310] mb-2">Sexe</label>
              <div className="flex gap-3">
                {[['femelle', 'Femelle'], ['male', 'Mâle']].map(([v, lbl]) => (
                  <button key={v} type="button" onClick={() => setSexe(v)}
                    className={`flex-1 h-11 rounded-[10px] border flex items-center justify-center text-[13px] transition-all
                      ${sexe === v ? 'border-[#5C3A21] bg-[#F5F4F2] text-[#5C3A21] font-semibold' : 'border-[#DCDCD9] bg-white text-[#171310] hover:bg-[#F5F4F2]'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="dateNaissance" className="block text-[13px] font-semibold text-[#171310] mb-2">Date de naissance</label>
              <input id="dateNaissance" type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Poids + Couleur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="poids" className="block text-[13px] font-semibold text-[#171310] mb-2">Poids (kg)</label>
              <input id="poids" type="number" step="0.1" min="0" placeholder="0.00" value={poids} onChange={e => setPoids(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="couleur" className="block text-[13px] font-semibold text-[#171310] mb-2">
                Couleur <span className="text-[#171310]/40 font-normal">(optionnel)</span>
              </label>
              <input id="couleur" type="text" placeholder="Ex: Robe tachetée" value={couleur} onChange={e => setCouleur(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Présence + État de santé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="presence" className="block text-[13px] font-semibold text-[#171310] mb-2">Présence</label>
              <div className="relative">
                <select id="presence" className={selectCls} value={presence} onChange={e => setPresence(e.target.value)}>
                  <option value="present">Présent</option>
                  <option value="vendu">Vendu</option>
                  <option value="mort">Mort</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
              </div>
            </div>
            <div>
              <label htmlFor="etatSante" className="block text-[13px] font-semibold text-[#171310] mb-2">État de santé</label>
              <div className="relative">
                <select id="etatSante" className={selectCls} value={etatSante} onChange={e => setEtatSante(e.target.value)}>
                  <option value="sain">Sain</option>
                  <option value="malade">Malade</option>
                  <option value="gestation">Gestation</option>
                  <option value="en_traitement">En traitement</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label htmlFor="observations" className="block text-[13px] font-semibold text-[#171310] mb-2">
              Notes additionnelles
            </label>
            <textarea id="observations" rows={4}
              placeholder="Observations particulières…"
              value={observations} onChange={e => setObservations(e.target.value)}
              className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
            />
          </div>

          <div className="mt-6 border-t border-[#E5E5E3]" />

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link to={`/cheptel/${id}`}
              className="h-9 w-full sm:w-auto rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors inline-flex items-center justify-center">
              Annuler
            </Link>
            <button type="submit" disabled={saving}
              className="h-9 w-full sm:w-auto rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors">
              <Check className="w-4 h-4 stroke-[2]" />
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
