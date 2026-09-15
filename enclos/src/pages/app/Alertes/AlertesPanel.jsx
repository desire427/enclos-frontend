import { X, Sparkles, AlertTriangle, HeartPulse, Baby, Wheat, CheckCheck, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Mapping visuel basé sur le type_alerte retourné par l'API           */
/* ------------------------------------------------------------------ */
const TYPE_VISUAL = {
  'sante':        { icon: HeartPulse, dot: 'bg-red-600',     badge: 'bg-red-50 text-red-600'         },
  'santé':        { icon: HeartPulse, dot: 'bg-red-600',     badge: 'bg-red-50 text-red-600'         },
  'gestation':    { icon: Baby,       dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700'     },
  'alimentation': { icon: Wheat,      dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-600'       },
  'ia':           { icon: Sparkles,   dot: 'bg-[#5C3A21]',   badge: 'bg-[#F5F4F2] text-[#5C3A21]'   },
};

const DEFAULT_VISUAL = { icon: AlertTriangle, dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600' };

function getVisual(alerte) {
  const key = (alerte.type_alerte || alerte.typeAlerte || '').toLowerCase();
  return TYPE_VISUAL[key] || DEFAULT_VISUAL;
}

/** Normalise les champs de l'alerte quelle que soit la casse de l'API */
function normalize(a) {
  return {
    id:        a.id,
    typeAlerte: a.type_alerte || a.typeAlerte || 'Info',
    dateAlerte: a.date_creation || a.dateAlerte || a.created_at || '',
    message:   a.message || '',
    conseil:   a.conseil || a.recommendation || '',
    statut:    a.statut || 'lue',
    animalIdentification: a.animal_identification || a.animal?.numero_identification || '',
    animalNom: a.animal_nom || a.animal?.nom || '',
  };
}

/* ------------------------------------------------------------------ */
/* Composant panneau alertes                                            */
/* Les alertes sont passées en props depuis AppHeader via l'API réelle */
/* ------------------------------------------------------------------ */
export default function AlertesPanel({ open, onClose, alertes, onMarkOne, onMarkAll }) {
  const nonLues = alertes.filter(a => {
    const s = (a.statut || '').toLowerCase();
    return s === 'non lue' || s === 'non_lue';
  }).length;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Panneau */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[60] w-[400px] max-w-[95vw] bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-[17px] font-medium text-[#171310]">Alertes</h2>
            {nonLues > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5C3A21] text-white text-[10px] font-bold">
                {nonLues}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {nonLues > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-[12px] text-[#5C3A21] hover:underline font-medium inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout marquer comme lu
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-[#171310]/50" />
            </button>
          </div>
        </div>

        {/* ── Liste ── */}
        <div className="flex-1 overflow-y-auto">
          {alertes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#171310]/40">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-[13px]">Aucune alerte pour le moment</p>
            </div>
          ) : (
            <ul>
              {alertes.map(raw => {
                const a = normalize(raw);
                const { icon: Icon, dot, badge } = getVisual(raw);
                const nonLue = ['non lue', 'non_lue'].includes(a.statut.toLowerCase());
                return (
                  <li
                    key={a.id}
                    className={`group px-5 py-4 border-b border-[#E5E5E3] transition-colors
                      ${nonLue ? 'bg-white hover:bg-[#F5F4F2]' : 'bg-[#FAFAFA] hover:bg-[#F5F4F2]'}`}
                  >
                    <div className="flex items-start gap-3">

                      {/* Icône + pastille niveau */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-[#F5F4F2] flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#5C3A21]" />
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dot}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                            {a.typeAlerte}
                          </span>
                          <span className="text-[10px] text-[#171310]/40">{a.dateAlerte}</span>
                          {nonLue && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5C3A21] flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-[13px] font-medium text-[#171310] leading-snug">
                          {a.message}
                        </p>

                        {a.animalIdentification && (
                          <p className="mt-1 text-[11px] text-[#171310]/50">
                            Animal : <span className="font-semibold text-[#171310]/70">{a.animalIdentification}</span>
                            {a.animalNom ? ` — ${a.animalNom}` : ''}
                          </p>
                        )}

                        {a.conseil && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#5C3A21] flex-shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#171310]/60 leading-relaxed">
                              {a.conseil}
                            </p>
                          </div>
                        )}

                        {nonLue && (
                          <button
                            type="button"
                            onClick={() => onMarkOne(a.id)}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5C3A21] hover:underline transition-colors"
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-[#E5E5E3] flex items-center justify-between">
          <span className="text-[12px] text-[#171310]/50">
            {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            {nonLues > 0 && ` · ${nonLues} non lue${nonLues > 1 ? 's' : ''}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-[#171310]/60 hover:text-[#171310] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}
