import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, LoaderCircle, Send, Sparkles } from 'lucide-react';
import api from '../../../API/api';
import VoiceDictationButton from '../../../components/common/VoiceDictationButton';
import { countWords } from '../../../utils/validation';

export default function DiagnosticIA() {
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [observation, setObservation] = useState('');
  const [result, setResult] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const continuing = Boolean(conversationId);
    if (!continuing && !photo) {
      setError('Sélectionnez une image à analyser.');
      return;
    }
    if (countWords(observation) < (continuing ? 1 : 3)) {
      setError(continuing ? 'Saisissez votre réponse pour continuer.' : 'L’observation doit contenir au moins 3 mots.');
      return;
    }
    const payload = new FormData();
    if (!continuing) payload.append('photo', photo);
    payload.append('description', observation.trim());
    if (continuing) payload.append('diagnostic_id', String(conversationId));
    try {
      setLoading(true);
      const nextResult = await api.preDiagnostic(payload);
      setResult(nextResult);
      setConversationId(nextResult.id);
      setConversation(nextResult.conversation || []);
      setObservation('');
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
    setConversation([]);
    setConversationId(null);
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
          <p className="mt-1 text-[13px] text-[#171310]/55">Ajoutez une image et décrivez les premiers signes en au moins 3 mots. Vous pourrez ensuite poursuivre l’échange.</p>
        </div>
      </div>

      {conversation.length > 0 && <section aria-live="polite" className="mb-5 space-y-3 rounded-xl border border-[#E5E5E3] bg-white p-4">
        {conversation.map((turn, index) => <article key={`${index}-${turn.role}`} className={`max-w-[90%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${turn.role === 'assistant' ? 'bg-[#F5F4F2] text-[#171310]' : 'ml-auto bg-[#5C3A21] text-white'}`}>
          <p className="mb-1 text-[10px] font-semibold uppercase opacity-60">{turn.role === 'assistant' ? 'Assistant IA' : 'Vous'}</p>
          {turn.content}
        </article>)}
      </section>}

      <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-[#E5E5E3] bg-white p-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <label htmlFor="diagnostic-photo" className="mb-2 block text-xs font-semibold">Image à analyser</label>
          <label htmlFor="diagnostic-photo" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#B8AA9C] bg-[#FAF9F7] p-4 text-center hover:border-[#5C3A21]">
            {photoUrl ? <img src={photoUrl} alt="Aperçu de l’image sélectionnée" className="max-h-64 w-full rounded-md object-contain" /> : <><ImagePlus className="mb-2 h-7 w-7 text-[#5C3A21]" /><span className="text-sm font-medium">Choisir une image</span><span className="mt-1 text-xs text-[#171310]/50">JPEG, PNG ou WebP, 8 Mo maximum</span></>}
          </label>
          <input id="diagnostic-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={handlePhotoChange} className="sr-only" />
        </div>
        <div>
          <label htmlFor="diagnostic-observation" className="mb-2 block text-xs font-semibold">{conversationId ? 'Votre réponse' : 'Votre observation'}</label>
          <textarea id="diagnostic-observation" value={observation} onChange={event => setObservation(event.target.value)} rows={6} maxLength={3000} required placeholder={conversationId ? 'Répondez à la question de l’IA…' : 'Décrivez ce que vous constatez…'} className="w-full resize-y rounded-lg border border-[#E5E5E3] p-3 text-sm outline-none focus:border-[#5C3A21]" />
          <VoiceDictationButton
            onTranscript={transcript => setObservation(previous => `${previous}${previous ? ' ' : ''}${transcript}`)}
            buttonLabel={conversationId ? 'Dicter la réponse' : 'Dicter l’observation'}
            helperText={conversationId ? 'Répondez librement à l’IA.' : 'Saisissez ou dictez au moins 3 mots.'}
            containerClassName="mt-2"
            iconOnly
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} title={loading ? 'Réponse en cours' : conversationId ? 'Envoyer la réponse' : 'Analyser le pré-diagnostic'} aria-label={loading ? 'Réponse en cours' : conversationId ? 'Envoyer la réponse' : 'Analyser le pré-diagnostic'} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C3A21] text-white disabled:opacity-60">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : conversationId ? <Send className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </button>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </form>

      {result && Boolean(result.suggestions?.length || result.recommandations?.length) && <section aria-live="polite" className="mt-5 rounded-xl border border-[#E5E5E3] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-[19px] text-[#171310]">Pistes à vérifier</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${result.urgence === 'élevée' ? 'bg-red-100 text-red-700' : result.urgence === 'faible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>Urgence {result.urgence}</span>
        </div>
        {result.validation_image?.espece && <p className="mt-2 text-xs text-[#171310]/60">Photo vérifiée : {result.validation_image.espece}.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{result.suggestions?.map((suggestion, index) => <article key={`${suggestion.nom}-${index}`} className="rounded-lg border border-[#E5E5E3] p-3"><h3 className="text-sm font-semibold">{suggestion.nom}</h3><p className="mt-1 text-xs leading-relaxed text-[#171310]/70">{suggestion.justification}</p>{suggestion.niveau && <p className="mt-1 text-[11px] text-[#171310]/50">Niveau : {suggestion.niveau}</p>}</article>)}</div>
        <h3 className="mt-5 text-xs font-semibold">Premières recommandations</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#171310]/75">{result.recommandations?.map((recommendation, index) => <li key={index}>{recommendation}</li>)}</ul>
        <p className="mt-4 border-t border-[#E5E5E3] pt-3 text-[11px] text-[#171310]/55">{result.limites} Cette aide ne remplace pas l’avis d’un vétérinaire.</p>
      </section>}
    </div>
  );
}