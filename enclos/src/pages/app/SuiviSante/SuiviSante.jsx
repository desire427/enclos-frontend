import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PawPrint, ChevronDown, Plus, HeartPulse, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../API/api';

const PAGE_SIZE = 10;

function animalLabel(s) {
  return s.animal_nom || s.animal?.nom || s.animal?.numero_identification || String(s.id);
}

function listValue(obj, keys, fallback = '—') {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && String(obj[key]).trim() !== '') return obj[key];
  }
  return fallback;
}

export default function SuiviSante() {
  const [suivis, setSuivis]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [especeFilter, setEspeceFilter] = useState('Toutes');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSante();
        setSuivis(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossible de charger le suivi santé.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetPage() { setPage(1); }

  const statuts = useMemo(() => ['Tous', ...Array.from(new Set(
    suivis.map(s => listValue(s, ['statut', 'status'])).filter(v => v && v !== '—')
  ))], [suivis]);

  const especes = useMemo(() => ['Toutes', ...Array.from(new Set(
    suivis.map(s => listValue(s, ['espece', 'animal_espece'], '')).filter(Boolean)
  ))], [suivis]);

  const visible = suivis.filter(s => {
    const animalName = listValue(s, ['animal_nom'], '');
    const animalId   = listValue(s, ['animal_id', 'animalId'], '');
    const spanText   = `${animalName} ${animalId}`.toLowerCase();
    const matchSearch = spanText.includes(search.toLowerCase());

    const espece  = listValue(s, ['espece', 'animal_espece'], '');
    const statut  = listValue(s, ['statut', 'status'], '');
    // Comparaison insensible à la casse pour l'espèce
    const matchEspece = especeFilter === 'Toutes' || espece.toLowerCase() === especeFilter.toLowerCase();
    const matchStatut = statutFilter === 'Tous'   || statut === statutFilter;
    return matchSearch && matchEspece && matchStatut;
  });

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Suivi santé</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Gérez l&apos;état de santé de vos animaux</p>
        </div>
        <Link to="/sante/ajouter" className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors self-start">
          <Plus className="w-4 h-4 stroke-[1.8]" />
          Nouveau suivi
        </Link>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50">Chargement du suivi santé...</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Malades',       value: suivis.filter(s => listValue(s, ['statut', 'status'], '') === 'Malade').length,       accent: true  },
          { label: 'En traitement', value: suivis.filter(s => listValue(s, ['statut', 'status'], '') === 'En traitement').length, accent: false },
          { label: 'Guéris (mois)', value: suivis.filter(s => listValue(s, ['statut', 'status'], '') === 'Guéri').length,         accent: false },
          { label: 'Suivis actifs', value: suivis.length,                                                                         accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{label}</div>
              <HeartPulse className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
            </div>
            <div className={`mt-2 text-[28px] leading-none font-bold ${accent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Rechercher un animal..."
            className="h-9 w-full sm:w-[240px] rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>
        <div className="relative h-9">
          <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40 pointer-events-none" />
          <select
            value={especeFilter}
            onChange={e => { setEspeceFilter(e.target.value); resetPage(); }}
            className="h-9 rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-8 text-[13px] text-[#171310]/70 appearance-none"
          >
            {especes.map(item => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#171310]/40" />
        </div>
        <div className="relative h-9">
          <select
            value={statutFilter}
            onChange={e => { setStatutFilter(e.target.value); resetPage(); }}
            className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-3 pr-8 text-[13px] text-[#171310]/70 appearance-none"
          >
            {statuts.map(item => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#171310]/40" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5E3] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '780px' }}>
            <thead>
              <tr className="h-11 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                {['Animal','Espèce','Début du suivi','Prochaine consultation','Statut','Note','Actions'].map(h => (
                  <th key={h} className="px-3 first:px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#171310]/40">
                    {suivis.length === 0
                      ? 'Aucun suivi santé enregistré pour cette ferme.'
                      : 'Aucun résultat pour ces filtres.'}
                  </td>
                </tr>
              ) : paginated.map((s, i) => {
                const status = listValue(s, ['statut', 'status'], 'Non précisé');
                const badge = status === 'Malade'
                  ? 'bg-red-50 text-red-600'
                  : status === 'En traitement'
                    ? 'bg-orange-50 text-orange-600'
                    : status === 'Guéri'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600';
                return (
                  <tr key={s.id} className={`h-12 ${i < paginated.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                    <td className="px-4 text-[13px] font-medium text-[#171310] whitespace-nowrap">
                      {animalLabel(s)}
                      {s.animal_nom?.trim() && (
                        <span className="ml-1.5 text-[11px] text-[#171310]/40 font-normal">
                          ({listValue(s, ['animal_id', 'animalId'], s.id)})
                        </span>
                      )}
                    </td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{listValue(s, ['espece', 'animal_espece'], 'Non précisée')}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{listValue(s, ['date_debut', 'dateDebut'])}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{listValue(s, ['date_prochaine_consultation', 'dateProchaineConsultation'])}</td>
                    <td className="px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badge}`}>{status}</span>
                    </td>
                    <td className="px-3 text-[12px] text-[#171310]/60 max-w-[180px] truncate">{listValue(s, ['note', 'notes'])}</td>
                    <td className="px-3 text-[12px] whitespace-nowrap">
                      <Link to={`/sante/${s.id}`} className="text-[#5C3A21] hover:underline">Voir</Link>
                      <span className="mx-2 text-[#171310]/20">|</span>
                      <Link to={`/sante/${s.id}/modifier`} className="font-medium text-[#171310] hover:underline">Modifier</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="h-14 border-t border-[#E5E5E3] flex items-center justify-between px-4">
          <span className="text-[12px] text-[#171310]/50">
            {visible.length} suivi{visible.length > 1 ? 's' : ''}
            {suivis.length !== visible.length ? ` sur ${suivis.length}` : ''}
            {totalPages > 1 ? ` — page ${safePage}/${totalPages}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310]/70 hover:bg-[#F5F4F2] disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310]/70 hover:bg-[#F5F4F2] disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
