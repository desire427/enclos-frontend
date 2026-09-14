import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

export default function ModifierSante() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew          = !id || id === 'ajouter';

  // Animal pré-sélectionné si on vient de ModifierAnimal ou DetailAnimal
  const animalFromURL = searchParams.get('animal') || '';
  // État de santé pré-rempli si transmis dans l'URL
  const statutFromURL = searchParams.get('statut') || '';

  const { animals, loading: animalsLoading } = useAnimals();

  /* Champs — uniquement les champs réels du modèle SuiviSante */
  const [animalId,    setAnimalId]    = useState(animalFromURL);
  const [statut,      setStatut]      = useState(statutFromURL || 'Malade');
  const [dateDebut,   setDateDebut]   = useState('');
  const [dateProchain,setDateProchain]= useState('');
  const [note,        setNote]        = useState('');
  const [animalLabel, setAnimalLabel] = useState('');

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [showDelete, setShowDelete] = useState(false);

  /* Chargement en mode modification */
  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const data = await api.getSanteById(id);
        setAnimalId(String(data.animal || data.animal_id || ''));
        setStatut(data.statut || 'Malade');
        setDateDebut(data.date_debut || '');
        setDateProchain(data.date_prochaine_consultation || '');
        setNote(data.note || data.notes || '');
        setAnimalLabel(data.animal_nom || data.animal_id || '');
      } catch (err) {
        setError(err.message || 'Impossible de charger le suivi.');
      }
    }
    load();
  }, [id, isNew]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      const payload = {
        statut,
        date_debut:                   dateDebut    || null,
        date_prochaine_consultation:  dateProchain || null,
        note,
        ...(isNew ? { animal: Number(animalId) } : {}),
      };
      if (isNew) {
        await api.createSante(payload);
      } else {
        await api.updateSante(id, payload);
      }
      // Retourner à la fiche animal si on vient de là, sinon liste suivi
      if (animalFromURL) {
        navigate(`/cheptel/${animalFromURL}`);
      } else {
        navigate('/sante');
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.deleteSante(id);
      navigate('/sante');
    } catch (err) {
      setError(err.message || 'Impossible de supprimer.');
    }
  }

  const backPath = isNew ? '/sante' : `/sante/${id}`;

  return (
    <>
      <Link to={backPath} className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        {isNew ? 'Retour au suivi santé' : 'Retour au détail'}
      </Link>

      <div className="mt-5">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">
          {isNew ? 'Nouveau suivi santé' : `Modifier — ${animalLabel || id}`}
        </h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">
          {isNew ? 'Enregistrez un nouveau suivi de santé' : 'Mettez à jour le suivi de santé'}
        </p>
      </div>

      {error && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* Animal (création uniquement) */}
        {isNew && (
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Animal</p>
            <label htmlFor="animal" className="block text-[13px] font-semibold text-[#171310] mb-2">Animal concerné</label>
            <div className="relative">
              <select id="animal" className={selectCls} value={animalId} onChange={e => setAnimalId(e.target.value)} required>
                <option value="">Sélectionner un animal</option>
                {animalsLoading
                  ? <option disabled>Chargement…</option>
                  : animals.map(a => <option key={a.id} value={a.id}>{animalOptionLabel(a)}</option>)
                }
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
            </div>
          </div>
        )}

        {/* Données du suivi */}
        <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Données du suivi</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#171310] mb-2">Statut</label>
            <div className="relative">
              <select value={statut} onChange={e => setStatut(e.target.value)} className={selectCls}>
                <option value="Malade">Malade</option>
                <option value="En traitement">En traitement</option>
                <option value="Guéri">Guéri</option>
                <option value="Sous surveillance">Sous surveillance</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#171310] mb-2">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required className={inputCls} />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[#171310] mb-2">
            Prochaine consultation <span className="text-[#171310]/40 font-normal">(optionnel)</span>
          </label>
          <input type="date" value={dateProchain} onChange={e => setDateProchain(e.target.value)} className={inputCls} />
        </div>

        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[#171310] mb-2">Note</label>
          <textarea
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Observations, traitements, recommandations..."
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>

        <div className="mt-6 border-t border-[#E5E5E3]" />

        <div className="mt-4 flex items-center justify-between">
          {!isNew ? (
            <button type="button" onClick={() => setShowDelete(true)} className="h-9 rounded-lg bg-[#171310] hover:bg-black text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
              <Trash2 className="w-4 h-4 stroke-[1.8]" />
              Supprimer
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <Link to={backPath} className="text-[13px] font-medium text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
              Annuler
            </Link>
            <button type="submit" disabled={saving} className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
              <Check className="w-4 h-4 stroke-[2]" />
              {saving ? 'Enregistrement…' : (isNew ? 'Enregistrer' : 'Sauvegarder')}
            </button>
          </div>
        </div>
      </form>

      {showDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[400px] p-6">
              <h3 className="font-serif text-[18px] font-medium text-[#171310] mb-2">Supprimer ce suivi ?</h3>
              <p className="text-[13px] text-[#171310]/70 leading-relaxed mb-6">
                Cette action est irréversible. Le suivi santé sera définitivement supprimé.
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
