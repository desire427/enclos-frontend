import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Mic, MicOff } from 'lucide-react';

export default function VoiceDictationButton({
  onTranscript,
  buttonLabel = 'Dicter les médicaments et consignes',
  helperText = 'Dictez les médicaments. Dites « instructions » ou « consignes » avant de dicter les consignes.',
  containerClassName = 'sm:col-span-2',
  iconOnly = false,
}) {
  const recognitionRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState('');

  function releaseMicrophone() {
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    microphoneStreamRef.current = null;
  }

  useEffect(() => () => {
    recognitionRef.current?.abort();
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  async function start() {
    setMessage('');
    if (!window.isSecureContext) {
      setMessage('La dictée nécessite localhost ou une connexion HTTPS.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('La dictée vocale n’est pas prise en charge par ce navigateur. Essayez Chrome ou Edge à jour.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('Ce navigateur ne donne pas accès au microphone. Utilisez un navigateur récent sur localhost ou HTTPS.');
      return;
    }

    setStarting(true);
    try {
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const messages = {
        NotAllowedError: 'Accès au microphone refusé. Autorisez le microphone pour ce site dans les réglages du navigateur.',
        NotFoundError: 'Aucun microphone n’a été détecté sur cet appareil.',
        NotReadableError: 'Le microphone est occupé ou inaccessible. Fermez les autres applications qui l’utilisent.',
        SecurityError: 'Le navigateur bloque le microphone. Utilisez localhost ou une connexion HTTPS.',
      };
      setMessage(messages[error.name] || `Impossible d’ouvrir le microphone (${error.name || 'erreur inconnue'}).`);
      releaseMicrophone();
      setStarting(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = '';
    let lastFinalIndex = 0;
    let recognitionError = '';

    recognition.onstart = () => {
      setStarting(false);
      setListening(true);
      setMessage('Microphone prêt. Parlez maintenant…');
    };

    recognition.onresult = event => {
      let interimTranscript = '';
      for (let index = lastFinalIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += `${finalTranscript ? ' ' : ''}${result[0].transcript.trim()}`;
          lastFinalIndex = index + 1;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      if (interimTranscript.trim()) setMessage(`Parole détectée : « ${interimTranscript.trim()} »`);
      else if (finalTranscript.trim()) setMessage('Parole reconnue. Finalisation de la transcription…');
    };

    recognition.onerror = event => {
      recognitionError = event.error;
      setListening(false);
      const messages = {
        'not-allowed': 'Le microphone est accessible, mais le navigateur bloque son service de reconnaissance vocale. Vérifiez ses réglages de dictée.',
        'service-not-allowed': 'Le service vocal de ce navigateur est indisponible. Essayez Chrome ou Edge à jour, ou saisissez les informations manuellement.',
        network: 'Le service de reconnaissance vocale est inaccessible. Vérifiez la connexion Internet puis réessayez.',
        'audio-capture': 'Le navigateur ne reçoit pas le son du microphone. Vérifiez le microphone sélectionné dans les réglages système.',
        'no-speech': 'Aucune parole n’a été reconnue. Parlez après « Microphone prêt » et vérifiez le micro sélectionné. Avec Brave, désactivez Shields pour localhost ou essayez Chrome/Edge : leurs services vocaux sont mieux pris en charge.',
        aborted: 'La dictée a été interrompue.',
      };
      setMessage(messages[event.error] || `La dictée a échoué (${event.error || 'erreur inconnue'}).`);
    };

    recognition.onend = () => {
      setListening(false);
      setStarting(false);
      releaseMicrophone();
      if (finalTranscript.trim()) {
        const updatedFields = onTranscript(finalTranscript.trim());
        setMessage(Number.isInteger(updatedFields)
          ? updatedFields > 0
            ? `${updatedFields} champ${updatedFields > 1 ? 's' : ''} rempli${updatedFields > 1 ? 's' : ''}. Vérifiez-les avant l’enregistrement.`
            : 'Transcription reçue, mais aucun champ reconnu. Dites les libellés des champs avant leur valeur.'
          : `Transcription ajoutée : « ${finalTranscript.trim()} » — relisez les champs avant d’enregistrer.`);
      } else if (!recognitionError) {
        setMessage('Aucune parole reçue. Vérifiez le microphone et parlez dès que l’écoute démarre.');
      }
    };

    try {
      recognition.start();
    } catch (error) {
      setListening(false);
      setStarting(false);
      releaseMicrophone();
      setMessage(`Impossible de démarrer la dictée (${error.name || 'erreur inconnue'}).`);
    }
  }

  return <div className={containerClassName}>
    <button type="button" disabled={starting} onClick={listening ? () => recognitionRef.current?.stop() : start} title={starting ? 'Connexion au microphone…' : listening ? 'Arrêter la dictée' : buttonLabel} aria-label={starting ? 'Connexion au microphone' : listening ? 'Arrêter la dictée' : buttonLabel} className={`inline-flex items-center justify-center rounded-lg border border-[#5C3A21] text-xs font-medium text-[#5C3A21] disabled:cursor-wait disabled:opacity-60 ${iconOnly ? 'h-10 w-10' : 'px-3 py-2'}`}>
      {iconOnly ? starting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" /> : starting ? 'Connexion au microphone…' : listening ? 'Arrêter la dictée' : buttonLabel}
    </button>
    <p className="mt-1 text-[11px] text-[#171310]/50">{helperText}</p>
    {message && <p role="status" className="mt-1 text-xs text-[#171310]/70">{message}</p>}
  </div>;
}