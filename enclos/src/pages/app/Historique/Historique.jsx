import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Sparkles, History } from 'lucide-react';
import api from '../../../API/api';

const selectCls =
  'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';

const PAGE_SIZE = 10;

/**
 * Normalise un enregistrement d'historique retourné par l'API.
 * Le backend retourne : id, ferme, animal, animal_nom, type_evenement,
 *                       titre, description, date_evenement, source_ia
 */
function normalizeEvent(h) {
  return {
    id:        h.id,
    type:      h.type_evenement || h.type || 'normal',
    isIA:      h.source_ia === true,
    date:      h.date_evenement || h.date || h.created_at || '',
    title:     h.titre || h.title || h.type_evenement || 'Événement',
    desc:      h.description || h.details || h.note || '',
    animal:    h.animal_id || h.animal || '',
    animalNom: h.animal_nom || '',
    espece:    h.espece || '',
    statut:    h.statut || '',
  };
}

export default function Historique() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* Filtres */
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [filtreEspece, setFiltreEspece] = useState('Toutes');
  const [filtreRace,   setFiltreRace]   = useState('');
  const [filtreAnimal, setFiltreAnimal] = useState('');

  /* Pagination */
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const hist = await api.getHistorique();
        setEvents((Array.isArray(hist) ? hist : []).map(normalizeEvent));
      } catch (err) {
        setError(err.message || "Impossible de charger l'historique.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Filtrage ── */
  const filtered = events.filter(ev => {
    const matchStatut = filtreStatut === 'Tous' ||
                        ev.statut?.toLowerCase() === filtreStatut.toLowerCase();
    const matchEspece = filtreEspece === 'Toutes' ||
                        ev.espece?.toLowerCase() === filtreEspece.toLowerCase();
    const matchRace   = !filtreRace ||
                        ev.desc?.toLowerCase().includes(filtreRace.toLowerCase());
    const searchTerm  = filtreAnimal.trim().toLowerCase();
    const matchAnimal = !searchTerm ||
                        String(ev.animal).toLowerCase().includes(searchTerm) ||
                        ev.animalNom.toLowerCase().includes(searchTerm);
    return matchStatut && matchEspece && matchRace && matchAnimal;
  });

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  /* Libellé de l'animal sélectionné */
  const animalLabel = filtreAnimal.trim()
    ? `Événements — animal : ${filtreAnimal}`
    : 'Tous les événements';

  return (
    <>
      {/* Titre */}
      <div className="mb-6">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Historique</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">
          Filtrez et sélectionnez un animal pour afficher la chronologie des événements et les retours IA associés.
        </p>
      </div>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement de l&apos;historique...</div>}

      {/* Filtres */}
      <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Statut */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 mb-2">Statut</label>
            <div className="relative">
              <select
                className={selectCls}
                value={filtreStatut}
                onChange={e => { setFiltreStatut(e.target.value); resetPage(); }}
              >
                <option>Tous</option>
                <option>Actif</option>
                <option>Malade</option>
                <option>Gestation</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
            </div>
          </div>

          {/* Espèce */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 mb-2">Espèce</label>
            <div className="relative">
              <select
                className={selectCls}
                value={filtreEspece}
                onChange={e => { setFiltreEspece(e.target.value); resetPage(); }}
              >
                <option>Toutes</option>
                <option>Bovins</option>
                <option>Ovins</option>
                <option>Caprins</option>
                <option>Porcins</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
            </div>
          </div>

          {/* Race */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 mb-2">Race / mot-clé</label>
            <input
              type="text"
              placeholder="Ex: Ndama"
              value={filtreRace}
              onChange={e => { setFiltreRace(e.target.value); resetPage(); }}
              className="h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
            />
          </div>

          {/* Animal (recherche) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50 mb-2">Animal</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/40" />
              <input
                type="text"
                placeholder="Rechercher ID..."
                value={filtreAnimal}
                onChange={e => { setFiltreAnimal(e.target.value); resetPage(); }}
                className="h-11 w-full rounded-lg border border-[#E5E5E3] bg-white pl-9 pr-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
        <h2 className="font-serif text-[18px] font-medium text-[#171310] mb-6">
          {animalLabel}
        </h2>

        {!loading && filtered.length === 0 ? (
          /* État vide */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#171310]/30">
            <History className="w-10 h-10" />
            <p className="text-[14px] font-medium">
              {events.length === 0
                ? 'Aucun événement enregistré pour cette ferme.'
                : 'Aucun événement ne correspond aux filtres sélectionnés.'}
            </p>
            {events.length === 0 && (
              <p className="text-[12px] text-center max-w-xs">
                Les alimentations, pesées, traitements et suivis de gestation apparaîtront ici une fois enregistrés.
              </p>
            )}
          </div>
        ) : (
          <div className="relative pl-1">
            {/* Ligne verticale */}
            <div className="timeline-line"></div>

            {paginated.map((ev, i) => (
              <div key={ev.id || i} className={`relative pl-8 ${i < paginated.length - 1 ? 'pb-6' : ''}`}>
                <div className={`timeline-dot ${ev.isIA ? 'timeline-dot-info' : ''}`}></div>

                {ev.isIA ? (
                  <div className="rounded-xl border border-[#E5E5E3] bg-[#F5F4F2] p-4">
                    <div className="text-[11px] text-[#171310]/40">{ev.date}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5C3A21]" />
                      <span className="text-[14px] font-semibold text-[#5C3A21]">{ev.title}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#171310]/70">{ev.desc}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] text-[#171310]/40">{ev.date}</div>
                    <h3 className="text-[14px] font-semibold text-[#171310] mt-1">{ev.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#171310]/60">{ev.desc}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-[#E5E5E3] pt-5">
            <p className="text-[12px] text-[#171310]/50">
              {filtered.length} événement{filtered.length > 1 ? 's' : ''}
              {totalPages > 1 && ` · page ${safePage}/${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] text-[#171310] hover:bg-[#F5F4F2] transition-colors inline-flex items-center gap-1 disabled:text-[#171310]/30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Précédent
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors inline-flex items-center gap-1 disabled:text-[#171310]/30 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
