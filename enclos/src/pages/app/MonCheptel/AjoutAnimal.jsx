import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Plus, X, Wheat } from 'lucide-react';
import api from '../../../API/api';
import useAlimRefs from '../../../hooks/useAlimRefs';
import CreateSimpleModal from '../../../components/common/CreateSimpleModal';
import { clean, validateAnimal, validateDate, validateNumber, validateSimpleRecord } from '../../../utils/validation';

const inputCls  = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';
const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';

function SelectField({ id, label, children, value, onChange, required }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>}
      <div className="relative">
        <select id={id} className={selectCls} value={value} onChange={onChange} required={required}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
      </div>
    </div>
  );
}

/* Sélecteur avec bouton "+" pour créer à la volée */
function SelectWithCreate({ id, label, value, onChange, items, loading, onAdd, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select id={id} className={selectCls} value={value} onChange={onChange}>
            <option value="">{placeholder}</option>
            {loading
              ? <option disabled>Chargement…</option>
              : items.map(item => (
                  <option key={item.id} value={item.id}>{item.nom}</option>
                ))
            }
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
        </div>
        <button
          type="button"
          onClick={onAdd}
          title={`Créer : ${label.toLowerCase()}`}
          className="h-11 px-3 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] transition-colors inline-flex items-center"
        >
          <Plus className="w-4 h-4 text-[#5C3A21]" />
        </button>
      </div>
    </div>
  );
}

const ESPECE_CHOICES = [
  { value: 'bovin',  label: 'Bovin'  },
  { value: 'ovin',   label: 'Ovin'   },
  { value: 'caprin', label: 'Caprin' },
  { value: 'porcin', label: 'Porcin' },
];

