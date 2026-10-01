import { useRef, useState } from 'react';

export default function VoiceDictationButton({ onTranscript }) {
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
      onTranscript(transcript);
      setMessage(`Transcription ajoutée : « ${transcript} » — relisez les champs avant d’enregistrer.`);
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

  return <div className="sm:col-span-2">
    <button type="button" onClick={listening ? () => recognitionRef.current?.stop() : start} className="rounded-lg border border-[#5C3A21] px-3 py-2 text-xs font-medium text-[#5C3A21]">
      {listening ? 'Arrêter la dictée' : 'Dicter les médicaments et consignes'}
    </button>
    <p className="mt-1 text-[11px] text-[#171310]/50">Dictez les médicaments. Dites « instructions » ou « consignes » avant de dicter les consignes.</p>
    {message && <p role="status" className="mt-1 text-xs text-[#171310]/70">{message}</p>}
  </div>;
}
