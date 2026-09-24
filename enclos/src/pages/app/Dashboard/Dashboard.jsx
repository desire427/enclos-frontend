import { useEffect, useState } from 'react';
import { PawPrint, Thermometer, Baby, AlertTriangle, PieChart, BarChart2 } from 'lucide-react';
import api from '../../../API/api';

/* ------------------------------------------------------------------ */
/* Couleurs — 4 espèces uniquement, pas d'« Autre »                    */
/* ------------------------------------------------------------------ */
const ESPECE_COLORS = {
  bovin:  '#5C3A21',
  ovin:   '#8B5E3C',
  caprin: '#BF8B5E',
  porcin: '#D4A574',
};

function colorFor(key) {
  return ESPECE_COLORS[key] ?? '#C8A882';
}

/* ------------------------------------------------------------------ */
/* Distribution par espèce — seulement bovin/ovin/caprin/porcin        */
/* ------------------------------------------------------------------ */
const ESPECES_ORDER = ['bovin', 'ovin', 'caprin', 'porcin'];
const ESPECE_LABELS = { bovin: 'Bovin', ovin: 'Ovin', caprin: 'Caprin', porcin: 'Porcin' };

function speciesBreakdown(animals) {
  const counts = { bovin: 0, ovin: 0, caprin: 0, porcin: 0 };

  animals.forEach(a => {
    const key = (a.espece || '').toLowerCase();
    if (key in counts) counts[key]++;
  });

  const total = animals.length || 1;
  return ESPECES_ORDER
    .filter(key => counts[key] > 0)
    .map(key => ({
      key,
      label: ESPECE_LABELS[key],
      count: counts[key],
      pct:   (counts[key] / total) * 100,
    }));
}
const MOIS_FR = [
  'Jan','Fév','Mar','Avr','Mai','Jun',
  'Jul','Aoû','Sep','Oct','Nov','Déc',
];

