import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, PawPrint, Scale, Calendar, AlertTriangle, Camera, Circle, ImagePlus, LoaderCircle, Mic, MicOff, Send,
  Pencil, ChevronDown, Check, X, Sparkles, History, Paperclip,
  Bell,
} from 'lucide-react';
import api from '../../../API/api';
import FieldError from '../../../components/common/FieldError';
import VoiceDictationButton from '../../../components/common/VoiceDictationButton';
import PreDiagnosticHistory from '../../../components/common/PreDiagnosticHistory';
import { formatHistoryDate, isPreDiagnosticEvent } from '../../../utils/history';
import { clean, countWords, validateSelect, validateText } from '../../../utils/validation';

const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';
const TABS = ['Général', 'Santé', 'Alimentation'];

function fmt(val, fallback = '—') {
  if (val === null || val === undefined || String(val).trim() === '') return fallback;
  return val;
}

function calcAge(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (isNaN(d)) return null;
  const years  = Math.floor((new Date() - d) / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((new Date() - d) / (30.44 * 24 * 3600 * 1000)) % 12;
  if (years >= 1) return `${years} an${years > 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mois`;
  return '< 1 mois';
}

/* Normalise un événement d'historique */
function normalizeEvent(h) {
  const type = h.type_evenement || h.type || 'normal';
  const title = h.titre || h.title || h.type_evenement || 'Événement';
  return {
    id:    h.id,
    type,
    isIA:  h.source_ia === true || isPreDiagnosticEvent(title, type),
    date:  h.date_evenement || h.date || h.created_at || '',
    title,
    desc:  h.description || h.details || h.note || '',
  };
}

function isWeighingEvent(event) {
  return String(event.type || '').toLocaleLowerCase('fr') === 'pesage';
}

function isHealthEvent(event) {
  const type = String(event.type || '').toLocaleLowerCase('fr');
  const title = String(event.title || '').toLocaleLowerCase('fr');
  return ['santé', 'consultation', 'ordonnance', 'gestation'].includes(type)
    || isPreDiagnosticEvent(event.title, event.type)
    || title.includes('état de l’animal modifié');
}

function getWeightEventKey(dateValue, weight) {
  return `${String(dateValue || '').slice(0, 10)}:${Number(weight)}`;
}

function getWeighingHistory(history, healthFollowUps) {
  const weighingEvents = history.filter(isWeighingEvent);
  const existingKeys = new Set(weighingEvents.flatMap(event => {
    const weight = event.desc.match(/(?:Poids mesuré|Nouveau poids)\s*:\s*([\d.,]+)/i)?.[1]?.replace(',', '.');
    return weight ? [getWeightEventKey(event.date, weight)] : [];
  }));
  const previousMeasurements = healthFollowUps
    .filter(followUp => followUp.poids_kg !== null && followUp.poids_kg !== undefined)
    .map(followUp => {
      const date = followUp.date_debut || followUp.date_creation;
      const weight = Number(followUp.poids_kg);
      return {
        id: `suivi-pesage-${followUp.id}`,
        type: 'Pesage',
        date,
        title: 'Pesage enregistré',
        desc: `Poids mesuré : ${weight} kg.`,
        key: getWeightEventKey(date, weight),
      };
    })
    .filter(measurement => !existingKeys.has(measurement.key))
    .map(({ key, ...measurement }) => measurement);
  return [...weighingEvents, ...previousMeasurements].sort((left, right) => new Date(right.date) - new Date(left.date));
}

/* Panneau latéral générique */
function SidePanel({ open, onClose, title, children }) {
  return (
    <div className={`fixed top-0 right-0 bottom-0 z-40 w-[380px] max-w-[92vw] bg-white shadow-2xl flex flex-col transition-transform duration-300
      ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
        <h2 className="font-serif text-[17px] font-medium text-[#171310]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors" aria-label="Fermer">
          <X className="w-4 h-4 text-[#171310]/60" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  );
}

export default function DetailAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /* Données principales */
  const [animal,       setAnimal]       = useState(null);
  const [alimentations,setAlimentations]= useState([]);
  const [historique,   setHistorique]   = useState([]);
  const [alertes,      setAlertes]      = useState([]);
  const [qrImage, setQrImage] = useState('');
  const [ordonnances, setOrdonnances] = useState([]);
  const [suivisSante, setSuivisSante] = useState([]);
  const [showOrdonnanceForm, setShowOrdonnanceForm] = useState(false);
  const [ordonnanceError, setOrdonnanceError] = useState('');
  const [ordonnanceOcrLoading, setOrdonnanceOcrLoading] = useState(false);
  const [ordonnanceOcrMessage, setOrdonnanceOcrMessage] = useState('');
  const [ordonnanceOcrError, setOrdonnanceOcrError] = useState('');
  const [ordonnanceOcrPhoto, setOrdonnanceOcrPhoto] = useState(null);
  const [ordonnanceDocumentName, setOrdonnanceDocumentName] = useState('');
  const [showOrdonnanceCamera, setShowOrdonnanceCamera] = useState(false);
  const [ordonnanceCameraStream, setOrdonnanceCameraStream] = useState(null);
  const [ordonnanceCameraLoading, setOrdonnanceCameraLoading] = useState(false);
  const [ordonnanceCameraReady, setOrdonnanceCameraReady] = useState(false);
  const [ordonnanceCameraError, setOrdonnanceCameraError] = useState('');
  const [diagnosticDescription, setDiagnosticDescription] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticConversation, setDiagnosticConversation] = useState([]);
  const [diagnosticId, setDiagnosticId] = useState(null);
  const [diagnosticError, setDiagnosticError] = useState('');
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const ordonnanceFormRef = useRef(null);
  const ordonnanceCameraVideoRef = useRef(null);
  const ordonnanceCameraStreamRef = useRef(null);

  /* UI */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [activeTab,setActiveTab]= useState(() => location.hash === '#sante' ? 'Santé' : 'Général');
  const [showHistorique,setShowHistorique]= useState(false);
  const [historyFilter, setHistoryFilter] = useState('tout');
  const [showAlertes,   setShowAlertes]   = useState(false);

  useEffect(() => {
    if (location.hash === '#sante') setActiveTab('Santé');
  }, [location.hash]);

  useEffect(() => () => {
    ordonnanceCameraStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (showOrdonnanceCamera && ordonnanceCameraVideoRef.current && ordonnanceCameraStream) {
      ordonnanceCameraVideoRef.current.srcObject = ordonnanceCameraStream;
    }
  }, [showOrdonnanceCamera, ordonnanceCameraStream]);

  /* Onglet Santé — champs éditables */
  const [presence,   setPresence]   = useState('present');
  const [etatSante,  setEtatSante]  = useState('sain');
  const [noteSante,  setNoteSante]  = useState('');
  const [santeFieldErrors, setSanteFieldErrors] = useState({});
  const [savingSante, setSavingSante] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [animalData, alimentsData, histData, alertesData, qrData, ordonnanceData, santeData] = await Promise.all([
          api.getAnimal(id),
          api.getAlimentations().catch(() => []),
          api.getHistorique().catch(() => []),
          api.getAlertes().catch(() => []),
          api.getAnimalQr(id).catch(() => null),
          api.getOrdonnances(id).catch(() => []),
          api.getSuivisSante(id).catch(() => []),
        ]);
        setAnimal(animalData);
        setQrImage(qrData?.qr_image || '');
        setOrdonnances(Array.isArray(ordonnanceData) ? ordonnanceData : (ordonnanceData?.results || []));
        setSuivisSante(Array.isArray(santeData) ? santeData : (santeData?.results || []));
        setPresence(animalData.presence || 'present');
        setEtatSante(animalData.etat_sante || 'sain');
        setNoteSante(animalData.observations || '');

        // Filtre côté frontend par animal ID
        const animalIdNum = Number(id);
        setAlimentations(
          (Array.isArray(alimentsData) ? alimentsData : [])
            .filter(a => {
              const animalRef = a.animal?.id ?? a.animal;
              return Number(animalRef) === animalIdNum;
            })
            .slice(0, 5)
        );
        setHistorique(
          (Array.isArray(histData) ? histData : [])
            .filter(h => {
              const animalRef = h.animal?.id ?? h.animal ?? h.animal_id;
              return Number(animalRef) === animalIdNum;
            })
            .map(normalizeEvent)
        );
        setAlertes(
          (Array.isArray(alertesData) ? alertesData : [])
            .filter(a => {
              const animalRef = a.animal?.id ?? a.animal ?? a.animal_id;
              return Number(animalRef) === animalIdNum;
            })
        );
      } catch (err) {
        setError(err.message || 'Impossible de charger cet animal.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSaveSante() {
    if (!animal || animal.presence !== 'present') return;
    const validationErrors = {
      presence: validateSelect(presence, 'La présence', ['present', 'vendu', 'mort']),
      etatSante: validateSelect(etatSante, "L'état de santé", ['sain', 'malade', 'gestation', 'en_traitement']),
      noteSante: validateText(noteSante, 'La note de santé', { optional: true, max: 2000 }),
    };
    setSanteFieldErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;
    setError('');
    try {
      setSavingSante(true);
      const observations = clean(noteSante);
      await api.updateAnimal(id, { presence, etat_sante: etatSante, observations });
      setAnimal(prev => ({ ...prev, presence, etat_sante: etatSante, observations }));
      if (presence !== 'present') {
        navigate(`/cheptel/${id}`);
      } else if (etatSante === 'gestation') {
        navigate(`/gestation/ajouter?animal=${id}`);
      } else if (etatSante === 'malade' || etatSante === 'en_traitement') {
        const ouvert = await api.getSuiviSanteOuvert(id);
        const statut = etatSante === 'malade' ? 'Malade' : 'En traitement';
        navigate(ouvert
          ? `/sante/${ouvert.id}/modifier`
          : `/sante/ajouter?animal=${id}&statut=${statut}`);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSavingSante(false);
    }
  }

  async function startVoiceDescription() {
    setDiagnosticError('');
    if (!window.isSecureContext) {
      setDiagnosticError('La dictée nécessite une connexion sécurisée (HTTPS) ou localhost.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setDiagnosticError('La dictée vocale n’est pas prise en charge par ce navigateur. Vous pouvez saisir la description au clavier.'); return; }

    let microphoneStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setDiagnosticError('Ce navigateur ne donne pas accès au microphone pour la dictée.');
        return;
      }
      microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream.getTracks().forEach(track => track.stop());
      microphoneStream = null;
    } catch (error) {
      const messages = {
        NotAllowedError: 'L’accès au microphone est refusé pour ce site. Vérifiez les permissions du navigateur.',
        NotFoundError: 'Aucun microphone n’a été détecté sur cet appareil.',
        NotReadableError: 'Le microphone est utilisé par une autre application ou ne peut pas être ouvert.',
        SecurityError: 'Le navigateur bloque le microphone pour cette adresse. Utilisez localhost ou HTTPS.',
      };
      setDiagnosticError(messages[error.name] || `Impossible d’ouvrir le microphone (${error.name || 'erreur inconnue'}).`);
      microphoneStream?.getTracks().forEach(track => track.stop());
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = event => {
      const phrase = Array.from(event.results).slice(event.resultIndex).filter(result => result.isFinal).map(result => result[0].transcript.trim()).join(' ');
      if (phrase) setDiagnosticDescription(previous => `${previous}${previous ? ' ' : ''}${phrase}`);
    };
    recognition.onerror = event => {
      setListening(false);
      const messages = {
        'not-allowed': 'Le microphone est accessible, mais le moteur vocal du navigateur refuse la dictée. Vérifiez les permissions de reconnaissance vocale.',
        'service-not-allowed': 'Le service de reconnaissance vocale du navigateur est indisponible ou bloqué.',
        network: 'Le service de reconnaissance vocale est inaccessible. Vérifiez la connexion Internet.',
        'audio-capture': 'Le navigateur ne parvient pas à capter le son du microphone.',
        'no-speech': 'Aucune parole n’a été détectée. Parlez après le démarrage de l’écoute puis réessayez.',
        aborted: 'La dictée a été interrompue.',
      };
      setDiagnosticError(messages[event.error] || `La dictée a échoué (${event.error || 'erreur inconnue'}).`);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      setListening(false);
      setDiagnosticError(`Impossible de démarrer la dictée (${error.name || 'erreur inconnue'}). Réessayez.`);
    }
  }

  async function handlePreDiagnostic(event) {
    event.preventDefault();
    setDiagnosticError('');
    const continuing = Boolean(diagnosticId);
    if (!continuing && !animal?.photo) {
      setDiagnosticError('Ajoutez d’abord une photo à la fiche de cet animal.');
      return;
    }
    if (countWords(diagnosticDescription) < (continuing ? 1 : 3)) {
      setDiagnosticError(continuing ? 'Saisissez votre réponse pour continuer.' : 'L’observation doit contenir au moins 3 mots.');
      return;
    }
    const payload = new FormData();
    payload.append('animal_id', id);
    payload.append('description', diagnosticDescription.trim());
    if (continuing) payload.append('diagnostic_id', String(diagnosticId));
    try {
      setDiagnosticLoading(true);
      const result = await api.preDiagnostic(payload);
      setDiagnosticResult(result);
      setDiagnosticId(result.id);
      setDiagnosticConversation(result.conversation || []);
      setDiagnosticDescription('');
      const transcript = (result.conversation || []).map(turn => `${turn.role === 'user' ? 'Éleveur' : 'IA'} : ${turn.content}`).join('\n');
      const historyId = result.historique_evenement_id || `diag-${result.id}`;
      setHistorique(previous => [{ id: historyId, type: 'Pré-diagnostic IA', isIA: true, date: result.date_creation, title: 'Pré-diagnostic assisté par IA', desc: transcript, diagnosticResult: result }, ...previous.filter(event => event.id !== historyId && event.id !== `diag-${result.id}`)]);
    } catch (err) {
      setDiagnosticError(err.message || 'Le pré-diagnostic est indisponible.');
    } finally {
      setDiagnosticLoading(false);
    }
  }

  function applyOrdonnanceDictation(transcript) {
    const form = ordonnanceFormRef.current;
    if (!form) return;
    const split = transcript.match(/\b(?:instructions?|consignes?|posologie)\b\s*[:,—-]?\s*(.*)$/i);
    const medicaments = split ? transcript.slice(0, split.index).trim() : transcript;
    if (medicaments) form.elements.namedItem('medicaments').value = medicaments.replace(/^\s*(?:m[eé]dicaments?)\s*[:,—-]?\s*/i, '');
    if (split?.[1]) form.elements.namedItem('instructions').value = split[1].trim();
  }

  async function extraireOrdonnancePhoto(photo) {
    if (!photo) return;
    setOrdonnanceOcrPhoto(photo);
    setOrdonnanceOcrError('');
    setOrdonnanceOcrMessage('Lecture de l’ordonnance en cours…');
    try {
      setOrdonnanceOcrLoading(true);
      const extracted = await api.extraireOrdonnance(photo);
      const form = ordonnanceFormRef.current;
      ['titre', 'veterinaire', 'date_prescription', 'medicaments', 'instructions'].forEach(field => {
        const input = form?.elements.namedItem(field);
        if (input) input.value = extracted[field] || '';
      });
      setOrdonnanceOcrMessage(extracted.informations_a_verifier?.length
        ? 'Extraction terminée. Certains champs sont illisibles ou absents : vérifiez-les et complétez-les avant d’enregistrer.'
        : 'Extraction terminée. Vérifiez les données avant d’enregistrer.');
    } catch (err) {
      setOrdonnanceOcrError(err.message || 'Impossible de lire cette ordonnance.');
      setOrdonnanceOcrMessage('Aucune donnée n’a été extraite. Vous pouvez réessayer avec une photo nette ou remplir les champs manuellement.');
    } finally {
      setOrdonnanceOcrLoading(false);
    }
  }

  function handleOrdonnanceOcr(event) {
    const photo = event.target.files?.[0];
    event.target.value = '';
    if (photo) extraireOrdonnancePhoto(photo);
  }

  async function ouvrirCameraOrdonnance() {
    setOrdonnanceCameraError('');
    setOrdonnanceCameraReady(false);
    setShowOrdonnanceCamera(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setOrdonnanceCameraError('La caméra n’est pas disponible dans ce navigateur. Utilisez « Importer une image ».');
      return;
    }
    try {
      setOrdonnanceCameraLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      ordonnanceCameraStreamRef.current = stream;
      setOrdonnanceCameraStream(stream);
    } catch (error) {
      const messages = {
        NotAllowedError: 'L’accès à la caméra est refusé. Autorisez la caméra dans les réglages du navigateur.',
        NotFoundError: 'Aucune caméra n’a été détectée. Vous pouvez importer une image à la place.',
        NotReadableError: 'La caméra est occupée ou inaccessible. Fermez les autres applications qui l’utilisent.',
        SecurityError: 'Le navigateur bloque la caméra. Utilisez localhost ou HTTPS.',
      };
      setOrdonnanceCameraError(messages[error.name] || `Impossible d’ouvrir la caméra (${error.name || 'erreur inconnue'}).`);
    } finally {
      setOrdonnanceCameraLoading(false);
    }
  }

  function fermerCameraOrdonnance() {
    ordonnanceCameraStreamRef.current?.getTracks().forEach(track => track.stop());
    ordonnanceCameraStreamRef.current = null;
    setOrdonnanceCameraStream(null);
    setShowOrdonnanceCamera(false);
    setOrdonnanceCameraReady(false);
  }

  async function capturerOrdonnance() {
    const video = ordonnanceCameraVideoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setOrdonnanceCameraError('La caméra n’est pas encore prête. Réessayez dans un instant.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!photo) {
      setOrdonnanceCameraError('Impossible de capturer la photo. Réessayez.');
      return;
    }
    const imageFile = new File([photo], `ordonnance-${Date.now()}.jpg`, { type: 'image/jpeg' });
    fermerCameraOrdonnance();
    extraireOrdonnancePhoto(imageFile);
  }

  async function handleCreateOrdonnance(event) {
    event.preventDefault();
    setOrdonnanceError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const selectedDocument = data.get('document');
    if (ordonnanceOcrPhoto && (!selectedDocument || !selectedDocument.size)) {
      data.set('document', ordonnanceOcrPhoto, ordonnanceOcrPhoto.name);
    }
    data.append('animal', id);
    try {
      const created = await api.createOrdonnance(data);
      setOrdonnances(previous => [created, ...previous]);
      setShowOrdonnanceForm(false);
      form.reset();
      setOrdonnanceOcrPhoto(null);
      setOrdonnanceDocumentName('');
      setOrdonnanceOcrMessage('');
      setOrdonnanceOcrError('');
    } catch (err) {
      setOrdonnanceError(err.message || 'Impossible d’enregistrer cette ordonnance.');
    }
  }

  async function handleMarkAlerteLue(alerteId) {
    try {
      const updated = await api.updateAlerte(alerteId, { statut: 'lue' });
      setAlertes(prev => prev.map(a => a.id === alerteId ? updated : a));
    } catch (err) {
      setError(err.message || 'Impossible de marquer l’alerte comme lue.');
    }
  }

  async function handleConfirmerRappel(alerteId) {
    try {
      const updated = await api.confirmerRappelAlerte(alerteId);
      setAlertes(previous => previous.map(alerte => (
        alerte.rappel_ordonnance === updated.rappel_ordonnance
          ? { ...alerte, statut: 'lue' }
          : alerte.id === alerteId ? updated : alerte
      )));
    } catch (err) {
      setError(err.message || 'Impossible de confirmer cette prise.');
    }
  }

  async function handleFinishTreatment(ordonnanceId, traitementId) {
    try {
      const updated = await api.terminerTraitementOrdonnance(ordonnanceId, traitementId);
      setOrdonnances(previous => previous.map(item => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err.message || 'Impossible de terminer ce médicament.');
    }
  }

  const a     = animal;
  const label = a ? (a.nom?.trim() ? a.nom : a.numero_identification) : '…';
  const age   = a ? calcAge(a.date_naissance) : null;
  const nonLuesAlertes = alertes.filter(al => ['non_lue','Non lue'].includes(al.statut || '')).length;
  const historiqueAffiche = (historyFilter === 'pesage'
    ? getWeighingHistory(historique, suivisSante)
    : historique.filter(event => (
      historyFilter === 'sante' ? isHealthEvent(event)
        : true
    )));

  const NIVEAU_COLOR = { Critique: 'bg-red-600', Avertissement: 'bg-amber-500', Info: 'bg-blue-500' };

  return (
    <div className="relative">

      {/* ── Panneau Historique ── */}
      <SidePanel open={showHistorique} onClose={() => setShowHistorique(false)} title={`Historique — ${label}`}>
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-[#F5F4F2] p-1" role="group" aria-label="Filtrer l’historique">
          {[
            ['tout', 'Tout'],
            ['sante', 'Santé'],
            ['pesage', 'Pesage'],
          ].map(([value, label]) => <button key={value} type="button" aria-pressed={historyFilter === value} onClick={() => setHistoryFilter(value)} className={`min-h-9 rounded-md px-2 text-xs font-medium ${historyFilter === value ? 'bg-white text-[#5C3A21] shadow-sm' : 'text-[#171310]/60 hover:text-[#171310]'}`}>{label}</button>)}
        </div>
        {historiqueAffiche.length === 0 ? (
          <p className="text-[13px] text-[#171310]/40">{historyFilter === 'pesage' ? 'Aucun pesage enregistré.' : historyFilter === 'sante' ? 'Aucun événement de santé enregistré.' : 'Aucun événement enregistré.'}</p>
        ) : (
          <div className="relative pl-1">
            <div className="timeline-line" />
            {historiqueAffiche.map((ev, i) => {
              const isIA = ev.isIA;
              const isPreDiagnostic = isPreDiagnosticEvent(ev.title, ev.type);
              return (
                <div key={ev.id || i} className={`relative pl-8 ${i < historiqueAffiche.length - 1 ? 'pb-5' : ''}`}>
                  <div className={`timeline-dot ${isIA ? 'timeline-dot-info' : ''}`} />
                  {isIA ? (
                    <div className="rounded-xl border border-[#E5E5E3] bg-[#F5F4F2] p-3">
                      <div className="text-[10px] text-[#171310]/40">{formatHistoryDate(ev.date)}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#5C3A21]" />
                        <span className="text-[13px] font-semibold text-[#5C3A21]">{ev.title}</span>
                      </div>
                      {isPreDiagnostic
                        ? <PreDiagnosticHistory description={ev.desc} result={ev.diagnosticResult} />
                        : <p className="mt-1 text-[12px] leading-relaxed text-[#171310]/70">{ev.desc}</p>}
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] text-[#171310]/40">{formatHistoryDate(ev.date)}</div>
                      <div className="text-[13px] font-semibold text-[#171310] mt-0.5">{ev.title}</div>
                      <p className="text-[12px] text-[#171310]/60 mt-0.5">{ev.desc}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SidePanel>

      {/* ── Panneau Alertes ── */}
      <SidePanel open={showAlertes} onClose={() => setShowAlertes(false)} title={`Alertes — ${label}`}>
        {alertes.length === 0 ? (
          <p className="text-[13px] text-[#171310]/40">Aucune alerte pour cet animal.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {alertes.map((al, i) => {
              const niveau = al.niveau || al.type_alerte || '';
              const dot    = NIVEAU_COLOR[niveau] || 'bg-gray-400';
              return (
                <div key={al.id || i} className="rounded-xl border border-[#E5E5E3] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-[11px] text-[#171310]/50">
                      {al.date_creation || al.dateAlerte || ''} — {niveau}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#171310]/70">{al.message}</p>
                  {al.rappel_ordonnance && al.rappel_actif && (
                    <button onClick={() => handleConfirmerRappel(al.id)} className="mt-3 mr-4 text-[11px] font-semibold text-emerald-700 hover:underline">
                      Confirmer la prise
                    </button>
                  )}
                  {['non_lue', 'Non lue'].includes(al.statut) && (
                    <button onClick={() => handleMarkAlerteLue(al.id)} className="mt-3 text-[11px] font-medium text-[#5C3A21] hover:underline">
                      Marquer comme lu
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SidePanel>

      {/* Overlay */}
      {(showHistorique || showAlertes) && (
        <div className="fixed inset-0 z-30 bg-black/20"
          onClick={() => { setShowHistorique(false); setShowAlertes(false); }} />
      )}

      {/* ── Contenu principal ── */}
      <Link to="/cheptel" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour
      </Link>

      {error   && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}
      {loading && <div className="mt-4 text-[13px] text-[#171310]/50">Chargement…</div>}

      {a && (
        <>
          <div className="mt-5">
            <h1 className="font-serif text-[28px] leading-tight text-[#171310]">
              Détails de l&apos;animal — {label}
              {a.nom?.trim() && (
                <span className="ml-2 text-[18px] text-[#171310]/40 font-normal">({a.numero_identification})</span>
              )}
            </h1>
            <p className="mt-1 text-[13px] text-[#171310]/50">Informations complètes de l&apos;animal</p>
          </div>

          {a.photo && <img src={a.photo} alt={`Photo de ${label}`} className="mt-5 h-56 w-full rounded-2xl object-cover sm:w-80" />}

          {/* KPI */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Espèce',       value: fmt(a.espece_display || a.espece), icon: PawPrint,      accent: false },
              { label: 'Poids (kg)',   value: fmt((a.poids_actuel ?? a.poids_naissance) != null ? `${a.poids_actuel ?? a.poids_naissance} kg` : null), icon: Scale, accent: false },
              { label: 'Âge',          value: fmt(age), icon: Calendar,      accent: false },
              { label: 'Alertes',      value: String(nonLuesAlertes), icon: AlertTriangle, accent: nonLuesAlertes > 0 },
            ].map(({ label: lbl, value, icon: Icon, accent }) => (
              <div key={lbl} className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{lbl}</div>
                  <Icon className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
                </div>
                <div className={`mt-2 text-[22px] leading-none font-bold ${value === '—' ? 'text-[#171310]/30' : accent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-4">
            <section className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
              <h2 className="font-serif text-[17px] text-[#171310]">QR code de l’animal</h2>
              <p className="mt-1 text-[12px] text-[#171310]/50">Scannez-le dans Enclos pour ouvrir directement cette fiche.</p>
              {qrImage ? <a href={qrImage} download={`animal-${a.numero_identification}.png`} aria-label="Télécharger le QR code"><img src={qrImage} alt={`QR code de ${label}`} className="mx-auto mt-3 block aspect-square w-full max-w-[208px]" /></a> : <p className="mt-4 text-xs text-red-600">QR code indisponible.</p>}
              <p className="text-center text-xs text-[#171310]/50">{a.numero_identification}</p>
            </section>
            <section id="animal-ordonnances" className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-[17px] text-[#171310]">Ordonnances</h2>{animal.presence === 'present' && <button type="button" onClick={() => setShowOrdonnanceForm(value => !value)} className="rounded-lg bg-[#5C3A21] px-3 py-2 text-xs font-medium text-white">{showOrdonnanceForm ? 'Fermer' : 'Ajouter'}</button>}</div>
              {showOrdonnanceForm && <form ref={ordonnanceFormRef} onSubmit={handleCreateOrdonnance} className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={ouvrirCameraOrdonnance} disabled={ordonnanceOcrLoading || ordonnanceCameraLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#5C3A21] px-3 py-2 text-xs font-medium text-[#5C3A21] hover:bg-[#F8F7F5] disabled:opacity-60">
                      {ordonnanceCameraLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      Prendre une photo
                    </button>
                    <label htmlFor="ordonnance-import" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#E5E5E3] px-3 py-2 text-xs font-medium text-[#171310] hover:bg-[#F8F7F5]">
                      <ImagePlus className="h-4 w-4" />
                      Importer une image
                    </label>
                    <input id="ordonnance-import" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleOrdonnanceOcr} disabled={ordonnanceOcrLoading} className="sr-only" />
                  </div>
                  <p className="mt-1 text-[11px] text-[#171310]/50">La photo est transmise à Gemini pour extraction. Vérifiez les champs avant d’enregistrer.</p>
                  {ordonnanceOcrMessage && <p role="status" className="mt-1 text-xs text-[#171310]/70">{ordonnanceOcrMessage}</p>}
                  {ordonnanceOcrError && <p role="alert" className="mt-1 text-xs text-red-600">{ordonnanceOcrError}</p>}
                  {ordonnanceCameraError && !showOrdonnanceCamera && <p role="alert" className="mt-1 text-xs text-red-600">{ordonnanceCameraError}</p>}
                </div>
                <input name="titre" required maxLength="150" placeholder="Titre de l’ordonnance" className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
                <input name="veterinaire" maxLength="150" placeholder="Vétérinaire" className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
                <input name="date_prescription" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm" />
                <select name="suivi_sante" defaultValue="" className="h-10 rounded-lg border border-[#E5E5E3] px-3 text-sm"><option value="">Lier à un suivi santé (facultatif)</option>{suivisSante.map(suivi => <option key={suivi.id} value={suivi.id}>{suivi.statut} — {suivi.date_debut || `Suivi #${suivi.id}`}</option>)}</select>
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <label htmlFor="animal-ordonnance-document" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#E5E5E3] px-3 py-2 text-xs font-medium text-[#171310] hover:bg-[#F8F7F5]">
                    <Paperclip className="h-4 w-4" />
                    Joindre un document
                  </label>
                  <input id="animal-ordonnance-document" name="document" type="file" accept="application/pdf,image/*" onChange={event => setOrdonnanceDocumentName(event.target.files?.[0]?.name || '')} className="sr-only" />
                  {ordonnanceDocumentName && <span className="max-w-full truncate text-xs text-[#171310]/60">{ordonnanceDocumentName}</span>}
                </div>
                <textarea name="medicaments" required maxLength="5000" placeholder="Médicaments prescrits" className="min-h-20 rounded-lg border border-[#E5E5E3] p-3 text-sm sm:col-span-2" />
                <VoiceDictationButton onTranscript={applyOrdonnanceDictation} />
                <textarea name="instructions" maxLength="5000" placeholder="Instructions du vétérinaire" className="min-h-16 rounded-lg border border-[#E5E5E3] p-3 text-sm sm:col-span-2" />
                {ordonnanceError && <p className="text-xs text-red-600 sm:col-span-2">{ordonnanceError}</p>}
                <button type="submit" className="h-10 rounded-lg bg-[#5C3A21] px-4 text-sm text-white sm:col-span-2">Enregistrer l’ordonnance</button>
              </form>}
              {showOrdonnanceCamera && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
                <section role="dialog" aria-modal="true" aria-labelledby="ordonnance-camera-title" className="w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 id="ordonnance-camera-title" className="text-sm font-semibold">Photographier l’ordonnance</h3>
                    <button type="button" onClick={fermerCameraOrdonnance} aria-label="Fermer la caméra" title="Fermer la caméra" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F5F4F2]"><X className="h-4 w-4" /></button>
                  </div>
                  <video ref={ordonnanceCameraVideoRef} autoPlay playsInline muted onLoadedMetadata={() => setOrdonnanceCameraReady(true)} className="aspect-video w-full rounded-lg bg-black object-contain" />
                  {ordonnanceCameraError && <p role="alert" className="mt-2 text-xs text-red-600">{ordonnanceCameraError}</p>}
                  <div className="mt-3 flex justify-end">
                    <button type="button" onClick={capturerOrdonnance} disabled={!ordonnanceCameraReady || ordonnanceCameraLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#5C3A21] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      <Circle className="h-4 w-4" /> Capturer
                    </button>
                  </div>
                </section>
              </div>}
              {ordonnances.length ? <ul className="mt-4 divide-y divide-[#E5E5E3]">{ordonnances.map(ord => <li key={ord.id} className="py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{ord.titre}</p><p className="mt-1 text-xs text-[#171310]/60">{ord.date_prescription} · {ord.veterinaire || 'Vétérinaire non précisé'}</p><p className="mt-1 whitespace-pre-wrap text-xs">{ord.medicaments}</p>{ord.instructions && <p className="mt-2 whitespace-pre-wrap text-xs text-[#171310]/70"><span className="font-semibold">Instructions du vétérinaire :</span> {ord.instructions}</p>}{ord.traitements?.length > 0 && <ul className="mt-3 space-y-2 border-l-2 border-[#E5E5E3] pl-3">{ord.traitements.map(traitement => <li key={traitement.id} className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold">{traitement.medicament} <span className={`font-normal ${traitement.actif ? 'text-emerald-700' : 'text-[#171310]/45'}`}>· {traitement.actif ? 'En cours' : 'Terminé'}</span></p><p className="whitespace-pre-wrap text-xs text-[#171310]/60">{traitement.posologie}</p>{traitement.heures_prise?.length > 0 && <p className="text-[11px] text-[#171310]/55">Heures : {traitement.heures_prise.join(', ')}</p>}</div>{traitement.actif && <button type="button" onClick={() => handleFinishTreatment(ord.id, traitement.id)} className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-emerald-700 px-2.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-50"><Check className="h-3.5 w-3.5" />Terminer ce médicament</button>}</li>)}</ul>}</div>{ord.document && <a className="text-xs text-[#5C3A21] underline" href={ord.document} target="_blank" rel="noreferrer">Document</a>}</div></li>)}</ul> : <p className="mt-4 text-sm text-[#171310]/50">Aucune ordonnance enregistrée.</p>}
            </section>
          </div>

          <section className="mt-4 rounded-2xl border border-[#E5E5E3] bg-white p-5">
            <div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 text-[#5C3A21]" /><div><h2 className="font-serif text-[18px] text-[#171310]">Pré-diagnostic avec IA</h2><p className="mt-1 text-[12px] text-[#171310]/55">Décrivez les premiers signes en au moins 3 mots, puis poursuivez l’échange avec l’IA.</p></div></div>
            {diagnosticConversation.length > 0 && <div aria-live="polite" className="mt-4 space-y-3">
              {diagnosticConversation.map((turn, index) => <article key={`${index}-${turn.role}`} className={`max-w-[90%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${turn.role === 'assistant' ? 'bg-[#F5F4F2] text-[#171310]' : 'ml-auto bg-[#5C3A21] text-white'}`}>
                <p className="mb-1 text-[10px] font-semibold uppercase opacity-60">{turn.role === 'assistant' ? 'Assistant IA' : 'Vous'}</p>
                {turn.content}
              </article>)}
              <button type="button" onClick={() => { setDiagnosticId(null); setDiagnosticConversation([]); setDiagnosticResult(null); setDiagnosticDescription(''); }} className="text-xs font-medium text-[#5C3A21] underline">Nouveau pré-diagnostic</button>
            </div>}
            {animal.presence === 'present' ? <form onSubmit={handlePreDiagnostic} className="mt-4">
              <label htmlFor="diagnostic-description" className="mb-2 block text-xs font-semibold">{diagnosticId ? 'Votre réponse' : `Observations sur ${label}`}</label><textarea id="diagnostic-description" value={diagnosticDescription} onChange={event => setDiagnosticDescription(event.target.value)} rows={4} maxLength={3000} required placeholder={diagnosticId ? 'Répondez à la question de l’IA…' : 'Décrivez les signes observés…'} className="w-full resize-y rounded-lg border border-[#E5E5E3] p-3 text-sm outline-none focus:border-[#5C3A21]" /><div className="mt-2 flex flex-wrap items-center gap-2"><button type="button" title={listening ? 'Arrêter la dictée' : diagnosticId ? 'Dicter la réponse' : 'Dicter l’observation'} aria-label={listening ? 'Arrêter la dictée' : diagnosticId ? 'Dicter la réponse' : 'Dicter l’observation'} onClick={() => listening ? recognitionRef.current?.stop() : startVoiceDescription()} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#5C3A21] text-[#5C3A21]">{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button><button type="submit" disabled={diagnosticLoading} title={diagnosticLoading ? 'Réponse en cours' : diagnosticId ? 'Envoyer la réponse' : 'Analyser le pré-diagnostic'} aria-label={diagnosticLoading ? 'Réponse en cours' : diagnosticId ? 'Envoyer la réponse' : 'Analyser le pré-diagnostic'} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C3A21] text-white disabled:opacity-60">{diagnosticLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : diagnosticId ? <Send className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</button><span className="text-[11px] text-[#171310]/45">{!diagnosticId && `La fiche de ${label} et sa photo seront prises en compte.`}</span></div>{diagnosticError && <p className="mt-2 text-xs text-red-600">{diagnosticError}</p>}
            </form> : <p className="mt-4 text-sm text-[#171310]/60">Un pré-diagnostic ne peut pas être demandé pour un animal vendu ou mort.</p>}
            {diagnosticResult && Boolean(diagnosticResult.suggestions?.length || diagnosticResult.recommandations?.length) && <div className="mt-5 rounded-xl border border-[#E5E5E3] bg-[#F8F7F5] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Pistes à vérifier</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${diagnosticResult.urgence === 'élevée' ? 'bg-red-100 text-red-700' : diagnosticResult.urgence === 'faible' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>Urgence {diagnosticResult.urgence}</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{diagnosticResult.suggestions?.map((suggestion, index) => <article key={`${suggestion.nom}-${index}`} className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">{suggestion.nom}</h4><p className="mt-1 text-xs leading-relaxed text-[#171310]/70">{suggestion.justification}</p>{suggestion.niveau && <p className="mt-1 text-[11px] text-[#171310]/50">Niveau : {suggestion.niveau}</p>}</article>)}</div><h4 className="mt-4 text-xs font-semibold">Premières recommandations</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#171310]/75">{diagnosticResult.recommandations?.map((recommendation, index) => <li key={index}>{recommendation}</li>)}</ul><p className="mt-3 border-t border-[#E5E5E3] pt-3 text-[11px] text-[#171310]/55">{diagnosticResult.limites} Cette aide ne remplace pas l’avis d’un vétérinaire.</p></div>}
          </section>

          {/* Corps */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">

            {/* Carte principale onglets */}
            <div className="rounded-2xl border border-[#E5E5E3] bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-5 border-b border-[#E5E5E3]">
                <h2 className="font-serif text-[18px] font-medium text-[#171310]">Informations générales</h2>
                <div className="flex items-center gap-6">
                  {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`relative pb-2 text-[12px] transition-colors
                        ${activeTab === tab
                          ? 'text-[#5C3A21] font-semibold after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-[#5C3A21] after:rounded-sm'
                          : 'text-[#171310]/50 hover:text-[#171310]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── ONGLET GÉNÉRAL ── */}
              {activeTab === 'Général' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 px-6 py-6">
                  {[
                    ['Identifiant',       fmt(a.numero_identification)],
                    ['Nom',               fmt(a.nom)],
                    ['Sexe',              fmt(a.sexe_display || a.sexe)],
                    ['Date de naissance', fmt(a.date_naissance)],
                    ['Couleur',           fmt(a.couleur)],
                    ['Race',              fmt(a.race_nom || (typeof a.race === 'object' ? a.race?.nom : null))],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium">{lbl}</div>
                      <div className={`mt-1 text-[14px] font-medium ${val === '—' ? 'text-[#171310]/40' : 'text-[#171310]'}`}>{val}</div>
                    </div>
                  ))}
                  {a.observations && (
                    <div className="sm:col-span-2">
                      <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Observations</div>
                      <div className="rounded-lg bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310] leading-relaxed">{a.observations}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ONGLET SANTÉ ── */}
              {activeTab === 'Santé' && (
                <div className="px-6 py-6">
                  {animal.presence !== 'present' && <p className="mb-5 rounded-lg bg-amber-50 p-3 text-[13px] text-amber-900">Animal {animal.presence === 'mort' ? 'mort' : 'vendu'} : les suivis et rendez-vous ne peuvent plus être modifiés. Le carnet reste consultable.</p>}
                  {animal.presence === 'present' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 pb-6">

                  {/* Présence */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Présence</div>
                    <div className="relative">
                      <select value={presence} onChange={e => { setPresence(e.target.value); setSanteFieldErrors(previous => ({ ...previous, presence: '' })); }} className={selectCls}>
                        <option value="present">Présent</option>
                        <option value="vendu">Vendu</option>
                        <option value="mort">Mort</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
                    </div>
                    <FieldError message={santeFieldErrors.presence} />
                  </div>

                  {/* État de santé */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">État de santé</div>
                    <div className="relative">
                      <select value={etatSante} onChange={e => { setEtatSante(e.target.value); setSanteFieldErrors(previous => ({ ...previous, etatSante: '' })); }} className={selectCls}>
                        <option value="sain">Sain</option>
                        <option value="malade">Malade</option>
                        <option value="gestation">Gestation</option>
                        <option value="en_traitement">En traitement</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
                    </div>
                    <FieldError message={santeFieldErrors.etatSante} />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Notes de santé</div>
                    <textarea rows={4} value={noteSante} onChange={e => { setNoteSante(e.target.value); setSanteFieldErrors(previous => ({ ...previous, noteSante: '' })); }}
                      placeholder="Observations, traitements en cours…"
                      className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
                    />
                    <FieldError message={santeFieldErrors.noteSante} />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button type="button" onClick={handleSaveSante} disabled={savingSante}
                      className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
                      <Check className="w-4 h-4 stroke-[2]" />
                      {savingSante ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                  </div>}
                  <section className="border-t border-[#E5E5E3] pt-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div><h3 className="font-serif text-[17px] text-[#171310]">Carnet de santé</h3><p className="mt-1 text-xs text-[#171310]/50">Consultations, mesures, notes et prochains rendez-vous.</p></div>
                      {animal.presence === 'present' && <Link to={`/sante/ajouter?animal=${id}`} className="rounded-lg bg-[#5C3A21] px-3 py-2 text-xs font-medium text-white">Nouveau suivi</Link>}
                    </div>
                    {suivisSante.length === 0 ? <p className="rounded-lg bg-[#F5F4F2] p-4 text-sm text-[#171310]/55">Aucun suivi enregistré pour cet animal.</p> : <div className="space-y-3">{suivisSante.map(suivi => <Link key={suivi.id} to={`/sante/${suivi.id}`} className="block rounded-xl border border-[#E5E5E3] p-4 transition-colors hover:bg-[#FAF9F7]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-[#171310]">{suivi.statut}</span><span className="text-xs text-[#171310]/50">{suivi.date_debut || 'Date non précisée'}{suivi.date_prochaine_consultation ? ` · Prochaine consultation : ${suivi.date_prochaine_consultation}` : ''}</span></div><p className="mt-2 text-xs text-[#171310]/60">{[suivi.poids_kg != null && `Poids : ${suivi.poids_kg} kg`, suivi.temperature_celsius != null && `Température : ${suivi.temperature_celsius} °C`, suivi.frequence_cardiaque != null && `Fréquence : ${suivi.frequence_cardiaque} bpm`].filter(Boolean).join(' · ') || 'Aucune mesure'}{suivi.note ? ` — ${suivi.note}` : ''}</p></Link>)}</div>}
                    <div className="mt-5 flex items-center justify-between gap-3"><h3 className="font-serif text-[17px] text-[#171310]">Ordonnances</h3>{animal.presence === 'present' && <button type="button" onClick={() => { setActiveTab('Général'); document.getElementById('animal-ordonnances')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="text-xs font-medium text-[#5C3A21] underline">Consulter et enregistrer</button>}</div>
                    {ordonnances.length === 0 && <p className="mt-3 text-sm text-[#171310]/55">Aucune ordonnance enregistrée.</p>}
                  </section>
                </div>
              )}

              {/* ── ONGLET ALIMENTATION ── */}
              {activeTab === 'Alimentation' && (
                <div className="px-6 pt-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] text-[#171310]/60">Dernières rations enregistrées</span>
                    <Link to="/alimentation/ajouter"
                      className="h-8 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-3 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors">
                      + Ajouter
                    </Link>
                  </div>

                  {alimentations.length === 0 ? (
                    <p className="text-[13px] text-[#171310]/40 py-4 text-center">Aucune alimentation enregistrée pour cet animal.</p>
                  ) : (
                    <div className="rounded-xl border border-[#E5E5E3] overflow-hidden">
                      <table className="w-full border-collapse text-[12px]">
                        <thead>
                          <tr className="h-9 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                            {["Date", "Type d'aliment", "Quantité", "Fréquence"].map(h => (
                              <th key={h} className="px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {alimentations.map((al, i) => (
                            <tr key={al.id || i} className={`h-10 ${i < alimentations.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                              <td className="px-3 text-[#171310]/70">{fmt(al.date_alimentation)}</td>
                              <td className="px-3 font-medium text-[#171310]">{fmt(al.type_aliment_nom || al.type_aliment)}</td>
                              <td className="px-3 text-[#171310]/70">{al.quantite_kg != null ? `${al.quantite_kg} kg` : '—'}</td>
                              <td className="px-3 text-[#171310]/70">{fmt(al.frequence_nom || al.frequence)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Colonne droite ── */}
            <div className="flex flex-col gap-5">

              {/* Dernières activités */}
              <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Dernières activités</h3>
                  <button onClick={() => setShowHistorique(true)} className="text-[12px] text-[#5C3A21] hover:underline">
                    Voir l&apos;historique
                  </button>
                </div>
                {historique.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-[#171310]/30">
                    <History className="w-6 h-6" />
                    <p className="text-[12px]">Aucun événement</p>
                  </div>
                ) : (
                  historique.slice(0, 2).map((ev, i) => (
                    <div key={ev.id || i} className={`${i > 0 ? 'pt-3' : ''} ${i < Math.min(historique.length, 2) - 1 ? 'pb-3 border-b border-[#E5E5E3]' : ''}`}>
                      <div className="text-[11px] text-[#171310]/40">{formatHistoryDate(ev.date)}</div>
                      <div className="text-[13px] font-semibold text-[#171310] mt-1">{ev.title}</div>
                      {ev.desc && (isPreDiagnosticEvent(ev.title, ev.type)
                        ? <PreDiagnosticHistory description={ev.desc} result={ev.diagnosticResult} compact />
                        : <div className="text-[12px] text-[#171310]/60 mt-0.5">{ev.desc}</div>)}
                    </div>
                  ))
                )}
              </div>

              {/* Alertes récentes */}
              <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Alertes récentes</h3>
                  <button onClick={() => setShowAlertes(true)} className="text-[12px] text-[#5C3A21] hover:underline">
                    Voir les alertes
                  </button>
                </div>
                {alertes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-[#171310]/30">
                    <Bell className="w-6 h-6" />
                    <p className="text-[12px]">Aucune alerte</p>
                  </div>
                ) : (
                  alertes.slice(0, 1).map((al, i) => {
                    const niveau = al.niveau || al.type_alerte || '';
                    const dot = NIVEAU_COLOR[niveau] || 'bg-gray-400';
                    return (
                      <div key={al.id || i}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <div className="text-[11px] text-[#171310]/40">
                            {al.date_creation || al.dateAlerte || ''} — {niveau}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#171310]/70 mt-2 leading-relaxed">{al.message}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bouton modifier */}
              {animal.presence === 'present' && <Link to={`/cheptel/${id}/modifier`}
                className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors">
                <Pencil className="w-4 h-4 stroke-[1.8]" />
                Modifier cet animal
              </Link>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
