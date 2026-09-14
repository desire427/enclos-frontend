/**
 * Hook partagé pour charger la liste des animaux depuis l'API.
 * Retourne { animals, loading, error }
 * animals : tableau d'objets { id, label, espece }
 */
import { useEffect, useState } from 'react';
import api from '../API/api';

export default function useAnimals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAnimals();
        setAnimals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossible de charger les animaux.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { animals, loading, error };
}
