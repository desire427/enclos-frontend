import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Sparkles } from 'lucide-react';
import api from '../../../API/api';
import VoiceDictationButton from '../../../components/common/VoiceDictationButton';
import { countWords } from '../../../utils/validation';

export default function DiagnosticIA() {
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [observation, setObservation] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!photo) {
      setError('Sélectionnez une image à analyser.');
      return;
    }
    if (countWords(observation) < 3) {
      setError('L’observation doit contenir au moins 3 mots.');
      return;
    }
    const payload = new FormData();
    payload.append('photo', photo);
    payload.append('description', observation.trim());
    try {
      setLoading(true);
      setResult(await api.preDiagnostic(payload));
    } catch (err) {
      setError(err.message || 'Le pré-diagnostic est indisponible.');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file);
    setPhotoUrl(file ? URL.createObjectURL(file) : '');
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/cheptel" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#5C3A21] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour au cheptel
      </Link>
      <div className="mb-6 flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 text-[#5C3A21]" />
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Diagnostic IA</h1>
          <p className="mt-1 text-[13px] text-[#171310]/55">Ajoutez une image et saisissez ou dictez une observation d’au moins 3 mots.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-[#E5E5E3] bg-white p-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <label htmlFor="diagnostic-photo" className="mb-2 block text-xs font-semibold">Image à analyser</label>
          <label htmlFor="diagnostic-photo" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#B8AA9C] bg-[#FAF9F7] p-4 text-center hover:border-[#5C3A21]">
            {photoUrl ? <img src={photoUrl} alt="Aperçu de l’image sélectionnée" className="max-h-64 w-full rounded-md object-contain" /> : <><ImagePlus className="mb-2 h-7 w-7 text-[#5C3A21]" /><span className="text-sm font-medium">Choisir une image</span><span className="mt-1 text-xs text-[#171310]/50">JPEG, PNG ou WebP, 8 Mo maximum</span></>}
          </label>
          <input id="diagnostic-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={handlePhotoChange} className="sr-only" />
        </div>
        <div>
          <label htmlFor="diagnostic-observation" className="mb-2 block text-xs font-semibold">Votre observation</label>
          <textarea id="diagnostic-observation" value={observation} onChange={event => setObservation(event.target.value)} rows={6} maxLength={3000} required placeholder="Décrivez ce que vous constatez…" className="w-full resize-y rounded-lg border border-[#E5E5E3] p-3 text-sm outline-none focus:border-[#5C3A21]" />
          <VoiceDictationButton
            onTranscript={transcript => setObservation(previous => `${previous}${previous ? ' ' : ''}${transcript}`)}
            buttonLabel="Dicter l’observation"
            helperText="Saisissez ou dictez au moins 3 mots."
            containerClassName="mt-2"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5C3A21] px-4 text-sm font-medium text-white disabled:opacity-60">
              <Sparkles className="h-4 w-4" />{loading ? 'Analyse en cours…' : 'Analyser'}
            </button>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </form>

      {result && <section aria-live="polite" className="mt-5 rounded-xl border border-[#E5E5E3] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-[19px] text-[#171310]">Pistes à vérifier</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.urgence === 'élevée' ? 'bg-red-100 text-red-700' : result.urgence === 'faible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>Urgence {result.urgence}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{result.suggestions?.map((suggestion, index) => <article key={`${suggestion.nom}-${index}`} className="rounded-lg border border-[#E5E5E3] p-3"><h3 className="text-sm font-semibold">{suggestion.nom}</h3><p className="mt-1 text-xs leading-relaxed text-[#171310]/70">{suggestion.justification}</p>{suggestion.niveau && <p className="mt-1 text-[11px] text-[#171310]/50">Niveau : {suggestion.niveau}</p>}</article>)}</div>
        <h3 className="mt-5 text-xs font-semibold">Premières recommandations</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#171310]/75">{result.recommandations?.map((recommendation, index) => <li key={index}>{recommendation}</li>)}</ul>
        <p className="mt-4 border-t border-[#E5E5E3] pt-3 text-[11px] text-[#171310]/55">{result.limites} Cette aide ne remplace pas l’avis d’un vétérinaire.</p>
      </section>}
    </div>
  );
}