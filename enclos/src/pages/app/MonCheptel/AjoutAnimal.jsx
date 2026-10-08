import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, Plus, X, Wheat } from 'lucide-react';
import api from '../../../API/api';
import useAlimRefs from '../../../hooks/useAlimRefs';
import CreateSimpleModal from '../../../components/common/CreateSimpleModal';
import FieldError from '../../../components/common/FieldError';
import VoiceDictationButton from '../../../components/common/VoiceDictationButton';
import { clean, validateAnimal, validateDate, validateNumber, validateSimpleRecord } from '../../../utils/validation';

const inputCls  = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';
const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';

function SelectField({ id, label, children, value, onChange, required, error }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-[13px] font-semibold text-[#171310] mb-2">{label}</label>}
      <div className="relative">
        <select id={id} className={selectCls} value={value} onChange={onChange} required={required}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
      </div>
      <FieldError message={error} />
    </div>
  );
}

/* Sélecteur avec bouton "+" pour créer à la volée */
function SelectWithCreate({ id, label, value, onChange, items, loading, onAdd, placeholder, error }) {
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
      <FieldError message={error} />
    </div>
  );
}

const ESPECE_CHOICES = [
  { value: 'bovin',  label: 'Bovin'  },
  { value: 'ovin',   label: 'Ovin'   },
  { value: 'caprin', label: 'Caprin' },
  { value: 'porcin', label: 'Porcin' },
];

const SPOKEN_FIELD_LABELS = 'nom(?: de l.animal)?|s.appelle|esp[eè]ce|race|sexe|date de naissance|n[eé](?:e)?(?: le)?|poids(?: actuel)?|couleur|pr[eé]sence|statut|[eé]tat(?: de sant[eé])?|observations?|notes?';

function normalizeSpokenText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function spokenField(transcript, labelPattern) {
  const nextLabel = `(?:${SPOKEN_FIELD_LABELS})`;
  const expression = new RegExp(`(?:^|[,;.!?]\\s*|\\b)(?:${labelPattern})\\s*(?::|\\b(?:est|c'est)\\b)?\\s*(.+?)(?=\\s*(?:[,;.!?]|\\b${nextLabel}\\b)|$)`, 'i');
  return transcript.match(expression)?.[1]?.trim().replace(/^[:\s]+|\s+$/g, '') || '';
}

function parseSpokenSpecies(value) {
  const normalized = normalizeSpokenText(value);
  if (/\b(bovin|bovine|vache|taureau|veau)\b/.test(normalized)) return 'bovin';
  if (/\b(ovin|ovine|brebis|mouton|agneau)\b/.test(normalized)) return 'ovin';
  if (/\b(caprin|caprine|chevre|bouc|chevreau)\b/.test(normalized)) return 'caprin';
  if (/\b(porcin|porcine|cochon|truie|porcelet)\b/.test(normalized)) return 'porcin';
  return '';
}

