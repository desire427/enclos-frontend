import { useRef, useState } from 'react';

export default function VoiceDictationButton({
  onTranscript,
  buttonLabel = 'Dicter les médicaments et consignes',
  helperText = 'Dictez les médicaments. Dites « instructions » ou « consignes » avant de dicter les consignes.',
  containerClassName = 'sm:col-span-2',
}) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  function start() {
    setMessage('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('La dictée vocale n’est pas prise en charge par ce navigateur.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onstart = () => { setListening(true); setMessage('Écoute en cours…'); };
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ').trim();
      if (!transcript) return;
      const updatedFields = onTranscript(transcript);
      setMessage(Number.isInteger(updatedFields)
        ? updatedFields > 0
          ? `${updatedFields} champ${updatedFields > 1 ? 's' : ''} rempli${updatedFields > 1 ? 's' : ''}. Vérifiez-les avant d’enregistrer.`
          : 'Transcription reçue, mais aucun champ reconnu. Dites les libellés des champs avant leur valeur.'
        : `Transcription ajoutée : « ${transcript} » — relisez les champs avant d’enregistrer.`);
    };
    recognition.onerror = event => {
      setListening(false);
      const messages = {
        'not-allowed': 'Le navigateur ou son service vocal refuse la dictée. Vérifiez les réglages de reconnaissance vocale.',
        'service-not-allowed': 'Le service de reconnaissance vocale est indisponible.',
        network: 'Le service de reconnaissance vocale est inaccessible. Vérifiez la connexion Internet.',
        'audio-capture': 'Le navigateur ne parvient pas à capter le microphone.',
        'no-speech': 'Aucune parole détectée. Réessayez en parlant après le démarrage.',
      };
      setMessage(messages[event.error] || `La dictée a échoué (${event.error || 'erreur inconnue'}).`);
    };
    recognition.onend = () => setListening(false);
    try { recognition.start(); } catch (error) {
      setListening(false);
      setMessage(`Impossible de démarrer la dictée (${error.name || 'erreur inconnue'}).`);
    }
  }

  return <div className={containerClassName}>
    <button type="button" onClick={listening ? () => recognitionRef.current?.stop() : start} className="rounded-lg border border-[#5C3A21] px-3 py-2 text-xs font-medium text-[#5C3A21]">
      {listening ? 'Arrêter la dictée' : buttonLabel}
    </button>
    <p className="mt-1 text-[11px] text-[#171310]/50">{helperText}</p>
    {message && <p role="status" className="mt-1 text-xs text-[#171310]/70">{message}</p>}
  </div>;
}
