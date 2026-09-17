import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PawPrint, Activity, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../API/api';
import FilterDropdown from '../../../components/common/FilterDropdown';

/* ------------------------------------------------------------------ */
/* Options de filtres                                                   */
/* ------------------------------------------------------------------ */
const ESPECES   = ['Toutes', 'Bovin', 'Ovin', 'Caprin', 'Porcin', 'Autre'];
const PRESENCES = ['Tous', 'Présent', 'Vendu', 'Mort'];
const SANTES    = ['Tous', 'Sain', 'Malade', 'Gestation', 'En traitement'];

const PRESENCE_LABEL = {
  present: 'Présent',
  vendu: 'Vendu',
  mort: 'Mort',
};

const SANTE_LABEL = {
  sain: 'Sain',
  malade: 'Malade',
  gestation: 'Gestation',
  en_traitement: 'En traitement',
};

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function animalLabel(a) {
  return a.nom?.trim() ? a.nom : a.numero_identification;
}

/* ------------------------------------------------------------------ */
/* Page principale                                                      */
/* ------------------------------------------------------------------ */
export default function MonCheptel() {
  const [animals, setAnimals]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);

  /* Filtres */
  const [search, setSearch]                 = useState('');
  const [filtreEspece, setFiltreEspece]     = useState('Toutes');
  const [filtrePresence, setFiltrePresence] = useState('Tous');
  const [filtreSante, setFiltreSante]       = useState('Tous');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAnimals();
        setAnimals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossible de charger le cheptel.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetPage() { setPage(1); }

  /* ── Filtrage ── */
  const filtered = animals.filter(a => {
    const label = animalLabel(a).toLowerCase();
    const matchSearch = !search ||
      label.includes(search.toLowerCase()) ||
      (a.numero_identification || '').toLowerCase().includes(search.toLowerCase());

    // La valeur en DB est en minuscule (bovin, ovin…), le filtre est en capitalisé
    const matchEspece = filtreEspece === 'Toutes' ||
      (a.espece || '').toLowerCase() === filtreEspece.toLowerCase();

    const presenceValue = PRESENCE_LABEL[a.presence] || PRESENCE_LABEL.present;
    const santeValue = SANTE_LABEL[a.etat_sante] || SANTE_LABEL.sain;

    const matchPresence = filtrePresence === 'Tous' || presenceValue === filtrePresence;
    const matchSante = filtreSante === 'Tous' || santeValue === filtreSante;

    return matchSearch && matchEspece && matchPresence && matchSante;
  });

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Mon Cheptel</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Gérez la liste de vos animaux</p>
        </div>
        <Link
          to="/cheptel/ajouter"
          className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors self-start"
        >
          <Plus className="w-4 h-4 stroke-[1.8]" />
          Ajouter un animal
        </Link>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement du cheptel...</div>}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
          <input
            type="text"
            placeholder="Rechercher par ID ou nom..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            className="h-9 w-full sm:w-[260px] rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
          />
        </div>

        <FilterDropdown
          icon={PawPrint}
          label="Espèce"
          options={ESPECES}
          value={filtreEspece}
          onChange={v => { setFiltreEspece(v); resetPage(); }}
        />
        <FilterDropdown
          icon={Activity}
          label="Présence"
          options={PRESENCES}
          value={filtrePresence}
          onChange={v => { setFiltrePresence(v); resetPage(); }}
        />
        <FilterDropdown
          icon={Activity}
          label="Santé"
          options={SANTES}
          value={filtreSante}
          onChange={v => { setFiltreSante(v); resetPage(); }}
        />
      </div>

      {/* ── Tableau ── */}
      <div className="mt-6 rounded-2xl border border-[#E5E5E3] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '860px' }}>
            <thead>
              <tr className="h-11 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                {['Animal','Espèce','Sexe','Âge','Dernier poids','Présence','État de santé','Actions'].map(h => (
                  <th key={h} className="px-3 first:px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#171310]/40">
                    {animals.length === 0
                      ? 'Aucun animal enregistré pour cette ferme.'
                      : 'Aucun animal ne correspond aux filtres sélectionnés.'}
                  </td>
                </tr>
              ) : (
                paginated.map((a, i) => (
                  <tr key={a.id} className={`h-12 ${i < paginated.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                    <td className="px-4 text-[13px] font-medium text-[#171310] whitespace-nowrap">
                      {animalLabel(a)}
                      {a.nom?.trim() && (
                        <span className="ml-1.5 text-[11px] text-[#171310]/40 font-normal">({a.numero_identification})</span>
                      )}
                    </td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.espece_display || a.espece}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.sexe_display || a.sexe}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.date_naissance || '—'}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.poids_naissance || '—'}</td>
                    <td className="px-3">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                        ${a.presence === 'vendu' ? 'bg-amber-50 text-amber-700' : a.presence === 'mort' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {a.presence_display || PRESENCE_LABEL[a.presence] || 'Présent'}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                        ${a.etat_sante === 'malade' ? 'bg-red-50 text-red-600' : a.etat_sante === 'en_traitement' ? 'bg-orange-50 text-orange-600' : a.etat_sante === 'gestation' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {a.etat_sante_display || SANTE_LABEL[a.etat_sante] || 'Sain'}
                      </span>
                    </td>
                    <td className="px-3 text-[12px] whitespace-nowrap">
                      <Link to={`/cheptel/${a.id}`} className="text-[#5C3A21] hover:underline">Voir</Link>
                      <span className="mx-2 text-[#171310]/20">|</span>
                      <Link to={`/cheptel/${a.id}/modifier`} className="font-medium text-[#171310] hover:underline">Modifier</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="h-14 border-t border-[#E5E5E3] flex items-center justify-between px-4">
          <span className="text-[12px] text-[#171310]/50">
            {filtered.length} animal{filtered.length > 1 ? 'x' : ''}
            {animals.length !== filtered.length ? ` sur ${animals.length}` : ''}
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
