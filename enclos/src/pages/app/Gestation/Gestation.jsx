import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Baby, Calendar, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../API/api';
import FilterDropdown from '../../../components/common/FilterDropdown';

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */
const ESPECES   = ['Toutes', 'Bovin', 'Ovin', 'Caprin', 'Porcin'];
const STATUTS   = ['Tous', 'En cours', 'Imminente', 'Terminée'];
const PAGE_SIZE = 10;

const STATUT_BADGE = {
  'En cours':  'bg-blue-50 text-blue-700',
  'Imminente': 'bg-amber-50 text-amber-700',
  'Terminée':  'bg-emerald-50 text-emerald-700',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function normalize(g) {
  // Déduire le statut depuis les champs du backend si pas de statut textuel
  let statut = g.statut || '';
  if (statut === 'active') statut = 'En cours';
  else if (statut === 'terminee' || statut === 'terminée') statut = 'Terminée';

  const datePrevue = g.date_prevue || g.date_mise_bas_prevue || '';
  const joursRestants = Number(g.jours_restants ?? g.joursRestants ?? 0);
  if (!statut || statut === 'active') {
    if (joursRestants <= 30 && joursRestants > 0) statut = 'Imminente';
    else if (joursRestants <= 0 && datePrevue) statut = 'Terminée';
    else statut = 'En cours';
  }

  return {
    id:             g.id,
    animalId:       g.animal_id || g.animal || String(g.id),
    animalNom:      g.animal_nom || g.nom_animal || '',
    espece:         g.espece || g.species || '',
    dateSaillie:    g.date_debut || g.date_saillie || g.date_accouplement || '',
    datePrevue,
    joursRestants,
    dureeGestation: Number(g.duree_jours ?? g.duree_gestation ?? g.dureeGestation ?? 1),
    statut,
    pere:           g.pere || g.male_id || '—',
    note:           g.note || g.notes || '',
  };
}

function animalLabel(g) {
  return g.animalNom?.trim() ? g.animalNom : g.animalId;
}

function ProgressBar({ joursRestants, dureeGestation }) {
  const pct    = Math.round(Math.max(0, Math.min(100, ((dureeGestation - joursRestants) / dureeGestation) * 100)));
  const urgent = joursRestants <= 30 && joursRestants > 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-[#171310]/40 mb-1">
        <span>{pct}%</span>
        <span>{joursRestants > 0 ? `${joursRestants}j restants` : 'Terminée'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E5E5E3] overflow-hidden">
        <div
          className={`h-full rounded-full ${urgent ? 'bg-amber-500' : joursRestants === 0 ? 'bg-emerald-500' : 'bg-[#5C3A21]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page principale                                                      */
/* ------------------------------------------------------------------ */
export default function Gestation() {
  const [gestations, setGestations]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [filtreEspece, setFiltreEspece]     = useState('Toutes');
  const [filtreStatut, setFiltreStatut]     = useState('Tous');
  const [page, setPage]                     = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getGestations();
        setGestations((Array.isArray(data) ? data : []).map(normalize));
      } catch (err) {
        setError(err.message || 'Impossible de charger les gestations.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetPage() { setPage(1); }

  const actives    = gestations.filter(g => g.statut !== 'Terminée').length;
  const imminentes = gestations.filter(g => g.statut === 'Imminente').length;
  const terminees  = gestations.filter(g => g.statut === 'Terminée').length;

  const filtered = gestations.filter(g => {
    const matchSearch = animalLabel(g).toLowerCase().includes(search.toLowerCase()) ||
                        g.animalId.toLowerCase().includes(search.toLowerCase());
    // Comparaison insensible à la casse : DB stocke 'bovin', filtre affiche 'Bovin'
    const matchEspece = filtreEspece === 'Toutes' ||
      (g.espece || '').toLowerCase() === filtreEspece.toLowerCase();
    const matchStatut = filtreStatut === 'Tous' || g.statut === filtreStatut;
    return matchSearch && matchEspece && matchStatut;
  });

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {/* ── Titre ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Gestation</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Suivez les gestations de votre cheptel</p>
        </div>
        <Link
          to="/gestation/ajouter"
          className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[1.8]" />
          Nouvelle gestation
        </Link>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement des gestations...</div>}

      {/* ── KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gestations actives', value: actives,    icon: Baby,         accent: false },
          { label: 'Imminentes (≤ 30j)', value: imminentes, icon: AlertTriangle, accent: true  },
          { label: 'Terminées',          value: terminees,  icon: CheckCircle,  accent: false },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{label}</div>
              <Icon className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
            </div>
            <div className={`mt-2 text-[28px] leading-none font-bold ${accent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
          <input
            type="text"
            placeholder="Rechercher un animal..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            className="h-9 w-[240px] rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>
        <FilterDropdown
          label="Espèce"
          options={ESPECES}
          value={filtreEspece}
          onChange={v => { setFiltreEspece(v); resetPage(); }}
        />
        <FilterDropdown
          label="Statut"
          options={STATUTS}
          value={filtreStatut}
          onChange={v => { setFiltreStatut(v); resetPage(); }}
        />
      </div>

      {/* ── Tableau ── */}
      <div className="rounded-2xl border border-[#E5E5E3] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '860px' }}>
            <thead>
              <tr className="h-11 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                {['Animal','Espèce','Date saillie','Date prévue','Progression','Statut','Actions'].map(h => (
                  <th key={h} className="px-3 first:px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#171310]/40">
                    {gestations.length === 0
                      ? 'Aucune gestation enregistrée pour cette ferme.'
                      : 'Aucun résultat pour ces filtres.'}
                  </td>
                </tr>
              ) : paginated.map((g, i) => (
                <tr key={g.id} className={`h-14 ${i < paginated.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                  <td className="px-4 text-[13px] font-medium text-[#171310] whitespace-nowrap">
                    {animalLabel(g)}
                    {g.animalNom?.trim() && (
                      <span className="ml-1.5 text-[11px] text-[#171310]/40 font-normal">({g.animalId})</span>
                    )}
                  </td>
                  <td className="px-3 text-[13px] text-[#171310]/70">{g.espece}</td>
                  <td className="px-3 text-[13px] text-[#171310]/70">{g.dateSaillie}</td>
                  <td className="px-3 text-[13px] text-[#171310]/70 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#171310]/30" />
                      {g.datePrevue}
                    </div>
                  </td>
                  <td className="px-3 w-[160px]">
                    <ProgressBar joursRestants={g.joursRestants} dureeGestation={g.dureeGestation} />
                  </td>
                  <td className="px-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUT_BADGE[g.statut] || 'bg-gray-50 text-gray-600'}`}>
                      {g.statut}
                    </span>
                  </td>
                  <td className="px-3 text-[12px] whitespace-nowrap">
                    <Link to={`/gestation/${g.id}`} className="text-[#5C3A21] hover:underline">Voir</Link>
                    <span className="mx-2 text-[#171310]/20">|</span>
                    <Link to={`/gestation/${g.id}/modifier`} className="font-medium text-[#171310] hover:underline">Modifier</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-14 border-t border-[#E5E5E3] flex items-center justify-between px-4">
          <span className="text-[12px] text-[#171310]/50">
            {filtered.length} gestation{filtered.length > 1 ? 's' : ''}
            {gestations.length !== filtered.length ? ` sur ${gestations.length}` : ''}
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
