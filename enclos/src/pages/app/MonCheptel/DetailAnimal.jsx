import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PawPrint, Scale, Calendar, AlertTriangle,
  Pencil, ChevronDown, Check, X, Sparkles, History,
  Bell,
} from 'lucide-react';
import api from '../../../API/api';

const selectCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 pr-10 text-[13px] text-[#171310] outline-none focus:border-[#5C3A21] transition-colors appearance-none';
const TABS = ['Général', 'Santé', 'Alimentation'];

function fmt(val, fallback = '—') {
  if (val === null || val === undefined || String(val).trim() === '') return fallback;
  return val;
}

function calcAge(dateNaissance) {
  if (!dateNaissance) return null;
  const d = new Date(dateNaissance);
  if (isNaN(d)) return null;
  const years  = Math.floor((new Date() - d) / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((new Date() - d) / (30.44 * 24 * 3600 * 1000)) % 12;
  if (years >= 1) return `${years} an${years > 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mois`;
  return '< 1 mois';
}

/* Normalise un événement d'historique */
function normalizeEvent(h) {
  return {
    id:    h.id,
    type:  h.type_evenement || h.type || 'normal',
    date:  h.date_evenement || h.date || h.created_at || '',
    title: h.titre || h.title || h.type_evenement || 'Événement',
    desc:  h.description || h.details || h.note || '',
  };
}

/* Panneau latéral générique */
function SidePanel({ open, onClose, title, children }) {
  return (
    <div className={`fixed top-0 right-0 bottom-0 z-40 w-[380px] max-w-[92vw] bg-white shadow-2xl flex flex-col transition-transform duration-300
      ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
        <h2 className="font-serif text-[17px] font-medium text-[#171310]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors" aria-label="Fermer">
          <X className="w-4 h-4 text-[#171310]/60" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  );
}

export default function DetailAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* Données principales */
  const [animal,       setAnimal]       = useState(null);
  const [alimentations,setAlimentations]= useState([]);
  const [historique,   setHistorique]   = useState([]);
  const [alertes,      setAlertes]      = useState([]);

  /* UI */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [activeTab,setActiveTab]= useState('Général');
  const [showHistorique,setShowHistorique]= useState(false);
  const [showAlertes,   setShowAlertes]   = useState(false);

  /* Onglet Santé — champs éditables */
  const [presence,   setPresence]   = useState('present');
  const [etatSante,  setEtatSante]  = useState('sain');
  const [noteSante,  setNoteSante]  = useState('');
  const [savingSante, setSavingSante] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [animalData, alimentsData, histData, alertesData] = await Promise.all([
          api.getAnimal(id),
          api.getAlimentations().catch(() => []),
          api.getHistorique().catch(() => []),
          api.getAlertes().catch(() => []),
        ]);
        setAnimal(animalData);
        setPresence(animalData.presence || 'present');
        setEtatSante(animalData.etat_sante || 'sain');
        setNoteSante(animalData.observations || '');

        // Filtre côté frontend par animal ID
        const animalIdNum = Number(id);
        setAlimentations(
          (Array.isArray(alimentsData) ? alimentsData : [])
            .filter(a => {
              const animalRef = a.animal?.id ?? a.animal;
              return Number(animalRef) === animalIdNum;
            })
            .slice(0, 5)
        );
        setHistorique(
          (Array.isArray(histData) ? histData : [])
            .filter(h => {
              const animalRef = h.animal?.id ?? h.animal ?? h.animal_id;
              return Number(animalRef) === animalIdNum;
            })
            .map(normalizeEvent)
        );
        setAlertes(
          (Array.isArray(alertesData) ? alertesData : [])
            .filter(a => {
              const animalRef = a.animal?.id ?? a.animal ?? a.animal_id;
              return Number(animalRef) === animalIdNum;
            })
        );
      } catch (err) {
        setError(err.message || 'Impossible de charger cet animal.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSaveSante() {
    if (!animal) return;
    try {
      setSavingSante(true);
      await api.updateAnimal(id, { presence, etat_sante: etatSante, observations: noteSante });
      setAnimal(prev => ({ ...prev, presence, etat_sante: etatSante, observations: noteSante }));
      // Si l'état de santé devient "gestation", ouvrir le formulaire de gestation
      // Si l'état de santé devient "malade" ou "en_traitement", ouvrir le formulaire de suivi
      if (etatSante === 'gestation') {
        navigate(`/gestation/ajouter?animal=${id}`);
      } else if (etatSante === 'malade' || etatSante === 'en_traitement') {
        navigate(`/sante/ajouter?animal=${id}&statut=${etatSante === 'malade' ? 'Malade' : 'En traitement'}`);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSavingSante(false);
    }
  }

  async function handleMarkAlerteLue(alerteId) {
    try {
      const updated = await api.updateAlerte(alerteId, { statut: 'lue' });
      setAlertes(prev => prev.map(a => a.id === alerteId ? updated : a));
    } catch (err) {
      setError(err.message || 'Impossible de marquer l’alerte comme lue.');
    }
  }

  const a     = animal;
  const label = a ? (a.nom?.trim() ? a.nom : a.numero_identification) : '…';
  const age   = a ? calcAge(a.date_naissance) : null;
  const nonLuesAlertes = alertes.filter(al => ['non_lue','Non lue'].includes(al.statut || '')).length;

  const NIVEAU_COLOR = { Critique: 'bg-red-600', Avertissement: 'bg-amber-500', Info: 'bg-blue-500' };

  return (
    <div className="relative">

      {/* ── Panneau Historique ── */}
      <SidePanel open={showHistorique} onClose={() => setShowHistorique(false)} title={`Historique — ${label}`}>
        {historique.length === 0 ? (
          <p className="text-[13px] text-[#171310]/40">Aucun événement enregistré.</p>
        ) : (
          <div className="relative pl-1">
            <div className="timeline-line" />
            {historique.map((ev, i) => {
              const isIA = ev.type === 'ia' || ev.type === 'IA';
              return (
                <div key={ev.id || i} className={`relative pl-8 ${i < historique.length - 1 ? 'pb-5' : ''}`}>
                  <div className={`timeline-dot ${isIA ? 'timeline-dot-info' : ''}`} />
                  {isIA ? (
                    <div className="rounded-xl border border-[#E5E5E3] bg-[#F5F4F2] p-3">
                      <div className="text-[10px] text-[#171310]/40">{ev.date}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#5C3A21]" />
                        <span className="text-[13px] font-semibold text-[#5C3A21]">{ev.title}</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#171310]/70">{ev.desc}</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] text-[#171310]/40">{ev.date}</div>
                      <div className="text-[13px] font-semibold text-[#171310] mt-0.5">{ev.title}</div>
                      <p className="text-[12px] text-[#171310]/60 mt-0.5">{ev.desc}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SidePanel>

      {/* ── Panneau Alertes ── */}
      <SidePanel open={showAlertes} onClose={() => setShowAlertes(false)} title={`Alertes — ${label}`}>
        {alertes.length === 0 ? (
          <p className="text-[13px] text-[#171310]/40">Aucune alerte pour cet animal.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {alertes.map((al, i) => {
              const niveau = al.niveau || al.type_alerte || '';
              const dot    = NIVEAU_COLOR[niveau] || 'bg-gray-400';
              return (
                <div key={al.id || i} className="rounded-xl border border-[#E5E5E3] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-[11px] text-[#171310]/50">
                      {al.date_creation || al.dateAlerte || ''} — {niveau}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#171310]/70">{al.message}</p>
                  {['non_lue', 'Non lue'].includes(al.statut) && (
                    <button onClick={() => handleMarkAlerteLue(al.id)} className="mt-3 text-[11px] font-medium text-[#5C3A21] hover:underline">
                      Marquer comme lu
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SidePanel>

      {/* Overlay */}
      {(showHistorique || showAlertes) && (
        <div className="fixed inset-0 z-30 bg-black/20"
          onClick={() => { setShowHistorique(false); setShowAlertes(false); }} />
      )}

      {/* ── Contenu principal ── */}
      <Link to="/cheptel" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour
      </Link>

      {error   && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}
      {loading && <div className="mt-4 text-[13px] text-[#171310]/50">Chargement…</div>}

      {a && (
        <>
          <div className="mt-5">
            <h1 className="font-serif text-[28px] leading-tight text-[#171310]">
              Détails de l&apos;animal — {label}
              {a.nom?.trim() && (
                <span className="ml-2 text-[18px] text-[#171310]/40 font-normal">({a.numero_identification})</span>
              )}
            </h1>
            <p className="mt-1 text-[13px] text-[#171310]/50">Informations complètes de l&apos;animal</p>
          </div>

          {/* KPI */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Espèce',       value: fmt(a.espece_display || a.espece), icon: PawPrint,      accent: false },
              { label: 'Poids (kg)',   value: fmt(a.poids_naissance != null ? `${a.poids_naissance} kg` : null), icon: Scale, accent: false },
              { label: 'Âge',          value: fmt(age), icon: Calendar,      accent: false },
              { label: 'Alertes',      value: String(nonLuesAlertes), icon: AlertTriangle, accent: nonLuesAlertes > 0 },
            ].map(({ label: lbl, value, icon: Icon, accent }) => (
              <div key={lbl} className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{lbl}</div>
                  <Icon className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
                </div>
                <div className={`mt-2 text-[22px] leading-none font-bold ${value === '—' ? 'text-[#171310]/30' : accent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Corps */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">

            {/* Carte principale onglets */}
            <div className="rounded-2xl border border-[#E5E5E3] bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-5 border-b border-[#E5E5E3]">
                <h2 className="font-serif text-[18px] font-medium text-[#171310]">Informations générales</h2>
                <div className="flex items-center gap-6">
                  {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`relative pb-2 text-[12px] transition-colors
                        ${activeTab === tab
                          ? 'text-[#5C3A21] font-semibold after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-[#5C3A21] after:rounded-sm'
                          : 'text-[#171310]/50 hover:text-[#171310]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── ONGLET GÉNÉRAL ── */}
              {activeTab === 'Général' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 px-6 py-6">
                  {[
                    ['Identifiant',       fmt(a.numero_identification)],
                    ['Nom',               fmt(a.nom)],
                    ['Sexe',              fmt(a.sexe_display || a.sexe)],
                    ['Date de naissance', fmt(a.date_naissance)],
                    ['Couleur',           fmt(a.couleur)],
                    ['Race',              fmt(a.race_nom || (typeof a.race === 'object' ? a.race?.nom : null))],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium">{lbl}</div>
                      <div className={`mt-1 text-[14px] font-medium ${val === '—' ? 'text-[#171310]/40' : 'text-[#171310]'}`}>{val}</div>
                    </div>
                  ))}
                  {a.observations && (
                    <div className="sm:col-span-2">
                      <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Observations</div>
                      <div className="rounded-lg bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310] leading-relaxed">{a.observations}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ONGLET SANTÉ ── */}
              {activeTab === 'Santé' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 px-6 pt-6 pb-6">

                  {/* Présence */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Présence</div>
                    <div className="relative">
                      <select value={presence} onChange={e => setPresence(e.target.value)} className={selectCls}>
                        <option value="present">Présent</option>
                        <option value="vendu">Vendu</option>
                        <option value="mort">Mort</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
                    </div>
                  </div>

                  {/* État de santé */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">État de santé</div>
                    <div className="relative">
                      <select value={etatSante} onChange={e => setEtatSante(e.target.value)} className={selectCls}>
                        <option value="sain">Sain</option>
                        <option value="malade">Malade</option>
                        <option value="gestation">Gestation</option>
                        <option value="en_traitement">En traitement</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#171310]/50" />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Notes de santé</div>
                    <textarea rows={4} value={noteSante} onChange={e => setNoteSante(e.target.value)}
                      placeholder="Observations, traitements en cours…"
                      className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button type="button" onClick={handleSaveSante} disabled={savingSante}
                      className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
                      <Check className="w-4 h-4 stroke-[2]" />
                      {savingSante ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── ONGLET ALIMENTATION ── */}
              {activeTab === 'Alimentation' && (
                <div className="px-6 pt-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] text-[#171310]/60">Dernières rations enregistrées</span>
                    <Link to="/alimentation/ajouter"
                      className="h-8 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-3 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors">
                      + Ajouter
                    </Link>
                  </div>

                  {alimentations.length === 0 ? (
                    <p className="text-[13px] text-[#171310]/40 py-4 text-center">Aucune alimentation enregistrée pour cet animal.</p>
                  ) : (
                    <div className="rounded-xl border border-[#E5E5E3] overflow-hidden">
                      <table className="w-full border-collapse text-[12px]">
                        <thead>
                          <tr className="h-9 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                            {["Date", "Type d'aliment", "Quantité", "Fréquence"].map(h => (
                              <th key={h} className="px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {alimentations.map((al, i) => (
                            <tr key={al.id || i} className={`h-10 ${i < alimentations.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                              <td className="px-3 text-[#171310]/70">{fmt(al.date_alimentation)}</td>
                              <td className="px-3 font-medium text-[#171310]">{fmt(al.type_aliment_nom || al.type_aliment)}</td>
                              <td className="px-3 text-[#171310]/70">{al.quantite_kg != null ? `${al.quantite_kg} kg` : '—'}</td>
                              <td className="px-3 text-[#171310]/70">{fmt(al.frequence_nom || al.frequence)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Colonne droite ── */}
            <div className="flex flex-col gap-5">

              {/* Dernières activités */}
              <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Dernières activités</h3>
                  <button onClick={() => setShowHistorique(true)} className="text-[12px] text-[#5C3A21] hover:underline">
                    Voir l&apos;historique
                  </button>
                </div>
                {historique.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-[#171310]/30">
                    <History className="w-6 h-6" />
                    <p className="text-[12px]">Aucun événement</p>
                  </div>
                ) : (
                  historique.slice(0, 2).map((ev, i) => (
                    <div key={ev.id || i} className={`${i > 0 ? 'pt-3' : ''} ${i < Math.min(historique.length, 2) - 1 ? 'pb-3 border-b border-[#E5E5E3]' : ''}`}>
                      <div className="text-[11px] text-[#171310]/40">{ev.date}</div>
                      <div className="text-[13px] font-semibold text-[#171310] mt-1">{ev.title}</div>
                      {ev.desc && <div className="text-[12px] text-[#171310]/60 mt-0.5">{ev.desc}</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Alertes récentes */}
              <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Alertes récentes</h3>
                  <button onClick={() => setShowAlertes(true)} className="text-[12px] text-[#5C3A21] hover:underline">
                    Voir les alertes
                  </button>
                </div>
                {alertes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-[#171310]/30">
                    <Bell className="w-6 h-6" />
                    <p className="text-[12px]">Aucune alerte</p>
                  </div>
                ) : (
                  alertes.slice(0, 1).map((al, i) => {
                    const niveau = al.niveau || al.type_alerte || '';
                    const dot = NIVEAU_COLOR[niveau] || 'bg-gray-400';
                    return (
                      <div key={al.id || i}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <div className="text-[11px] text-[#171310]/40">
                            {al.date_creation || al.dateAlerte || ''} — {niveau}
                          </div>
                        </div>
                        <div className="text-[12px] text-[#171310]/70 mt-2 leading-relaxed">{al.message}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bouton modifier */}
              <Link to={`/cheptel/${id}/modifier`}
                className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors">
                <Pencil className="w-4 h-4 stroke-[1.8]" />
                Modifier cet animal
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
