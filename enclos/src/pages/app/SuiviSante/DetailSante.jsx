import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Calendar, Clock, Pencil, Stethoscope } from 'lucide-react';
import api from '../../../API/api';
import VoiceDictationButton from '../../../components/common/VoiceDictationButton';

const STATUT_BADGE = {
  'Malade': 'bg-red-50 text-red-600',
  'En traitement': 'bg-orange-50 text-orange-600',
  'Guéri': 'bg-emerald-50 text-emerald-600',
  'Sous surveillance': 'bg-blue-50 text-blue-600',
};

export default function DetailSante() {
  const { id } = useParams();
  const [sante, setSante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animal, setAnimal] = useState(null);
  const [ordonnances, setOrdonnances] = useState([]);
  const [showOrdonnanceForm, setShowOrdonnanceForm] = useState(false);
  const [ordonnanceError, setOrdonnanceError] = useState('');
  const [savingOrdonnance, setSavingOrdonnance] = useState(false);
  const ordonnanceFormRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSanteById(id);
        setSante(data);
        const linkedAnimalId = data.animal_id || data.animal;
        const [animalData, prescriptionData] = await Promise.all([
          api.getAnimal(linkedAnimalId).catch(() => null),
          api.getOrdonnances(linkedAnimalId).catch(() => []),
        ]);
        setAnimal(animalData);
        const prescriptions = Array.isArray(prescriptionData) ? prescriptionData : (prescriptionData?.results || []);
        setOrdonnances(prescriptions.filter(item => Number(item.suivi_sante) === Number(id)));
      } catch (err) {
        setError(err.message || 'Impossible de charger ce suivi santé.');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  function applyOrdonnanceDictation(transcript) {
    const form = ordonnanceFormRef.current;
    if (!form) return;
    const split = transcript.match(/\b(?:instructions?|consignes?|posologie)\b\s*[:,—-]?\s*(.*)$/i);
    const medicaments = split ? transcript.slice(0, split.index).trim() : transcript;
    if (medicaments) form.elements.namedItem('medicaments').value = medicaments.replace(/^\s*(?:m[eé]dicaments?)\s*[:,—-]?\s*/i, '');
    if (split?.[1]) form.elements.namedItem('instructions').value = split[1].trim();
  }

  async function handleCreateOrdonnance(event) {
    event.preventDefault();
    setOrdonnanceError('');
    const form = event.currentTarget;
    const payload = new FormData(form);
    payload.append('animal', String(sante.animal_id || sante.animal));
    payload.append('suivi_sante', String(id));
    try {
      setSavingOrdonnance(true);
      const created = await api.createOrdonnance(payload);
      setOrdonnances(previous => [created, ...previous]);
      setShowOrdonnanceForm(false);
      form.reset();
    } catch (err) {
      setOrdonnanceError(err.message || 'Impossible d’enregistrer cette ordonnance.');
    } finally {
      setSavingOrdonnance(false);
    }
  }

  if (loading) return <div className="text-[12px] text-[#171310]/50">Chargement du suivi...</div>;
  if (error) return <div className="text-[12px] text-red-600">{error}</div>;
  if (!sante) return <div className="text-[12px] text-[#171310]/50">Aucune donnée.</div>;

  const animalName = sante.animal_nom || sante.animal?.nom || sante.animalId || 'Animal';
  const animalId = sante.animal_id || sante.animal?.id || sante.animal || '';
  const stat = sante.statut || sante.status || 'Non précisé';
  const dateDebut = sante.date_debut || sante.dateDebut || '—';
  const dateVet = sante.date_passage_veterinaire || sante.datePassageVeterinaire || sante.date_veto || '—';
  const dateConsult = sante.date_prochaine_consultation || sante.dateProchaineConsultation || '—';
  const dateFin = sante.date_fin || sante.dateFin || '';
  const note = sante.note || sante.notes || 'Aucune note';

  const estMalade = stat === 'Malade' || stat === 'En traitement';
  const duree = dateFin ? '1 jour' : '0 jour';

  const infos = [
    { label: 'Statut', value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${STATUT_BADGE[stat] ?? 'bg-zinc-100 text-zinc-500'}`}>{stat}</span> },
    { label: 'Date de début', value: dateDebut },
    { label: 'Passage vétérinaire', value: dateVet || '—' },
    { label: 'Prochaine consultation', value: dateConsult || '—' },
    { label: 'Date de fin / guérison', value: dateFin || 'En cours' },
    { label: 'Durée calculée', value: duree },
  ];

  return (
    <>
      <Link to="/sante" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />Retour au suivi santé
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">
            Suivi santé — {animalName}
            <span className="ml-2 text-[18px] text-[#171310]/40 font-normal">({animalId})</span>
          </h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Fiche de suivi sanitaire complète</p>
        </div>
        <Link to={`/sante/${id ?? sante.id}/modifier`} className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
          <Pencil className="w-4 h-4 stroke-[1.8]" />Modifier
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Statut', icon: HeartPulse, accent: estMalade, content: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${STATUT_BADGE[stat] ?? 'bg-zinc-100 text-zinc-500'}`}>{stat}</span> },
          { label: 'Durée du suivi', icon: Clock, accent: false, content: <span className="text-[22px] font-bold text-[#171310]">{duree}</span> },
          { label: 'Passage vétérinaire', icon: Stethoscope, accent: false, content: <span className="text-[18px] font-bold text-[#171310]">{dateVet || '—'}</span> },
          { label: 'Prochaine consultation', icon: Calendar, accent: false, content: <span className="text-[18px] font-bold text-[#171310]">{dateConsult || '—'}</span> },
        ].map(({ label: lbl, icon: Icon, accent, content }) => (
          <div key={lbl} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 /* shadow-[0_1px_2px_rgba(0,0,0,0.05)] */">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{lbl}</div>
              <Icon className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
            </div>
            {content}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <h2 className="font-serif text-[18px] font-medium text-[#171310] mb-5">Données du suivi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
            {infos.map(({ label: lbl, value }) => (
              <div key={lbl}>
                <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-1">{lbl}</div>
                {typeof value === 'string' ? <div className={`text-[14px] font-medium ${value === 'En cours' || value === '—' ? 'text-[#171310]/40' : 'text-[#171310]'}`}>{value}</div> : value}
              </div>
            ))}
            <div className="sm:col-span-2">
              <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Note</div>
              <div className="rounded-lg bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310] leading-relaxed">{note}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
            <h3 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium mb-4">Historique des actions</h3>
            <div className="relative pl-1">
              <div className="timeline-line"></div>
              {[
                { date: dateDebut, action: 'Début du suivi santé', auteur: 'Éleveur' },
                { date: dateConsult || '—', action: 'Prochaine consultation', auteur: 'Éleveur' },
                { date: dateVet || '—', action: 'Passage vétérinaire', auteur: 'Vétérinaire' },
              ].map((h, i, arr) => (
                <div key={i} className={`relative pl-7 ${i < arr.length - 1 ? 'pb-4' : ''}`}> <div className="timeline-dot"></div> <div className="text-[10px] text-[#171310]/40">{h.date}</div><div className="text-[12px] font-semibold text-[#171310] mt-0.5">{h.action}</div><div className="text-[11px] text-[#171310]/50 mt-0.5">{h.auteur}</div></div>
              ))}
            </div>
          </div>

          <Link to={`/cheptel/${animalId}`} className="h-9 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] text-[#171310] px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors">
            <Stethoscope className="w-4 h-4 stroke-[1.7]" />Voir la fiche animal
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-[#E5E5E3] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-[18px] font-medium text-[#171310]">Ordonnances liées à ce suivi</h2><p className="mt-1 text-xs text-[#171310]/55">Enregistrez et retrouvez ici les prescriptions de cette consultation.</p></div>{animal?.presence === 'present' && <button type="button" onClick={() => { setShowOrdonnanceForm(value => !value); setOrdonnanceError(''); }} className="rounded-lg bg-[#5C3A21] px-4 py-2 text-xs font-medium text-white">{showOrdonnanceForm ? 'Fermer' : 'Ajouter une ordonnance'}</button>}</div>
        {animal && animal.presence !== 'present' && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Animal vendu ou mort : les ordonnances restent consultables, mais ne peuvent plus être ajoutées.</p>}
        {showOrdonnanceForm && <form ref={ordonnanceFormRef} onSubmit={handleCreateOrdonnance} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input name="titre" required maxLength="150" placeholder="Titre de l’ordonnance" className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
          <input name="veterinaire" maxLength="150" placeholder="Vétérinaire" className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
          <input name="date_prescription" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
          <input name="document" type="file" accept="application/pdf,image/*" className="text-xs" />
          <textarea name="medicaments" required maxLength="5000" placeholder="Médicaments prescrits" className="min-h-20 rounded-lg border border-[#E5E5E3] p-3 text-sm sm:col-span-2" />
          <VoiceDictationButton onTranscript={applyOrdonnanceDictation} />
          <textarea name="instructions" maxLength="5000" placeholder="Instructions du vétérinaire" className="min-h-16 rounded-lg border border-[#E5E5E3] p-3 text-sm sm:col-span-2" />
          {ordonnanceError && <p className="text-xs text-red-600 sm:col-span-2">{ordonnanceError}</p>}
          <button type="submit" disabled={savingOrdonnance} className="rounded-lg bg-[#5C3A21] px-4 py-2 text-sm text-white disabled:opacity-60 sm:col-span-2">{savingOrdonnance ? 'Enregistrement…' : 'Enregistrer l’ordonnance'}</button>
        </form>}
        {ordonnances.length ? <ul className="mt-5 divide-y divide-[#E5E5E3]">{ordonnances.map(ord => <li key={ord.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#171310]">{ord.titre}</h3><p className="mt-1 text-xs text-[#171310]/55">{ord.date_prescription} · {ord.veterinaire || 'Vétérinaire non précisé'}</p><p className="mt-2 whitespace-pre-wrap text-sm text-[#171310]/80">{ord.medicaments}</p>{ord.instructions && <p className="mt-2 whitespace-pre-wrap text-xs text-[#171310]/65">Instructions : {ord.instructions}</p>}</div>{ord.document && <a className="text-xs text-[#5C3A21] underline" href={ord.document} target="_blank" rel="noreferrer">Ouvrir le document</a>}</div></li>)}</ul> : <p className="mt-4 rounded-lg bg-[#F5F4F2] p-4 text-sm text-[#171310]/55">Aucune ordonnance liée à ce suivi pour le moment.</p>}
        <Link to={`/cheptel/${animalId}#sante`} className="mt-4 inline-flex text-xs font-medium text-[#5C3A21] underline">Ouvrir le carnet de santé de l’animal</Link>
      </section>
    </>
  );
}
