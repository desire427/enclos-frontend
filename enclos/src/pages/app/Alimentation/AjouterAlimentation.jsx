import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react';
import api from '../../../API/api';
import useAnimals from '../../../hooks/useAnimals';
import useAlimRefs from '../../../hooks/useAlimRefs';
import CreateSimpleModal from '../../../components/common/CreateSimpleModal';
import FieldError from '../../../components/common/FieldError';
import { clean, validateAlimentation } from '../../../utils/validation';

const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';
const inputCls  = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';

function animalOptionLabel(a) {
  const nom    = a.nom?.trim() ? ` — ${a.nom}` : '';
  const espece = a.espece_display || a.espece || '';
  return `${a.numero_identification}${nom}${espece ? ` (${espece})` : ''}`;
}

/* Sélecteur avec bouton "+" pour créer à la volée */
function SelectWithCreate({ id, label, value, onChange, items, loading, onAdd, placeholder, required, error }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            id={id}
            className={selectCls}
            value={value}
            onChange={onChange}
            required={required}
          >
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
          title={`Créer un(e) ${label.toLowerCase()}`}
          className="h-11 px-3 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] transition-colors inline-flex items-center"
        >
          <Plus className="w-4 h-4 text-[#5C3A21]" />
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

export default function AjouterAlimentation() {
  const navigate = useNavigate();
  const { animals, loading: animalsLoading }                      = useAnimals();
  const { typeAliments, frequences, loading: refsLoading, reload } = useAlimRefs();

  /* Champs */
  const [animal,      setAnimal]      = useState('');
  const [typeAliment, setTypeAliment] = useState('');
  const [quantite,    setQuantite]    = useState('');
  const [frequence,   setFrequence]   = useState('');
  const [date,        setDate]        = useState('');
  const [note,        setNote]        = useState('');

  /* Modals */
  const [showTypeModal, setShowTypeModal]   = useState(false);
  const [showFreqModal, setShowFreqModal]   = useState(false);

  /* Soumission */
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(field, setter, event) {
    setter(event.target.value);
    setFieldErrors(previous => ({ ...previous, [field]: '' }));
  }

  /* Créer un type d'aliment à la volée */
  async function handleCreateType(nom, description) {
    const created = await api.createTypeAliment({ nom, description });
    await reload();
    setTypeAliment(String(created.id));
  }

  /* Créer une fréquence à la volée */
  async function handleCreateFreq(nom, description) {
    const created = await api.createFrequence({ nom, description });
    await reload();
    setFrequence(String(created.id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validation = validateAlimentation({ animal, typeAliment, frequence, quantite, date, note });
    setFieldErrors(validation.errors);
    if (validation.message) {
      return;
    }
    try {
      setSaving(true);
      await api.createAlimentation({
        animal:            Number(animal),
        type_aliment:      typeAliment  ? Number(typeAliment)  : null,
        frequence:         frequence    ? Number(frequence)    : null,
        quantite_kg:       Number(quantite),
        date_alimentation: date,
        note: clean(note),
      });
      navigate('/alimentation');
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/alimentation" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour à la liste
      </Link>

      <div className="mt-5">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Ajouter une alimentation</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">Renseignez les informations de l&apos;alimentation</p>
      </div>

      {error && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}

      <form noValidate onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* ── Animal ── */}
        <div className="mb-4">
          <label htmlFor="animal" className="block text-[13px] font-semibold text-[#171310] mb-2">Animal</label>
          <div className="relative">
            <select
              id="animal"
              className={selectCls}
              value={animal}
              onChange={e => updateField('animal', setAnimal, e)}
              required
            >
              <option value="">Sélectionner un animal</option>
              {animalsLoading
                ? <option disabled>Chargement…</option>
                : animals.map(a => (
                    <option key={a.id} value={a.id}>{animalOptionLabel(a)}</option>
                  ))
              }
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
          </div>
          <FieldError message={fieldErrors.animal} />
        </div>

        {/* ── Type d'aliment + Fréquence ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectWithCreate
            id="typeAliment"
            label="Type d'aliment"
            value={typeAliment}
            onChange={e => setTypeAliment(e.target.value)}
            items={typeAliments}
            loading={refsLoading}
            onAdd={() => setShowTypeModal(true)}
            placeholder="Sélectionner"
            required
            error={fieldErrors.typeAliment}
          />
          <SelectWithCreate
            id="frequence"
            label="Fréquence"
            value={frequence}
            onChange={e => setFrequence(e.target.value)}
            items={frequences}
            loading={refsLoading}
            onAdd={() => setShowFreqModal(true)}
            placeholder="Sélectionner"
            required
            error={fieldErrors.frequence}
          />
        </div>

        {/* ── Quantité + Date ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="quantite" className="block text-[13px] font-semibold text-[#171310] mb-2">Quantité (kg)</label>
            <input
              id="quantite"
              type="number"
              placeholder="Ex: 12.5"
              step="0.1"
              min="0"
              value={quantite}
              onChange={e => updateField('quantite', setQuantite, e)}
              required
              className={inputCls}
            />
            <FieldError message={fieldErrors.quantite} />
          </div>
          <div>
            <label htmlFor="date" className="block text-[13px] font-semibold text-[#171310] mb-2">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => updateField('date', setDate, e)}
              required
              className={inputCls}
            />
            <FieldError message={fieldErrors.date} />
          </div>
        </div>

        {/* ── Note ── */}
        <div className="mt-4">
          <label htmlFor="note" className="block text-[13px] font-semibold text-[#171310] mb-2">
            Remarque <span className="text-[#171310]/40 font-normal">(optionnel)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            placeholder="Observations particulières..."
            value={note}
            onChange={e => updateField('note', setNote, e)}
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
          <FieldError message={fieldErrors.note} />
        </div>

        <div className="mt-6 border-t border-[#E5E5E3]" />

        <div className="mt-4 flex items-center justify-end gap-4">
          <Link to="/alimentation" className="text-[13px] font-medium text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[1.8]" />
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </div>
      </form>

      {/* Modals création à la volée */}
      <CreateSimpleModal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Créer un type d'aliment"
        label="Nom du type"
        placeholder="Ex: Foin de luzerne, Granulés, Ensilage…"
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
