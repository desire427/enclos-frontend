import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Trash2 } from 'lucide-react';
import api from '../../../API/api';
import useAnimals from '../../../hooks/useAnimals';

const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';
const inputCls  = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';

function animalOptionLabel(a) {
  const nom    = a.nom?.trim() ? ` — ${a.nom}` : '';
  const espece = a.espece_display || a.espece || '';
  return `${a.numero_identification}${nom}${espece ? ` (${espece})` : ''}`;
}

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>
      <div className="relative">
        <select id={id} className={selectCls} value={value} onChange={onChange}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
      </div>
    </div>
  );
}

export default function ModifierAlimentation() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { animals, loading: animalsLoading } = useAnimals();

  /* Champs */
  const [animalId,    setAnimalId]    = useState('');
  const [typeAliment, setTypeAliment] = useState('');
  const [quantite,    setQuantite]    = useState('');
  const [frequence,   setFrequence]   = useState('');
  const [date,        setDate]        = useState('');
  const [note,        setNote]        = useState('');

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [showDelete, setShowDelete] = useState(false);

  /* Chargement */
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const data = await api.getAlimentation(id);
        setAnimalId(String(data.animal?.id || data.animal || ''));
        setTypeAliment(data.type_aliment || '');
        setQuantite(String(data.quantite_kg || ''));
        setFrequence(data.frequence || '');
        setDate(data.date_alimentation || '');
        setNote(data.note || '');
      } catch (err) {
        setError(err.message || 'Impossible de charger l\'alimentation.');
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      await api.updateAlimentation(id, {
        animal:            Number(animalId),
        type_aliment:      typeAliment,
        quantite_kg:       Number(quantite),
        frequence,
        date_alimentation: date,
        note,
      });
      navigate('/alimentation');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.deleteAlimentation(id);
      navigate('/alimentation');
    } catch (err) {
      setError(err.message || 'Impossible de supprimer.');
    }
  }

  return (
    <>
      <Link to="/alimentation" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour
      </Link>

      <div className="mt-5">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Modifier l&apos;alimentation</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">Modifiez les informations de l&apos;alimentation</p>
      </div>

      {error && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* Animal + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="animal" label="Animal" value={animalId} onChange={e => setAnimalId(e.target.value)}>
            <option value="">Sélectionner un animal</option>
            {animalsLoading
              ? <option disabled>Chargement…</option>
              : animals.map(a => (
                  <option key={a.id} value={a.id}>{animalOptionLabel(a)}</option>
                ))
            }
          </SelectField>

          <div>
            <label htmlFor="typeAliment" className="block text-[13px] font-semibold text-[#171310] mb-2">Type d&apos;aliment</label>
            <input
              id="typeAliment"
              type="text"
              placeholder="Ex: Foin de luzerne"
              value={typeAliment}
              onChange={e => setTypeAliment(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Quantité + Fréquence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="quantite" className="block text-[13px] font-semibold text-[#171310] mb-2">Quantité (kg)</label>
            <input
              id="quantite"
              type="number"
              step="0.1"
              min="0"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
              className={inputCls}
            />
          </div>
          <SelectField id="frequence" label="Fréquence" value={frequence} onChange={e => setFrequence(e.target.value)}>
            <option value="">Sélectionner la fréquence</option>
            <option value="Quotidienne">Quotidienne</option>
            <option value="Quotidienne (Matin)">Quotidienne (Matin)</option>
            <option value="Biquotidienne">Biquotidienne</option>
            <option value="Tri-quotidienne">Tri-quotidienne</option>
            <option value="Hebdomadaire">Hebdomadaire</option>
          </SelectField>
        </div>

        {/* Date */}
        <div className="mt-4">
          <label htmlFor="date" className="block text-[13px] font-semibold text-[#171310] mb-2">Date</label>
          <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>

        {/* Note */}
        <div className="mt-4">
          <label htmlFor="note" className="block text-[13px] font-semibold text-[#171310] mb-2">Remarque</label>
          <textarea
            id="note"
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Observations particulières..."
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>

        <div className="mt-6 border-t border-[#E5E5E3]" />

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => setShowDelete(true)} className="h-9 rounded-lg bg-[#171310] hover:bg-black text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4 stroke-[1.8]" />
            Supprimer
          </button>
          <div className="flex items-center gap-3">
            <Link to="/alimentation" className="text-[13px] font-medium text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
              Annuler
            </Link>
            <button type="submit" disabled={saving} className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
              <Check className="w-4 h-4 stroke-[2]" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>

      {showDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[400px] p-6">
              <h3 className="font-serif text-[18px] font-medium text-[#171310] mb-2">Supprimer cette alimentation ?</h3>
              <p className="text-[13px] text-[#171310]/70 leading-relaxed mb-6">
                Cette action est irréversible.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowDelete(false)} className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors">
                  Annuler
                </button>
                <button type="button" onClick={handleDelete} className="h-9 rounded-lg bg-[#171310] hover:bg-black text-white px-4 text-[13px] font-medium transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
