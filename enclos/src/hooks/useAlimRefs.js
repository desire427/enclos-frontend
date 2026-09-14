/**
 * Hook partagé — charge les types d'aliment et les fréquences depuis l'API.
 * Retourne { typeAliments, frequences, loading, reload }
 */
import { useCallback, useEffect, useState } from 'react';
import api from '../API/api';

export default function useAlimRefs() {
  const [typeAliments, setTypeAliments] = useState([]);
  const [frequences,   setFrequences]   = useState([]);
  const [loading,      setLoading]      = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [types, freqs] = await Promise.all([
        api.getTypeAliments(),
        api.getFrequences(),
      ]);
      setTypeAliments(Array.isArray(types) ? types : []);
      setFrequences(Array.isArray(freqs)   ? freqs  : []);
    } catch {
      // silencieux — les champs restent vides
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { typeAliments, frequences, loading, reload: load };
}
