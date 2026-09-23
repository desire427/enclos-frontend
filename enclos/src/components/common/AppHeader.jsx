import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import AlertesPanel from '../../pages/app/Alertes/AlertesPanel';
import api from '../../API/api';

export default function AppHeader({ onMenuOpen }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [alertes, setAlertes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAlertes();
        setAlertes(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossible de charger les alertes.');
      }
    }
    load();
  }, []);

  useEffect(() => {
    const fermeId = localStorage.getItem('enclos_ferme_id');
    const token = localStorage.getItem('enclos_access_token');
    if (!fermeId || !token) return undefined;

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const apiUrl = new URL(apiBase);
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${apiUrl.origin}/ws/alertes/${fermeId}/?token=${encodeURIComponent(token)}`);
    socket.onmessage = event => {
      const alerte = JSON.parse(event.data);
      setAlertes(prev => [alerte, ...prev.filter(item => item.id !== alerte.id)]);
    };

    return () => socket.close();
  }, []);

  const nonLues = alertes.filter(a => a.statut === 'non_lue' || a.statut === 'Non lue').length;

  async function handleMarkOne(id) {
    try {
      const updated = await api.updateAlerte(id, { statut: 'lue' });
      setAlertes(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour l’alerte.');
    }
  }

  async function handleMarkAll() {
    const nonLuesIds = alertes
      .filter(a => a.statut === 'non_lue' || a.statut === 'Non lue')
      .map(a => a.id);
    try {
      const updated = await Promise.all(nonLuesIds.map(id => api.updateAlerte(id, { statut: 'lue' })));
      const byId = new Map(updated.map(a => [a.id, a]));
      setAlertes(prev => prev.map(a => byId.get(a.id) || a));
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour les alertes.');
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 h-[64px] bg-white/95 backdrop-blur border-b border-[#EEEEEE] flex items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Bouton hamburger — visible uniquement sur mobile */}
        <button
          type="button"
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 rounded-full border border-[#E5E5E3] flex items-center justify-center hover:bg-[#F5F4F2] transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-4 h-4 text-[#171310]/70 stroke-[1.7]" />
        </button>

        {/* Cloche alertes */}
        <button type="button" onClick={() => setPanelOpen(true)} className="relative w-9 h-9 rounded-full border border-[#E5E5E3] flex items-center justify-center hover:bg-[#F5F4F2] transition-colors ml-auto" aria-label="Voir les alertes">
          <Bell className="w-4 h-4 text-[#171310]/70 stroke-[1.7]" />
          {nonLues > 0 && (
            <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-[#5C3A21] text-white text-[10px] flex items-center justify-center font-semibold">
              {nonLues}
            </span>
          )}
        </button>
      </header>

      {error && <div className="hidden">{error}</div>}
      <AlertesPanel open={panelOpen} onClose={() => setPanelOpen(false)} alertes={alertes} onMarkOne={handleMarkOne} onMarkAll={handleMarkAll} />
    </>
  );
}
