import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Trash2 } from 'lucide-react';
import api from '../../../API/api';
import useAnimals from '../../../hooks/useAnimals';
import FieldError from '../../../components/common/FieldError';
import { clean, validateSante } from '../../../utils/validation';

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
  const [poidsKg,     setPoidsKg]     = useState('');
  const [temperature, setTemperature] = useState('');
  const [frequenceCardiaque, setFrequenceCardiaque] = useState('');
  const [note,        setNote]        = useState('');
  const [animalLabel, setAnimalLabel] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isNew && animalId && !poidsKg) {
      const animal = animals.find(item => String(item.id) === String(animalId));
      const poidsAnimal = animal?.poids_actuel ?? animal?.poids_naissance;
      if (poidsAnimal != null) setPoidsKg(String(poidsAnimal));
    }
  }, [animals, animalId, isNew]);

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);

  function updateField(field, setter, event) {
    setter(event.target.value);
    setFieldErrors(previous => ({ ...previous, [field]: '' }));
  }

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
        setPoidsKg(data.poids_kg ?? '');
        setTemperature(data.temperature_celsius ?? '');
        setFrequenceCardiaque(data.frequence_cardiaque ?? '');
        setNote(data.note || data.notes || '');
        setAnimalLabel(data.animal_nom || data.animal_id || '');
      } catch (err) {
        setError(err.message || 'Impossible de charger le suivi.');
      }
    }
    load();
  }, [id, isNew]);


  function applyDictation(text) {
    const spoken = text.trim();
    if (!spoken) return;
    setVoiceText(spoken);
    const normalized = spoken.toLocaleLowerCase('fr-FR');
    const statusMatch = [
      [/\b(en traitement|sous traitement)\b/, 'En traitement'],
      [/\b(sous surveillance|surveillance)\b/, 'Sous surveillance'],
      [/\b(gu[eé]ri|r[eé]tabli)\b/, 'Guéri'],
      [/\b(malade|malade)\b/, 'Malade'],
    ].find(([pattern]) => pattern.test(normalized));
    if (statusMatch) setStatut(statusMatch[1]);

    const findDate = (pattern) => {
      const match = normalized.match(pattern);
      if (!match) return null;
      const dateMatch = match[1].match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b|\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
      if (!dateMatch) return null;
      if (dateMatch[1]) return `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
      return `${dateMatch[6]}-${dateMatch[5].padStart(2, '0')}-${dateMatch[4].padStart(2, '0')}`;
    };
    const startDate = findDate(/(?:date de d[eé]but|d[eé]but|depuis)(?: le)?\s+([^,;.]+)/);
    const nextDate = findDate(/(?:prochaine consultation|prochain rendez-vous|revoir)(?: pr[eé]vu| pr[eé]vue)?(?: le)?\s+([^,;.]+)/);
    if (startDate) setDateDebut(startDate);
    if (nextDate) setDateProchain(nextDate);

    const parseMeasure = (pattern, convert = value => value) => {
      const match = normalized.match(pattern);
      if (!match) return null;
      const number = Number(match[1].replace(',', '.'));
      return Number.isFinite(number) ? convert(number, match[2]) : null;
    };
    const weight = parseMeasure(/(?:poids|p[eè]se|pes[eé]e?)(?: actuel)?(?: de| [eé]gal [aà])?\s*(\d+(?:[,.]\d+)?)\s*(kg|kilos?|g|grammes?)?\b/, (value, unit) => unit && /^(g|grammes?)$/.test(unit) ? value / 1000 : value);
    const temp = parseMeasure(/(?:temp[eé]rature|temp[eé]rature corporelle)(?: de| [eé]gale [aà])?\s*(\d+(?:[,.]\d+)?)/);
    const pulse = parseMeasure(/(?:fr[eé]quence cardiaque|pouls|battements)(?: de| [eé]gale [aà])?\s*(\d+(?:[,.]\d+)?)/);
    if (weight !== null && weight <= 6000) setPoidsKg(String(weight));
    if (temp !== null) setTemperature(String(temp));
    if (pulse !== null) setFrequenceCardiaque(String(Math.round(pulse)));
    setNote(current => current ? `${current}\n${spoken}` : spoken);
    setVoiceError('Dictée retranscrite. Les valeurs reconnues ont été proposées; vérifiez les champs avant d’enregistrer.');
  }

  async function startVoiceEntry() {
    setVoiceError('');
    if (!animalId) {
      setVoiceError('Choisissez d’abord l’animal concerné.');
      return;
    }
    if (!window.isSecureContext) {
      setVoiceError('La dictée nécessite une connexion sécurisée (HTTPS) ou localhost.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('La dictée vocale n’est pas prise en charge par ce navigateur. Vous pouvez remplir les champs manuellement.');
      return;
    }

    let microphoneStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setVoiceError('Ce navigateur ne donne pas accès au microphone pour la dictée.');
        return;
      }
      // Vérifier explicitement le microphone : l’erreur du moteur vocal ne distingue
      // pas toujours un refus micro d’une indisponibilité de son service de reconnaissance.
      microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream.getTracks().forEach(track => track.stop());
      microphoneStream = null;
    } catch (error) {
      const messages = {
        NotAllowedError: 'L’accès au microphone est refusé pour ce site. Vérifiez les permissions du site dans le navigateur.',
        NotFoundError: 'Aucun microphone n’a été détecté sur cet appareil.',
        NotReadableError: 'Le microphone est utilisé par une autre application ou ne peut pas être ouvert.',
        SecurityError: 'Le navigateur bloque le microphone pour cette adresse. Utilisez localhost ou HTTPS.',
      };
      setVoiceError(messages[error.name] || `Impossible d’ouvrir le microphone (${error.name || 'erreur inconnue'}).`);
      microphoneStream?.getTracks().forEach(track => track.stop());
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onstart = () => setListening(true);
    recognition.onerror = event => {
      setListening(false);
      const messages = {
        'not-allowed': 'Le microphone est accessible, mais le moteur vocal du navigateur refuse la dictée. Vérifiez que la reconnaissance vocale est activée et que le navigateur peut accéder à son service vocal.',
        'service-not-allowed': 'Le service de reconnaissance vocale du navigateur est indisponible ou bloqué. Réessayez plus tard ou remplissez le formulaire manuellement.',
        network: 'Le service de reconnaissance vocale est inaccessible. Vérifiez la connexion Internet du navigateur.',
        'audio-capture': 'Le navigateur ne parvient pas à capter le son du microphone.',
        'no-speech': 'Aucune parole n’a été détectée. Parlez après le démarrage de l’écoute puis réessayez.',
        aborted: 'La dictée a été interrompue.',
      };
      setVoiceError(messages[event.error] || `La dictée a échoué (${event.error || 'erreur inconnue'}).`);
    };
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ');
      applyDictation(transcript);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setVoiceError('Microphone prêt. Parlez maintenant.');
    } catch (error) {
      setListening(false);
      setVoiceError(`Impossible de démarrer la dictée (${error.name || 'erreur inconnue'}). Réessayez.`);
    }
  }

  const selectedAnimal = animals.find(item => String(item.id) === String(animalId));
  const animalArchived = Boolean(selectedAnimal && selectedAnimal.presence !== 'present');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (animalArchived) { setError('Impossible de modifier un suivi ou rendez-vous pour un animal vendu ou mort.'); return; }
    const validation = validateSante({ animalId, statut, dateDebut, dateProchain, poidsKg, temperature, frequenceCardiaque, note }, isNew);
    setFieldErrors(validation.errors);
    if (validation.message) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        statut,
        date_debut:                   dateDebut    || null,
        date_prochaine_consultation:  dateProchain || null,
        poids_kg:                     poidsKg === '' ? null : Number(poidsKg),
        temperature_celsius:          temperature === '' ? null : Number(temperature),
        frequence_cardiaque:          frequenceCardiaque === '' ? null : Number(frequenceCardiaque),
        note: clean(note),
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

      {animalArchived && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Cet animal est vendu ou mort. Son suivi et son historique restent consultables, mais ne peuvent plus être modifiés.</div>}
        {!animalArchived && <form noValidate onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* Animal (création uniquement) */}
        {isNew && (
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Animal</p>
            <label htmlFor="animal" className="block text-[13px] font-semibold text-[#171310] mb-2">Animal concerné</label>
            <div className="relative">
              <select id="animal" className={selectCls} value={animalId} onChange={e => updateField('animal', setAnimalId, e)} required>
                <option value="">Sélectionner un animal</option>
                {animalsLoading
                  ? <option disabled>Chargement…</option>
                  : animals.filter(a => a.presence === 'present').map(a => <option key={a.id} value={a.id}>{animalOptionLabel(a)}</option>)
                }
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
            </div>
            <FieldError message={fieldErrors.animal} />
          </div>
        )}

        {/* Saisie vocale optionnelle; les champs restent toujours modifiables manuellement. */}
        <section className="mb-6 rounded-xl border border-[#E5E5E3] bg-[#FAF9F7] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-semibold text-[#171310]">Remplir en parlant</p><p className="mt-1 text-xs text-[#171310]/55">Choisissez l’animal, dictez les informations utiles, puis vérifiez les champs proposés.</p></div>
            <button type="button" onClick={listening ? () => recognitionRef.current?.stop() : startVoiceEntry} className="rounded-lg bg-[#5C3A21] px-4 py-2 text-xs font-medium text-white">{listening ? 'Arrêter la dictée' : 'Dicter les informations'}</button>
          </div>
          {voiceText && <p className="mt-3 rounded-lg bg-white p-3 text-xs text-[#171310]/75"><strong>Transcription :</strong> {voiceText}</p>}
          {voiceError && <p role="status" className={`mt-2 text-xs ${listening ? 'text-[#5C3A21]' : 'text-[#171310]/65'}`}>{listening ? 'Écoute en cours…' : voiceError}</p>}
        </section>

        {/* Données du suivi */}
        <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Données du suivi</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#171310] mb-2">Statut</label>
            <div className="relative">
              <select value={statut} onChange={e => updateField('statut', setStatut, e)} className={selectCls}>
                <option value="Malade">Malade</option>
                <option value="En traitement">En traitement</option>
                <option value="Guéri">Guéri</option>
                <option value="Sous surveillance">Sous surveillance</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
            </div>
            <FieldError message={fieldErrors.statut} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#171310] mb-2">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input type="date" value={dateDebut} onChange={e => updateField('dateDebut', setDateDebut, e)} required className={inputCls} />
            <FieldError message={fieldErrors.dateDebut} />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[#171310] mb-2">
            Prochaine consultation <span className="text-[#171310]/40 font-normal">(optionnel)</span>
          </label>
            <input type="date" value={dateProchain} onChange={e => updateField('dateProchain', setDateProchain, e)} className={inputCls} />
            <FieldError message={fieldErrors.dateProchain} />
        </div>

        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Mesures pour l’analyse IA</p>
          <p className="-mt-2 mb-4 text-[12px] text-[#171310]/50">Facultatives, mais nécessaires pour une prédiction fiable et la comparaison avec l’historique.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#171310] mb-2">Poids (kg)</label>
              <input type="number" min="0" step="0.1" value={poidsKg} onChange={e => updateField('poidsKg', setPoidsKg, e)} placeholder="Ex: 54.5" className={inputCls} />
              <FieldError message={fieldErrors.poidsKg} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#171310] mb-2">Température (°C)</label>
              <input type="number" min="0" step="0.1" value={temperature} onChange={e => updateField('temperature', setTemperature, e)} placeholder="Ex: 39.1" className={inputCls} />
              <FieldError message={fieldErrors.temperature} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#171310] mb-2">Fréquence cardiaque</label>
              <input type="number" min="0" step="1" value={frequenceCardiaque} onChange={e => updateField('frequenceCardiaque', setFrequenceCardiaque, e)} placeholder="bpm" className={inputCls} />
              <FieldError message={fieldErrors.frequenceCardiaque} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[#171310] mb-2">Note</label>
          <textarea
            rows={4}
            value={note}
            onChange={e => updateField('note', setNote, e)}
            placeholder="Observations, traitements, recommandations..."
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
          <FieldError message={fieldErrors.note} />
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
      </form>}

      {showDelete && !animalArchived && (
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
