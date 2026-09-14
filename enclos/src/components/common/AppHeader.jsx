import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import AlertesPanel from '../../pages/app/Alertes/AlertesPanel';
import api from '../../API/api';

export default function AppHeader() {
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

  const nonLues = alertes.filter(a => a.statut === 'non_lue' || a.statut === 'Non lue').length;

  function handleMarkOne(id) {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: 'lue' } : a));
  }

  function handleMarkAll() {
    setAlertes(prev => prev.map(a => ({ ...a, statut: 'lue' })));
  }

  return (
    <>
      <header className="sticky top-0 z-50 h-[64px] bg-white/95 backdrop-blur border-b border-[#EEEEEE] flex items-center justify-end px-6 lg:px-10">
        <button type="button" onClick={() => setPanelOpen(true)} className="relative w-9 h-9 rounded-full border border-[#E5E5E3] flex items-center justify-center hover:bg-[#F5F4F2] transition-colors" aria-label="Voir les alertes">
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