export default function AjoutAnimal() {
  const navigate = useNavigate();
  const { typeAliments, frequences, loading: refsLoading, reload } = useAlimRefs();

  /* ── Champs animal ── */
  const [nom,           setNom]           = useState('');
  const [espece,        setEspece]        = useState('bovin');
  const [race,          setRace]          = useState('');
  const [sexe,          setSexe]          = useState('femelle');
  const [dateNaissance, setDateNaissance] = useState('');
  const [poids,         setPoids]         = useState('');
  const [presence,      setPresence]      = useState('present');
  const [etatSante,     setEtatSante]     = useState('sain');
  const [couleur,       setCouleur]       = useState('');
  const [observations,  setObservations]  = useState('');

  /* ── Alimentation optionnelle ── */
  const [withAlim,    setWithAlim]    = useState(false);
  const [alimType,    setAlimType]    = useState('');
  const [alimFreq,    setAlimFreq]    = useState('');
  const [alimQte,     setAlimQte]     = useState('');
  const [alimDate,    setAlimDate]    = useState('');

  /* ── Races dynamiques ── */
  const [races,        setRaces]        = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);

  /* ── Modals ── */
  const [showRaceModal,  setShowRaceModal]  = useState(false);
  const [newRaceNom,     setNewRaceNom]     = useState('');
  const [newRaceDesc,    setNewRaceDesc]    = useState('');
  const [creatingRace,   setCreatingRace]   = useState(false);
  const [raceModalError, setRaceModalError] = useState('');

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFreqModal, setShowFreqModal] = useState(false);

  /* ── Soumission ── */
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  /* Charger les races selon l'espèce */
  useEffect(() => {
    async function loadRaces() {
      try {
        setRacesLoading(true);
        const data = await api.getRaces(espece);
        setRaces(Array.isArray(data) ? data : []);
        setRace('');
      } catch {
        setRaces([]);
      } finally {
        setRacesLoading(false);
      }
    }
    loadRaces();
  }, [espece]);

  /* Créer une nouvelle race */
  async function handleCreateRace(e) {
    e.preventDefault();
    const validation = validateSimpleRecord(newRaceNom, newRaceDesc);
    if (validation.message) { setRaceModalError(validation.message); return; }
    setRaceModalError('');
    try {
      setCreatingRace(true);
      const created = await api.createRace({ espece, nom: newRaceNom.trim(), description: newRaceDesc.trim() });
      const updated = await api.getRaces(espece);
      setRaces(Array.isArray(updated) ? updated : []);
      setRace(String(created.id));
      setShowRaceModal(false);
      setNewRaceNom('');
      setNewRaceDesc('');
    } catch (err) {
      setRaceModalError(err.message || 'Erreur.');
    } finally {
      setCreatingRace(false);
    }
  }

  /* Créer type d'aliment à la volée */
  async function handleCreateType(nom, description) {
    const created = await api.createTypeAliment({ nom, description });
    await reload();
    setAlimType(String(created.id));
  }

  /* Créer fréquence à la volée */
  async function handleCreateFreq(nom, description) {
    const created = await api.createFrequence({ nom, description });
    await reload();
    setAlimFreq(String(created.id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const animalValidation = validateAnimal({ nom, espece, sexe, dateNaissance, poids, couleur, observations });
    if (animalValidation.message) {
      setError(animalValidation.message);
      return;
    }
    if (withAlim) {
      const alimError = !alimType ? "Le type d'aliment est obligatoire." : !alimQte ? 'La quantité est obligatoire.' : validateNumber(alimQte, 'La quantité', { positive: true, max: 100000, decimals: 2 }) || validateDate(alimDate, 'La date', { notFuture: true });
      if (alimError) {
        setError(alimError);
        return;
      }
    }
    try {
      setSaving(true);
      // 1. Créer l'animal
      const animal = await api.createAnimal({
        nom: clean(nom),
        espece,
        race:            race          || null,
        sexe,
        date_naissance:  dateNaissance || null,
        poids_naissance: poids         || 0,
        presence,
        etat_sante:      etatSante,
        couleur: clean(couleur),
        observations: clean(observations),
      });

      // 2. Si alimentation renseignée, l'enregistrer
      if (withAlim && alimType && alimQte && alimDate) {
        await api.createAlimentation({
          animal:            animal.id,
          type_aliment:      Number(alimType),
          frequence:         alimFreq ? Number(alimFreq) : null,
          quantite_kg:       Number(alimQte),
          date_alimentation: alimDate,
        });
      }

      navigate('/cheptel');
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/cheptel" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour
      </Link>

      <div className="mt-5">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Ajouter un animal</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">
          Le numéro d&apos;identification sera généré automatiquement.
        </p>
      </div>

      {error && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* ── Informations générales ── */}
        <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">
          Informations générales
        </p>

        {/* Nom */}
        <div className="mb-4">
          <label htmlFor="nom" className="block text-[13px] font-semibold text-[#171310] mb-2">
            Nom <span className="text-[#171310]/40 font-normal">(optionnel)</span>
          </label>
          <input id="nom" type="text" placeholder="Ex: Django" value={nom} onChange={e => setNom(e.target.value)} className={inputCls} />
        </div>

        {/* Espèce + Race */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="espece" label="Espèce" value={espece} onChange={e => setEspece(e.target.value)} required>
            {ESPECE_CHOICES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>

          <div>
            <label htmlFor="race" className="block text-[13px] font-semibold text-[#171310] mb-2">Race</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select id="race" className={selectCls} value={race} onChange={e => setRace(e.target.value)}>
                  <option value="">— Aucune race —</option>
                  {racesLoading
                    ? <option disabled>Chargement…</option>
                    : races.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)
                  }
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
              </div>
              <button type="button" onClick={() => setShowRaceModal(true)}
                className="h-11 px-3 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] transition-colors inline-flex items-center"
                title="Créer une nouvelle race">
                <Plus className="w-4 h-4 text-[#5C3A21]" />
              </button>
            </div>
          </div>
        </div>

        {/* Sexe */}
        <div className="mt-4">
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

        {/* ── Données physiques ── */}
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Données physiques &amp; date</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateNaissance" className="block text-[13px] font-semibold text-[#171310] mb-2">Date de naissance</label>
              <input id="dateNaissance" type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="poids" className="block text-[13px] font-semibold text-[#171310] mb-2">Poids initial (kg)</label>
              <input id="poids" type="number" placeholder="0.00" step="0.1" min="0" value={poids} onChange={e => setPoids(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="couleur" className="block text-[13px] font-semibold text-[#171310] mb-2">
              Couleur <span className="text-[#171310]/40 font-normal">(optionnel)</span>
            </label>
            <input id="couleur" type="text" placeholder="Ex: Robe tachetée noire et blanche" value={couleur} onChange={e => setCouleur(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* ── Présence + État de santé ── */}
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Statut</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField id="presence" label="Présence" value={presence} onChange={e => setPresence(e.target.value)}>
              <option value="present">Présent</option>
              <option value="vendu">Vendu</option>
              <option value="mort">Mort</option>
            </SelectField>
            <SelectField id="etatSante" label="État de santé" value={etatSante} onChange={e => setEtatSante(e.target.value)}>
              <option value="sain">Sain</option>
              <option value="malade">Malade</option>
              <option value="gestation">Gestation</option>
              <option value="en_traitement">En traitement</option>
            </SelectField>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="mt-4">
          <label htmlFor="observations" className="block text-[13px] font-semibold text-[#171310] mb-2">Notes additionnelles</label>
          <textarea id="observations" rows={3} placeholder="Observations particulières, antécédents..."
            value={observations} onChange={e => setObservations(e.target.value)}
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>

        {/* ── Alimentation initiale (optionnelle) ── */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setWithAlim(v => !v)}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#5C3A21] hover:text-[#3B2313] transition-colors"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
              ${withAlim ? 'bg-[#5C3A21] border-[#5C3A21]' : 'border-[#DCDCD9]'}`}>
              {withAlim && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </div>
            <Wheat className="w-4 h-4" />
            Ajouter une alimentation initiale
          </button>

          {withAlim && (
            <div className="mt-4 p-4 rounded-xl border border-[#E5E5E3] bg-[#FAFAF9] space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectWithCreate
                  id="alimType"
                  label="Type d'aliment"
                  value={alimType}
                  onChange={e => setAlimType(e.target.value)}
                  items={typeAliments}
                  loading={refsLoading}
                  onAdd={() => setShowTypeModal(true)}
                  placeholder="Sélectionner"
                />
                <SelectWithCreate
                  id="alimFreq"
                  label="Fréquence"
                  value={alimFreq}
                  onChange={e => setAlimFreq(e.target.value)}
                  items={frequences}
                  loading={refsLoading}
                  onAdd={() => setShowFreqModal(true)}
                  placeholder="Sélectionner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alimQte" className="block text-[13px] font-semibold text-[#171310] mb-2">Quantité (kg)</label>
                  <input id="alimQte" type="number" placeholder="Ex: 12.5" step="0.1" min="0"
                    value={alimQte} onChange={e => setAlimQte(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="alimDate" className="block text-[13px] font-semibold text-[#171310] mb-2">Date</label>
                  <input id="alimDate" type="date" value={alimDate} onChange={e => setAlimDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-[#E5E5E3]" />

        <div className="mt-4 flex items-center justify-end gap-3">
          <Link to="/cheptel"
            className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors inline-flex items-center">
            Annuler
          </Link>
          <button type="submit" disabled={saving}
            className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
            <Check className="w-4 h-4 stroke-[2]" />
            {saving ? 'Enregistrement…' : "Enregistrer l'animal"}
          </button>
        </div>
      </form>

      {/* ── Modal création de race ── */}
      {showRaceModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !creatingRace && setShowRaceModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[440px]">
              <form onSubmit={handleCreateRace}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
                  <h3 className="font-serif text-[17px] font-medium text-[#171310]">Créer une nouvelle race</h3>
                  <button type="button" onClick={() => !creatingRace && setShowRaceModal(false)} disabled={creatingRace}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors">
                    <X className="w-4 h-4 text-[#171310]/60" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[12px] text-[#171310]/60">
                    Espèce : <span className="font-semibold text-[#171310]">
                      {ESPECE_CHOICES.find(e => e.value === espece)?.label}
                    </span>
                  </p>
                  {raceModalError && <p className="text-red-600 text-[12px]">{raceModalError}</p>}
                  <div>
                    <label htmlFor="newRaceNom" className="block text-[13px] font-semibold text-[#171310] mb-2">
                      Nom de la race <span className="text-red-500">*</span>
                    </label>
                    <input id="newRaceNom" type="text" placeholder="Ex: Saanen, Holstein, Ndama…"
                      value={newRaceNom} onChange={e => setNewRaceNom(e.target.value)}
                      required disabled={creatingRace} autoFocus className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="newRaceDesc" className="block text-[13px] font-semibold text-[#171310] mb-2">
                      Description <span className="text-[#171310]/40 font-normal">(optionnel)</span>
                    </label>
                    <textarea id="newRaceDesc" rows={2} placeholder="Caractéristiques, origine…"
                      value={newRaceDesc} onChange={e => setNewRaceDesc(e.target.value)}
                      disabled={creatingRace}
                      className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E3]">
                  <button type="button" onClick={() => setShowRaceModal(false)} disabled={creatingRace}
                    className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors disabled:opacity-60">
                    Annuler
                  </button>
                  <button type="submit" disabled={creatingRace}
                    className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4 stroke-[2]" />
                    {creatingRace ? 'Création…' : 'Créer la race'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Modals type d'aliment et fréquence ── */}
      <CreateSimpleModal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Créer un type d'aliment"
        label="Nom du type"
        placeholder="Ex: Foin de luzerne, Granulés…"
        onConfirm={handleCreateType}
      />
      <CreateSimpleModal
        open={showFreqModal}
        onClose={() => setShowFreqModal(false)}
        title="Créer une fréquence"
        label="Nom de la fréquence"
        placeholder="Ex: Quotidienne, Biquotidienne…"
        onConfirm={handleCreateFreq}
      />
    </>
  );
}
