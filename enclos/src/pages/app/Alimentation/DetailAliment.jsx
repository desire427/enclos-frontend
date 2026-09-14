import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import api from '../../../API/api';

function fmt(val, fallback = '—') {
  return (val !== null && val !== undefined && String(val).trim() !== '') ? val : fallback;
}

export default function DetailAliment() {
  const { id } = useParams();
  const [alim,    setAlim]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getAlimentation(id);
        setAlim(data);
      } catch (err) {
        setError(err.message || 'Impossible de charger cette alimentation.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const animalNom = alim?.animal?.nom?.trim()
    || alim?.animal_nom?.trim()
    || alim?.animal?.numero_identification
    || fmt(alim?.animal);

  const details = alim ? [
    ['Animal',          animalNom],
    ['Espèce',          fmt(alim.animal?.espece_display || alim.animal?.espece)],
    ["Type d'aliment",  fmt(alim.type_aliment_nom || alim.type_aliment)],
    ['Quantité',        alim.quantite_kg != null ? `${alim.quantite_kg} kg` : '—'],
    ['Fréquence',       fmt(alim.frequence_nom || alim.frequence)],
    ['Date',            fmt(alim.date_alimentation)],
  ] : [];

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/alimentation" className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors">
            <ArrowLeft className="w-4 h-4 stroke-[1.7]" />
            Retour
          </Link>
          <h1 className="mt-5 font-serif text-[28px] leading-tight text-[#171310]">Détails de l&apos;alimentation</h1>
          <p className="mt-1 text-[13px] text-[#171310]/50">Informations complètes de l&apos;alimentation</p>
        </div>
        {alim && (
          <Link
            to={`/alimentation/${id}/modifier`}
            className="mt-8 h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4 stroke-[1.8]" />
            Modifier
          </Link>
        )}
      </div>

      {error   && <div className="mt-4 text-red-600 text-[13px]">{error}</div>}
      {loading && <div className="mt-4 text-[13px] text-[#171310]/50">Chargement…</div>}

      {alim && (
        <div className="mt-6 w-full max-w-[560px] rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            {details.map(([label, val]) => (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium">{label}</div>
                <div className={`mt-2 text-[14px] font-semibold ${val === '—' ? 'text-[#171310]/40' : 'text-[#171310]'}`}>{val}</div>
              </div>
            ))}
          </div>

          {(alim.note) && (
            <>
              <div className="mt-6 border-t border-[#E5E5E3]" />
              <div className="mt-6">
                <div className="text-[11px] uppercase tracking-wide text-[#171310]/40 font-medium">Remarque</div>
                <div className="mt-3 w-full rounded-lg bg-[#F5F4F2] px-4 py-3 text-[13px] text-[#171310] leading-relaxed">
                  {alim.note}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
