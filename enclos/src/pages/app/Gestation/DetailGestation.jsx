import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Baby, Calendar, Clock, Pencil, Trash2,
} from 'lucide-react';
import api from '../../../API/api';

const STATUT_BADGE = {
  'En cours':  'bg-blue-50 text-blue-700',
  'Imminente': 'bg-amber-50 text-amber-700',
  'Terminée':  'bg-emerald-50 text-emerald-700',
};

function fmt(val, fallback = '—') {
  if (val === null || val === undefined || String(val).trim() === '') return fallback;
  return val;
}

function fmtDate(raw, fallback = '—') {
  if (!raw) return fallback;
  const d = new Date(raw);
  if (isNaN(d)) return fallback;
  return d.toLocaleDateString('fr-FR');
}

function calcJoursRestants(datePrevue, dateMiseBas) {
  if (dateMiseBas) return 0;
  if (!datePrevue) return null;
  const diff = Math.ceil((new Date(datePrevue) - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function calcAvancement(dateSaillie, datePrevue, dateMiseBas) {
  if (!dateSaillie || !datePrevue) return 0;
  const fin   = dateMiseBas ? new Date(dateMiseBas) : new Date();
  const debut = new Date(dateSaillie);
  const total = new Date(datePrevue) - debut;
  const eco   = fin - debut;
  if (total <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (eco / total) * 100)));
}

/* Normalise les champs de l'API — gère les différents nommages possibles */
function normalize(d) {
  return {
    id:               d.id,
    animalId:         d.animal_id || d.animal || '',
    animalNom:        d.animal_nom || d.nom_animal || '',
    espece:           d.espece_display || d.espece || '',
    race:             d.race_nom || d.race || '',
    pere:             d.pere || d.male_id || '',
    dateSaillie:      d.date_saillie || d.date_accouplement || '',
    datePrevue:       d.date_prevue  || d.date_mise_bas_prevue || '',
    dateMiseBas:      d.date_mise_bas_reelle || '',
    dureeGestation:   d.duree_gestation ?? '',
    statut:           d.statut || '',
    nombreNaissances: d.nombre_naissances ?? '',
    note:             d.note || d.notes || '',
  };
}

export default function DetailGestation() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [gestation,  setGestation]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getGestation(id);
        setGestation(normalize(data));
      } catch (err) {
        setError(err.message || 'Impossible de charger cette gestation.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    try {
      setDeleting(true);
      await api.deleteGestation(id);
      navigate('/gestation');
    } catch (err) {
      setError(err.message || 'Impossible de supprimer.');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const g           = gestation;
  const label       = g ? (g.animalNom?.trim() ? g.animalNom : g.animalId) : '…';
  const joursRestants = g ? calcJoursRestants(g.datePrevue, g.dateMiseBas) : null;
  const avancement    = g ? calcAvancement(g.dateSaillie, g.datePrevue, g.dateMiseBas) : 0;
  const urgent        = joursRestants !== null && joursRestants <= 30 && joursRestants > 0;

  const infos = g ? [
    ['Mâle reproducteur',    fmt(g.pere)],
    ['Date de saillie',      fmtDate(g.dateSaillie)],
    ['Date prévue',          fmtDate(g.datePrevue)],
    ['Date mise bas réelle', g.dateMiseBas ? fmtDate(g.dateMiseBas) : 'Non encore survenue'],
    ['Nombre de naissances', fmt(g.nombreNaissances)],
    ['Durée de gestation',   g.dureeGestation ? `${g.dureeGestation} jours` : '—'],
  ] : [];

  return (
    <>
      <Link to="/gestation" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
        Retour aux gestations
      </Link>

      {error   && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}
      {loading && <div className="mt-4 text-[13px] text-[#171310]/50">Chargement…</div>}

      {g && (
        <>
          {/* Titre + actions */}
          <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-[28px] leading-tight text-[#171310]">
                Gestation — {label}
                {g.animalNom?.trim() && (
                  <span className="ml-2 text-[18px] text-[#171310]/40 font-normal">({g.animalId})</span>
                )}
              </h1>
              {(g.espece || g.race) && (
                <p className="mt-1 text-[13px] text-[#171310]/50">
                  {[g.espece, g.race].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="h-9 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] text-[#171310]/60 px-3 text-[13px] inline-flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4 stroke-[1.7]" />
              </button>
              <Link
                to={`/gestation/${id}/modifier`}
                className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Pencil className="w-4 h-4 stroke-[1.8]" />
                Modifier
              </Link>
            </div>
          </div>

          {/* KPI */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Statut</div>
                <Baby className="w-4 h-4 text-[#171310]/30" />
              </div>
              {g.statut ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${STATUT_BADGE[g.statut] || 'bg-gray-50 text-gray-600'}`}>
                  {g.statut}
                </span>
              ) : <span className="text-[#171310]/40">—</span>}
            </div>

            <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Avancement</div>
                <Clock className="w-4 h-4 text-[#171310]/30" />
              </div>
              <div className="text-[24px] font-bold text-[#171310] leading-none">{avancement}%</div>
              <div className="mt-2 h-1.5 rounded-full bg-[#E5E5E3] overflow-hidden">
                <div
                  className={`h-full rounded-full ${urgent ? 'bg-amber-500' : g.dateMiseBas ? 'bg-emerald-500' : 'bg-[#5C3A21]'}`}
                  style={{ width: `${avancement}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Jours restants</div>
                <Calendar className={`w-4 h-4 ${urgent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
              </div>
              <div className={`text-[28px] font-bold leading-none ${urgent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>
                {g.dateMiseBas ? '—' : (joursRestants ?? '—')}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Date prévue</div>
                <Calendar className="w-4 h-4 text-[#171310]/30" />
              </div>
              <div className="text-[16px] font-bold text-[#171310]">
                {fmtDate(g.datePrevue)}
              </div>
            </div>
          </div>

          {/* Corps */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">

            {/* Carte infos */}
            <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
              <h2 className="font-serif text-[18px] font-medium text-[#171310] mb-5">Données de la gestation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                {infos.map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium">{lbl}</div>
                    <div className={`mt-1 text-[14px] font-medium ${val === '—' || val === 'Non encore survenue' ? 'text-[#171310]/40' : 'text-[#171310]'}`}>
                      {val}
                    </div>
                  </div>
                ))}

                {/* Note */}
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium mb-2">Notes</div>
                  <div className="rounded-lg bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310] leading-relaxed min-h-[48px]">
                    {g.note || <span className="text-[#171310]/40">Aucune note</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="flex flex-col gap-4">
              <Link
                to={`/cheptel/${g.animalId}`}
                className="h-9 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] text-[#171310] px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Baby className="w-4 h-4 stroke-[1.7]" />
                Voir la fiche animal
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Modal suppression */}
      {showDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => !deleting && setShowDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[400px] p-6">
              <h3 className="font-serif text-[18px] font-medium text-[#171310] mb-2">Supprimer ce suivi ?</h3>
              <p className="text-[13px] text-[#171310]/70 leading-relaxed mb-6">
                Cette action est irréversible. Le suivi de gestation de <strong>{label}</strong> sera définitivement supprimé.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowDelete(false)} disabled={deleting}
                  className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors disabled:opacity-60">
                  Annuler
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="h-9 rounded-lg bg-[#171310] hover:bg-black disabled:opacity-60 text-white px-4 text-[13px] font-medium transition-colors">
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