function parseSpokenNumber(value) {
  const normalized = normalizeSpokenText(value).replace(/(\d+)\s+virgule\s+(\d+)/, '$1.$2');
  const match = normalized.match(/\d+(?:[,.]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

function parseSpokenDate(value) {
  const normalized = normalizeSpokenText(value);
  const numericDate = normalized.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (numericDate) {
    const [, day, month, rawYear] = numericDate;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const spokenDate = normalized.match(/\b(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})\b/);
  if (!spokenDate) return '';
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  return `${spokenDate[3]}-${String(months.indexOf(spokenDate[2]) + 1).padStart(2, '0')}-${spokenDate[1].padStart(2, '0')}`;
}

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
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const cameraStream = useRef(null);
  const pendingRaceNameRef = useRef('');

  useEffect(() => {
    if (!photo) { setPhotoPreview(''); return undefined; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStream.current) {
      videoRef.current.srcObject = cameraStream.current;
      videoRef.current.play().catch(() => setCameraError('Impossible de démarrer l’aperçu caméra.'));
    }
  }, [cameraOpen]);

  useEffect(() => () => cameraStream.current?.getTracks().forEach(track => track.stop()), []);

  async function openCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('La caméra nécessite un navigateur compatible et une connexion sécurisée (HTTPS ou localhost).');
      return;
    }
    try {
      cameraStream.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setCameraOpen(true);
    } catch (err) {
      const message = err.name === 'NotAllowedError'
        ? 'L’accès à la caméra est refusé. Autorisez la caméra dans les réglages du navigateur puis réessayez.'
        : err.name === 'NotFoundError'
          ? 'Aucune caméra n’a été détectée sur cet appareil.'
          : 'Impossible d’ouvrir la caméra. Vérifiez qu’elle n’est pas déjà utilisée par une autre application.';
      setCameraError(message);
    }
  }

  function closeCamera() {
    cameraStream.current?.getTracks().forEach(track => track.stop());
    cameraStream.current = null;
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError('La caméra n’est pas encore prête. Patientez un instant puis réessayez.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) { setCameraError('La photo n’a pas pu être créée. Réessayez.'); return; }
      setPhoto(new File([blob], `animal-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      setError('');
      closeCamera();
    }, 'image/jpeg', 0.92);
  }

  /* ── Alimentation optionnelle ── */
  const [withAlim,    setWithAlim]    = useState(false);
  const [alimType,    setAlimType]    = useState('');
  const [alimFreq,    setAlimFreq]    = useState('');
  const [alimQte,     setAlimQte]     = useState('');
  const [alimDate,    setAlimDate]    = useState('');

  /* ── Races dynamiques ── */
  const [races,        setRaces]        = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesSpecies, setRacesSpecies] = useState('');

  /* ── Modals ── */
  const [showRaceModal,  setShowRaceModal]  = useState(false);
  const [newRaceNom,     setNewRaceNom]     = useState('');
  const [newRaceDesc,    setNewRaceDesc]    = useState('');
  const [creatingRace,   setCreatingRace]   = useState(false);
  const [raceModalError, setRaceModalError] = useState('');
  const [raceFieldErrors, setRaceFieldErrors] = useState({});

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFreqModal, setShowFreqModal] = useState(false);

  /* ── Soumission ── */
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [alimErrors, setAlimErrors] = useState({});

  function updateField(field, setter, event, setErrors = setFieldErrors) {
    setter(event.target.value);
    setErrors(previous => ({ ...previous, [field]: '' }));
  }

  /* Charger les races selon l'espèce */
  useEffect(() => {
    async function loadRaces() {
      try {
        setRacesLoading(true);
        const data = await api.getRaces(espece);
        const nextRaces = Array.isArray(data) ? data : [];
        setRaces(nextRaces);
        setRacesSpecies(espece);
        const spokenRace = pendingRaceNameRef.current;
        const matchingRace = spokenRace && nextRaces.find(item => normalizeSpokenText(item.nom) === normalizeSpokenText(spokenRace));
        setRace(matchingRace ? String(matchingRace.id) : '');
        pendingRaceNameRef.current = '';
      } catch {
        setRaces([]);
        setRacesSpecies(espece);
        pendingRaceNameRef.current = '';
      } finally {
        setRacesLoading(false);
      }
    }
    loadRaces();
  }, [espece]);

  function applyAnimalDictation(transcript) {
    let filledFields = 0;
    const valueFor = label => spokenField(transcript, label);
    const spokenName = valueFor('nom(?: de l.animal)?|s.appelle');
    const spokenSpecies = parseSpokenSpecies(valueFor('esp[eè]ce')) || parseSpokenSpecies(transcript);
    const spokenRace = valueFor('race');
    const spokenSex = normalizeSpokenText(valueFor('sexe') || transcript);
    const spokenDate = parseSpokenDate(valueFor('date de naissance|n[eé](?:e)?(?: le)?'));
    const spokenWeight = parseSpokenNumber(valueFor('poids(?: actuel)?'));
    const spokenColor = valueFor('couleur');
    const spokenPresence = normalizeSpokenText(valueFor('pr[eé]sence|statut'));
    const spokenHealth = normalizeSpokenText(valueFor('[eé]tat(?: de sant[eé])?'));
    const spokenObservations = valueFor('observations?|notes?');

    if (spokenName) { setNom(spokenName); filledFields += 1; }
    if (spokenSpecies) { setEspece(spokenSpecies); filledFields += 1; }
    if (spokenRace) {
      const targetSpecies = spokenSpecies || espece;
      if (targetSpecies === espece && racesSpecies === targetSpecies && !racesLoading) {
        const matchingRace = races.find(item => normalizeSpokenText(item.nom) === normalizeSpokenText(spokenRace));
        if (matchingRace) setRace(String(matchingRace.id));
      } else {
        pendingRaceNameRef.current = spokenRace;
      }
      filledFields += 1;
    }
    if (/\b(femelle|vache|brebis|truie)\b/.test(spokenSex)) { setSexe('femelle'); filledFields += 1; }
    else if (/\b(male|taureau|bouc)\b/.test(spokenSex)) { setSexe('male'); filledFields += 1; }
    if (spokenDate) { setDateNaissance(spokenDate); filledFields += 1; }
    if (spokenWeight) { setPoids(spokenWeight); filledFields += 1; }
    if (spokenColor) { setCouleur(spokenColor); filledFields += 1; }
    if (/\b(vendu|vendue)\b/.test(spokenPresence)) { setPresence('vendu'); filledFields += 1; }
    else if (/\b(mort|morte|decede|decedee)\b/.test(spokenPresence)) { setPresence('mort'); filledFields += 1; }
    else if (/\b(present|presente)\b/.test(spokenPresence)) { setPresence('present'); filledFields += 1; }
    if (/\b(malade|malade)\b/.test(spokenHealth)) { setEtatSante('malade'); filledFields += 1; }
    else if (/\b(gestation|gestante|enceinte)\b/.test(spokenHealth)) { setEtatSante('gestation'); filledFields += 1; }
    else if (/\b(traitement|en traitement)\b/.test(spokenHealth)) { setEtatSante('en_traitement'); filledFields += 1; }
    else if (/\b(sain|saine)\b/.test(spokenHealth)) { setEtatSante('sain'); filledFields += 1; }
    if (spokenObservations) { setObservations(spokenObservations); filledFields += 1; }

    const spokenFeedType = valueFor('type d.aliment|aliment');
    const spokenFeedFrequency = valueFor('fr[eé]quence');
    const spokenFeedQuantity = parseSpokenNumber(valueFor('quantit[eé]'));
    const spokenFeedDate = parseSpokenDate(valueFor('date d.alimentation'));
    if (spokenFeedType || spokenFeedFrequency || spokenFeedQuantity || spokenFeedDate) {
      setWithAlim(true);
      const feedType = typeAliments.find(item => normalizeSpokenText(item.nom) === normalizeSpokenText(spokenFeedType));
      const feedFrequency = frequences.find(item => normalizeSpokenText(item.nom) === normalizeSpokenText(spokenFeedFrequency));
      if (feedType) { setAlimType(String(feedType.id)); filledFields += 1; }
      if (feedFrequency) { setAlimFreq(String(feedFrequency.id)); filledFields += 1; }
      if (spokenFeedQuantity) { setAlimQte(spokenFeedQuantity); filledFields += 1; }
      if (spokenFeedDate) { setAlimDate(spokenFeedDate); filledFields += 1; }
    }

    setError('');
    return filledFields;
  }

  /* Créer une nouvelle race */
  async function handleCreateRace(e) {
    e.preventDefault();
    const validation = validateSimpleRecord(newRaceNom, newRaceDesc);
    setRaceFieldErrors(validation.errors);
    if (validation.message) return;
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
    const animalValidation = validateAnimal({ photo, nom, espece, sexe, dateNaissance, poids, couleur, observations });
    setFieldErrors(animalValidation.errors);
    if (animalValidation.message) {
      return;
    }
    if (withAlim) {
      const nextAlimErrors = {
        alimType: !alimType ? "Le type d'aliment est obligatoire." : '',
        alimQte: !alimQte ? 'La quantité est obligatoire.' : validateNumber(alimQte, 'La quantité', { positive: true, max: 100000, decimals: 2 }),
        alimDate: validateDate(alimDate, 'La date', { notFuture: true }),
      };
      setAlimErrors(nextAlimErrors);
      if (Object.values(nextAlimErrors).some(Boolean)) return;
    } else {
      setAlimErrors({});
    }
    try {
      setSaving(true);
      // 1. Créer l'animal
      const animalPayload = {
        nom: clean(nom),
        espece,
        race:            race          || null,
        sexe,
        date_naissance:  dateNaissance || null,
        poids_actuel:    poids         || 0,
        presence,
        etat_sante:      etatSante,
        couleur: clean(couleur),
        observations: clean(observations),
      };
      let animal;
      if (photo) { const form = new FormData(); Object.entries(animalPayload).forEach(([key, value]) => form.append(key, value ?? '')); form.append('photo', photo); animal = await api.createAnimal(form); }
      else animal = await api.createAnimal(animalPayload);

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

      {!photoConfirmed && <section className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50">Étape 1 sur 2</p>
        <h2 className="mt-2 font-serif text-[21px] text-[#171310]">Photographiez l’animal</h2>
        <p className="mt-1 text-[13px] text-[#171310]/55">Prenez une photo maintenant ou importez une image. Vous pourrez remplir sa fiche après cette étape.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={cameraOpen ? closeCamera : openCamera} className="flex min-h-12 items-center justify-center rounded-xl bg-[#5C3A21] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#3B2313]">{cameraOpen ? 'Fermer la caméra' : 'Ouvrir la caméra'}</button>
          <label htmlFor="animal-photo-first" className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-[#5C3A21]/50 bg-[#FAF9F7] px-4 py-3 text-center text-sm font-medium text-[#5C3A21]">Importer une photo</label>
          <input id="animal-photo-first" type="file" accept="image/*" onChange={e => { setPhoto(e.target.files?.[0] || null); setError(''); setCameraError(''); }} className="sr-only" />
        </div>
        {cameraOpen && <div className="mt-4 overflow-hidden rounded-xl bg-black"><video ref={videoRef} playsInline autoPlay muted className="max-h-[65vh] w-full object-contain" /><div className="flex justify-center p-3"><button type="button" onClick={capturePhoto} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#171310]">Prendre la photo</button></div></div>}
        {cameraError && <p role="alert" className="mt-3 text-sm text-red-600">{cameraError}</p>}
        {photoPreview && <div className="mt-4"><img src={photoPreview} alt="Photo de l’animal à enregistrer" className="max-h-72 w-full rounded-xl object-cover" /><p className="mt-2 text-xs text-[#171310]/50">{photo?.name}</p></div>}
        <div className="mt-5 flex justify-end"><button type="button" disabled={!photo} onClick={() => { setError(''); setPhotoConfirmed(true); }} className="h-10 rounded-lg bg-[#5C3A21] px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Continuer vers les informations</button></div>
      </section>}

      {photoConfirmed && <form noValidate onSubmit={handleSubmit} className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">

        {/* ── Informations générales ── */}
        <div className="mb-5 flex items-center gap-4 rounded-xl bg-[#FAF9F7] p-3">{photoPreview && <img src={photoPreview} alt="Photo de l’animal" className="h-16 w-16 rounded-lg object-cover" />}<div className="min-w-0 flex-1"><p className="text-xs font-semibold">Photo de l’animal ajoutée</p><button type="button" onClick={() => setPhotoConfirmed(false)} className="mt-1 text-xs text-[#5C3A21] underline">Changer la photo</button></div></div>
        <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">
          Informations générales
        </p>
        <div className="mb-5 rounded-lg border border-[#E5E5E3] bg-[#FAF9F7] p-3">
          <VoiceDictationButton
            onTranscript={applyAnimalDictation}
            buttonLabel="Dicter les informations"
            helperText="Nommez les champs à remplir : nom, espèce, race, sexe, date de naissance, poids, couleur, statut, état de santé et observations. Vérifiez les champs avant l’enregistrement."
            containerClassName=""
          />
        </div>

        {/* Nom */}
        <div className="mb-4">
          <label htmlFor="nom" className="block text-[13px] font-semibold text-[#171310] mb-2">
            Nom <span className="text-[#171310]/40 font-normal">(optionnel)</span>
          </label>
          <input id="nom" type="text" placeholder="Ex: Django" value={nom} onChange={e => updateField('nom', setNom, e)} className={inputCls} />
          <FieldError message={fieldErrors.nom} />
        </div>

        {/* Espèce + Race */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField id="espece" label="Espèce" value={espece} onChange={e => updateField('espece', setEspece, e)} required error={fieldErrors.espece}>
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
              <button key={v} type="button" onClick={() => { setSexe(v); setFieldErrors(previous => ({ ...previous, sexe: '' })); }}
                className={`flex-1 h-11 rounded-[10px] border flex items-center justify-center text-[13px] transition-all
                  ${sexe === v ? 'border-[#5C3A21] bg-[#F5F4F2] text-[#5C3A21] font-semibold' : 'border-[#DCDCD9] bg-white text-[#171310] hover:bg-[#F5F4F2]'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <FieldError message={fieldErrors.sexe} />
        </div>

        {/* ── Données physiques ── */}
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-[#171310]/50 mb-4">Données physiques &amp; date</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateNaissance" className="block text-[13px] font-semibold text-[#171310] mb-2">Date de naissance</label>
              <input id="dateNaissance" type="date" value={dateNaissance} onChange={e => updateField('dateNaissance', setDateNaissance, e)} className={inputCls} />
              <FieldError message={fieldErrors.dateNaissance} />
            </div>
            <div>
              <label htmlFor="poids" className="block text-[13px] font-semibold text-[#171310] mb-2">Poids actuel (kg) <span className="text-red-600">*</span></label>
              <input id="poids" type="number" placeholder="0.00" step="0.1" min="0" max="6000" value={poids} onChange={e => updateField('poids', setPoids, e)} className={inputCls} />
              <FieldError message={fieldErrors.poids} />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="couleur" className="block text-[13px] font-semibold text-[#171310] mb-2">
              Couleur <span className="text-[#171310]/40 font-normal">(optionnel)</span>
            </label>
            <input id="couleur" type="text" placeholder="Ex: Robe tachetée noire et blanche" value={couleur} onChange={e => updateField('couleur', setCouleur, e)} className={inputCls} />
            <FieldError message={fieldErrors.couleur} />
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
            value={observations} onChange={e => updateField('observations', setObservations, e)}
            className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
          <FieldError message={fieldErrors.observations} />
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
                  onChange={e => updateField('alimType', setAlimType, e, setAlimErrors)}
                  items={typeAliments}
                  loading={refsLoading}
                  onAdd={() => setShowTypeModal(true)}
                  placeholder="Sélectionner"
                  error={alimErrors.alimType}
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
                    value={alimQte} onChange={e => updateField('alimQte', setAlimQte, e, setAlimErrors)} className={inputCls} />
                  <FieldError message={alimErrors.alimQte} />
                </div>
                <div>
                  <label htmlFor="alimDate" className="block text-[13px] font-semibold text-[#171310] mb-2">Date</label>
                  <input id="alimDate" type="date" value={alimDate} onChange={e => updateField('alimDate', setAlimDate, e, setAlimErrors)} className={inputCls} />
                  <FieldError message={alimErrors.alimDate} />
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
      </form>}

      {/* ── Modal création de race ── */}
      {showRaceModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !creatingRace && setShowRaceModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[440px]">
              <form noValidate onSubmit={handleCreateRace}>
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
                      value={newRaceNom} onChange={e => { setNewRaceNom(e.target.value); setRaceFieldErrors(previous => ({ ...previous, nom: '' })); }}
                      required disabled={creatingRace} autoFocus className={inputCls} />
                    <FieldError message={raceFieldErrors.nom} />
                  </div>
                  <div>
                    <label htmlFor="newRaceDesc" className="block text-[13px] font-semibold text-[#171310] mb-2">
                      Description <span className="text-[#171310]/40 font-normal">(optionnel)</span>
                    </label>
                    <textarea id="newRaceDesc" rows={2} placeholder="Caractéristiques, origine…"
                      value={newRaceDesc} onChange={e => { setNewRaceDesc(e.target.value); setRaceFieldErrors(previous => ({ ...previous, description: '' })); }}
                      disabled={creatingRace}
                      className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
                    />
                    <FieldError message={raceFieldErrors.description} />
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
