import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PawPrint, Calendar, Plus, Wheat } from 'lucide-react';
import api from '../../../API/api';
import FilterDropdown from '../../../components/common/FilterDropdown';

const ESPECES  = ['Toutes', 'Bovin', 'Ovin', 'Caprin', 'Porcin'];
const PERIODES = ['Toutes', "Aujourd'hui", 'Cette semaine', 'Ce mois', 'Cette année'];

/* ------------------------------------------------------------------ */
/* Helpers de filtrage par période                                      */
/* ------------------------------------------------------------------ */
function matchPeriode(dateStr, periode) {
  if (periode === 'Toutes' || !dateStr) return true;
  const date  = new Date(dateStr);
  const now   = new Date();
  if (isNaN(date)) return true;

  const sameDay   = d => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const sameWeek  = d => { const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return d >= start && d <= now; };
  const sameMonth = d => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const sameYear  = d => d.getFullYear() === now.getFullYear();

  switch (periode) {
    case 'Aujourd\'hui':  return sameDay(date);
    case 'Cette semaine': return sameWeek(date);
    case 'Ce mois':       return sameMonth(date);
    case 'Cette année':   return sameYear(date);
    default: return true;
  }
}

/* ------------------------------------------------------------------ */
/* Page principale                                                      */
/* ------------------------------------------------------------------ */
export default function Alimentation() {
  const [alimentations, setAlimentations] = useState([]);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  /* Filtres */
  const [search, setSearch]           = useState('');
  const [filtreEspece, setFiltreEspece]   = useState('Toutes');
  const [filtrePeriode, setFiltrePeriode] = useState('Toutes');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAlimentations();
        setAlimentations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossible de charger les alimentations.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Filtrage ── */
  const filtered = alimentations.filter(a => {
    const animalId = String(a.animal?.numero_identification || a.animal || '').toLowerCase();
    const type     = String(a.type_aliment || '').toLowerCase();
    const matchSearch  = !search || animalId.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
    const matchEspece  = filtreEspece === 'Toutes' || (a.animal?.espece || '').toLowerCase() === filtreEspece.toLowerCase();
    const matchPeriod  = matchPeriode(a.date_alimentation, filtrePeriode);
    return matchSearch && matchEspece && matchPeriod;
  });

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Alimentation</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Gérez l&apos;alimentation de vos animaux</p>
        </div>
        <Link
          to="/alimentation/ajouter"
          className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[1.8]" />
          Ajouter une alimentation
        </Link>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement des données...</div>}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
          <input
            type="text"
            placeholder="Rechercher une alimentation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-[260px] rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>
        <FilterDropdown
          icon={PawPrint}
          label="Espèce"
          options={ESPECES}
          value={filtreEspece}
          onChange={setFiltreEspece}
        />
        <FilterDropdown
          icon={Calendar}
          label="Période"
          options={PERIODES}
          value={filtrePeriode}
          onChange={setFiltrePeriode}
        />
      </div>

      {/* ── Tableau ── */}
      <div className="mt-6 rounded-2xl border border-[#E5E5E3] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '760px' }}>
            <thead>
              <tr className="h-11 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                {['Animal', 'Type d\'aliment', 'Quantité (kg)', 'Fréquence', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-3 first:px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#171310]/40">
                    <div className="flex flex-col items-center gap-2">
                      <Wheat className="w-8 h-8 opacity-30" />
                      {alimentations.length === 0
                        ? 'Aucune alimentation enregistrée pour cette ferme.'
                        : 'Aucun résultat pour ces filtres.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <tr key={a.id} className={`h-12 ${i < filtered.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                    <td className="px-4 text-[13px] font-medium text-[#171310]">
                      {a.animal?.numero_identification || a.animal || 'Animal'}
                    </td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.type_aliment}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.quantite_kg}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.frequence}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.date_alimentation}</td>
                    <td className="px-3 text-[12px] whitespace-nowrap">
                      <Link to={`/alimentation/${a.id}`} className="text-[#5C3A21] hover:underline">Voir</Link>
                      <span className="mx-2 text-[#171310]/20">|</span>
                      <Link to={`/alimentation/${a.id}/modifier`} className="font-medium text-[#171310] hover:underline">Modifier</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="h-14 border-t border-[#E5E5E3] flex items-center justify-between px-4">
          <span className="text-[12px] text-[#171310]/50">
            {filtered.length} alimentation{filtered.length > 1 ? 's' : ''}
            {alimentations.length !== filtered.length && ` sur ${alimentations.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button disabled className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] text-[#171310]/30 cursor-not-allowed">Précédent</button>
            <button disabled className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] text-[#171310]/30 cursor-not-allowed">Suivant</button>
          </div>
        </div>
      </div>
    </>
  );
}