function monthlyArrivals(animals) {
  const now          = new Date();
  const year         = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexé

  // 12 slots, un par mois
  const slots = MOIS_FR.map((label, month) => ({ label, month, count: 0 }));

  animals.forEach(a => {
    const raw = a.date_arrivee || a.date_creation;
    if (!raw) return;

    const arrived = new Date(raw);
    if (isNaN(arrived)) return;

    // On ne compte que les animaux arrivés cette année
    if (arrived.getFullYear() !== year) return;

    const month = arrived.getMonth();

    // Ignorer les mois futurs
    if (month > currentMonth) return;

    slots[month].count++;
  });

  return slots;
}
/* ------------------------------------------------------------------ */
/* Graphique DONUT (conic-gradient CSS + SVG pour trou central)        */
/* ------------------------------------------------------------------ */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  let cumul = 0;
  const gradientStops = data.map(d => {
    const from = cumul;
    cumul += d.pct;
    return `${colorFor(d.key)} ${from.toFixed(1)}% ${cumul.toFixed(1)}%`;
  });

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0 w-[160px] h-[160px]">
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}
        />
        {/* Trou central */}
        <div className="absolute inset-[35px] rounded-full bg-white flex flex-col items-center justify-center">
          <span className="font-bold text-[#171310] text-[20px] leading-none">{total}</span>
          <span className="text-[9px] uppercase tracking-wide text-[#171310]/50 mt-0.5">animaux</span>
        </div>
      </div>

      {/* Légende */}
      <ul className="space-y-2.5 flex-1">
        {data.map(d => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorFor(d.key) }}
            />
            <span className="text-[12px] text-[#171310]/70 flex-1">{d.label}</span>
            <span className="text-[12px] font-semibold text-[#171310]">{d.count}</span>
            <span className="text-[11px] text-[#171310]/40 w-[34px] text-right">
              {Math.round(d.pct)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graphique BARRES VERTICALES — 12 mois, SVG pur                      */
/* ------------------------------------------------------------------ */
function BarChart({ data }) {
  const currentMonth = new Date().getMonth(); // 0-indexé

  const W      = 340;
  const H      = 170;
  const PAD_L  = 30;
  const PAD_B  = 22;
  const PAD_T  = 12;
  const PAD_R  = 6;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_B - PAD_T;

  // Ne considère que les mois passés+actuel pour calculer le max
  const maxVal = Math.max(
    ...data.filter((_, i) => i <= currentMonth).map(d => d.count),
    1
  );
  const yMax   = Math.ceil(maxVal / 5) * 5 || 5;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

  const barW = Math.floor((chartW / data.length) * 0.55);
  const step = chartW / data.length;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      {/* ── Lignes horizontales + labels Y ── */}
      {yTicks.map(v => {
        const y = PAD_T + chartH - (v / yMax) * chartH;
        return (
          <g key={v}>
            <line
              x1={PAD_L} y1={y} x2={PAD_L + chartW} y2={y}
              stroke="#E5E5E3" strokeWidth="1"
            />
            <text
              x={PAD_L - 4} y={y + 3.5}
              textAnchor="end" fontSize="8.5" fill="#17131066"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* ── Axe X ── */}
      <line
        x1={PAD_L} y1={PAD_T + chartH}
        x2={PAD_L + chartW} y2={PAD_T + chartH}
        stroke="#17131033" strokeWidth="1"
      />

      {/* ── Barres + labels ── */}
      {data.map(({ label, count, month }, i) => {
        const isFuture = i > currentMonth;
        const barH     = isFuture || count === 0 ? 0 : Math.max(3, (count / yMax) * chartH);
        const x        = PAD_L + i * step + (step - barW) / 2;
        const y        = PAD_T + chartH - barH;
        const barColor = isFuture ? '#E5E5E3' : '#5C3A21';
        const labelOpacity = isFuture ? '0.3' : '0.7';

        return (
          <g key={label}>
            {/* Barre (vide pour les mois futurs) */}
            {!isFuture && barH > 0 && (
              <rect
                x={x} y={y}
                width={barW} height={barH}
                fill={barColor} rx="2" ry="2"
              />
            )}
            {/* Valeur au-dessus */}
            {!isFuture && count > 0 && (
              <text
                x={x + barW / 2} y={y - 3}
                textAnchor="middle" fontSize="8" fontWeight="600" fill="#5C3A21"
              >
                {count}
              </text>
            )}
            {/* Label mois */}
            <text
              x={x + barW / 2} y={PAD_T + chartH + 14}
              textAnchor="middle" fontSize="8.5"
              fill="#171310" opacity={labelOpacity}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page Dashboard                                                       */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const [stats, setStats] = useState({
    animals: [], alimentations: [], alertes: [], gestations: [],
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [animals, alimentations, alertes, gestations] = await Promise.all([
          api.getAnimals(),
          api.getAlimentations(),
          api.getAlertes(),
          api.getGestations(),
        ]);
        setStats({
          animals:       Array.isArray(animals)       ? animals       : [],
          alimentations: Array.isArray(alimentations) ? alimentations : [],
          alertes:       Array.isArray(alertes)       ? alertes       : [],
          gestations:    Array.isArray(gestations)    ? gestations    : [],
        });
      } catch (err) {
        setError(err.message || 'Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = [
    { label: 'Total animaux',       value: stats.animals.length,                                                              icon: PawPrint,      accent: false },
    { label: 'Alimentations',       value: stats.alimentations.length,                                                        icon: Thermometer,   accent: false },
    { label: 'Gestations en cours', value: stats.gestations.length,                                                           icon: Baby,          accent: false },
    { label: 'Alertes non lues',    value: stats.alertes.filter(a => a.statut === 'non_lue' || a.statut === 'Non lue').length, icon: AlertTriangle, accent: true  },
  ];

  const breakdown = speciesBreakdown(stats.animals);
  const evolution = monthlyArrivals(stats.animals);
  const isEmpty   = stats.animals.length === 0;
  const currentYear = new Date().getFullYear();

  return (
    <>
      <h1 className="font-serif text-[28px] leading-tight text-[#171310] mb-6">Tableau de bord</h1>

      {error   && <div className="text-red-600 text-[12px] mb-4">{error}</div>}
      {loading && <div className="text-[12px] text-[#171310]/50 mb-4">Chargement du tableau de bord...</div>}

      {/* ── KPI ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 /* shadow-[0_1px_2px_rgba(0,0,0,0.05)] */">
            <div className="flex items-center justify-between">
              <div className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">{label}</div>
              <Icon className={`w-4 h-4 ${accent ? 'text-[#5C3A21]' : 'text-[#171310]/30'}`} />
            </div>
            <div className={`mt-2 text-[28px] leading-none font-bold ${accent ? 'text-[#5C3A21]' : 'text-[#171310]'}`}>
              {value}
            </div>
          </div>
        ))}
      </section>

      {/* ── Graphiques ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">

        {/* Donut — Distribution par espèce */}
        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <h2 className="font-serif text-[16px] font-medium text-[#171310] mb-5">
            Distribution par espèce
          </h2>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-[160px] gap-3 text-[#171310]/25">
              <PieChart className="w-10 h-10" />
              <p className="text-[13px]">Aucun animal enregistré</p>
            </div>
          ) : (
            <DonutChart data={breakdown} />
          )}
        </div>

        {/* Barres — Arrivées par mois */}
        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <h2 className="font-serif text-[16px] font-medium text-[#171310] mb-1">
            Arrivées par mois
          </h2>
          <p className="text-[11px] text-[#171310]/40 mb-4">
            Nombre d&apos;animaux arrivés chaque mois — {currentYear}
          </p>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-[160px] gap-3 text-[#171310]/25">
              <BarChart2 className="w-10 h-10" />
              <p className="text-[13px]">Aucune donnée disponible</p>
            </div>
          ) : (
            <BarChart data={evolution} />
          )}
        </div>
      </section>

      {/* ── Activités & alertes ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">

        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Dernières activités</h2>
            <a href="/historique" className="text-[12px] text-[#5C3A21] hover:underline">Voir historique</a>
          </div>
          {stats.alimentations.length === 0 ? (
            <p className="text-[13px] text-[#171310]/40 py-6 text-center">Aucune alimentation enregistrée.</p>
          ) : (
            stats.alimentations.slice(0, 3).map((a, i, arr) => (
              <div
                key={a.id || i}
                className={`${i === 0 ? '' : 'pt-3'} ${i < arr.length - 1 ? 'pb-3 border-b border-[#E5E5E3]' : ''}`}
              >
                <div className="text-[11px] text-[#171310]/40">{a.date_alimentation}</div>
                <div className="text-[13px] font-semibold text-[#171310] mt-1">Alimentation enregistrée</div>
                <div className="text-[12px] text-[#171310]/60 mt-0.5">{a.type_aliment} · {a.quantite_kg} kg</div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[12px] uppercase tracking-wide text-[#171310]/50 font-medium">Alertes récentes</h2>
            <a href="/alertes" className="text-[12px] text-[#5C3A21] hover:underline">Voir les alertes</a>
          </div>
          {stats.alertes.length === 0 ? (
            <p className="text-[13px] text-[#171310]/40 py-6 text-center">Aucune alerte pour le moment.</p>
          ) : (
            stats.alertes.slice(0, 2).map((a, i) => (
              <div key={a.id || i} className={`${i > 0 ? 'mt-4' : ''} pb-4 border-b border-[#E5E5E3] last:border-0`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-600' : 'bg-amber-500'}`} />
                  <div className="text-[11px] text-[#171310]/40">
                    {a.date_creation || a.dateAlerte || 'Date inconnue'} — {a.statut}
                  </div>
                </div>
                <div className="text-[12px] text-[#171310]/70 mt-2 leading-relaxed">{a.message}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}