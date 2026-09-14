import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PawPrint, Activity, Plus } from 'lucide-react';
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

  /* Filtres */
  const [search, setSearch]           = useState('');
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

  /* ── Filtrage ── */
  const filtered = animals.filter(a => {
    const label = animalLabel(a).toLowerCase();
    const matchSearch = !search ||
      label.includes(search.toLowerCase()) ||
      (a.numero_identification || '').toLowerCase().includes(search.toLowerCase());

    const matchEspece = filtreEspece === 'Toutes' || a.espece === filtreEspece;
    const presenceValue = PRESENCE_LABEL[a.presence] || PRESENCE_LABEL.present;
    const santeValue = SANTE_LABEL[a.etat_sante] || SANTE_LABEL.sain;

    const matchPresence = filtrePresence === 'Tous' || presenceValue === filtrePresence;
    const matchSante = filtreSante === 'Tous' || santeValue === filtreSante;

    return matchSearch && matchEspece && matchPresence && matchSante;
  });

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Mon Cheptel</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Gérez la liste de vos animaux</p>
        </div>
        <Link
          to="/cheptel/ajouter"
          className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[1.8]" />
          Ajouter un animal
        </Link>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement du cheptel...</div>}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Recherche texte */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
          <input
            type="text"
            placeholder="Rechercher par ID ou nom..."
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
          icon={Activity}
          label="Présence"
          options={PRESENCES}
          value={filtrePresence}
          onChange={setFiltrePresence}
        />
        <FilterDropdown
          icon={Activity}
          label="Santé"
          options={SANTES}
          value={filtreSante}
          onChange={setFiltreSante}
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
                filtered.map((a, i) => (
                  <tr key={a.id} className={`h-12 ${i < filtered.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                    <td className="px-4 text-[13px] font-medium text-[#171310] whitespace-nowrap">
                      {animalLabel(a)}
                      {a.nom?.trim() && (
                        <span className="ml-1.5 text-[11px] text-[#171310]/40 font-normal">({a.numero_identification})</span>
                      )}
                    </td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.espece}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.sexe}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.date_naissance || '—'}</td>
                    <td className="px-3 text-[13px] text-[#171310]/70">{a.poids_naissance || '—'}</td>
                    <td className="px-3">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                        ${a.presence === 'vendu' ? 'bg-amber-50 text-amber-700' : a.presence === 'mort' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {a.presence_display || (a.presence === 'vendu' ? 'Vendu' : a.presence === 'mort' ? 'Mort' : 'Présent')}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                        ${a.etat_sante === 'malade' ? 'bg-red-50 text-red-600' : a.etat_sante === 'en_traitement' ? 'bg-orange-50 text-orange-600' : a.etat_sante === 'gestation' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {a.etat_sante_display || (a.etat_sante === 'malade' ? 'Malade' : a.etat_sante === 'en_traitement' ? 'En traitement' : a.etat_sante === 'gestation' ? 'Gestation' : 'Sain')}
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
            {animals.length !== filtered.length && ` sur ${animals.length}`}
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
