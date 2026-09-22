import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../../../API/api';

export default function ChangerForfait() {
  const navigate = useNavigate();
  const [plans, setPlans]       = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [planList, activeSub] = await Promise.all([
          api.getPlans(),
          api.getActiveSubscription().catch(() => null),
        ]);
        const list = Array.isArray(planList) ? planList : [];
        setPlans(list);
        // Pré-sélectionner le plan actuel
        if (activeSub?.plan) {
          setCurrentPlanId(activeSub.plan);
          setSelected(activeSub.plan);
        } else if (list.length > 0) {
          setSelected(list[0].id);
        }
      } catch (err) {
        setError(err.message || 'Erreur chargement des forfaits');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const plan = plans.find(p => p.id === selected);

  function handleChoisir(planId) {
    setSelected(planId);
    setConfirm(true);
  }

  function handleConfirmerPayer() {
    setConfirm(false);
    // Redirige vers /paiement en passant l'ID du plan choisi en state
    navigate('/paiement', { state: { selectedPlan: selected } });
  }

  if (loading) {
    return <div className="text-sm text-[#171310]/60">Chargement des forfaits…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-700">{error}</div>;
  }

  return (
    <>
      <Link
        to="/abonnement"
        className="inline-flex items-center gap-2 text-[13px] text-[#171310]/70 hover:text-[#5C3A21] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 stroke-[1.7]" /> Retour à mon abonnement
      </Link>

      <div className="mt-5 mb-8">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Changer de forfait</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">
          Choisissez le plan qui correspond le mieux à la croissance de votre exploitation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {plans.map(p => {
          const isSelected  = String(selected) === String(p.id);
          const isCurrent   = String(currentPlanId) === String(p.id);
          const features = [
            `${p.nb_fermes_max ?? '∞'} ferme${p.nb_fermes_max === 1 ? '' : 's'}`,
            `${p.nb_animaux_max ?? '∞'} animal${p.nb_animaux_max === 1 ? '' : 's'}`,
            p.acces_ia      ? 'Accès IA'            : 'Accès IA limité',
            p.acces_support ? 'Support prioritaire' : 'Support limité',
            p.acces_analyses ? 'Analyses avancées'  : 'Analyses de base',
          ];

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-7 flex flex-col transition-all bg-white
                ${isSelected ? 'border-[#5C3A21]' : 'border-[#E5E5E3]'}
                ${p.id === 2 ? 'md:-translate-y-3 shadow-[0_20px_50px_-20px_rgba(23,19,16,0.25)]' : ''}`}
            >
              {p.id === 2 && (
                <span className="absolute -top-3.5 left-6 bg-[#5C3A21] text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                  Recommandé
                </span>
              )}

              <h2 className="font-serif text-[22px] font-semibold text-[#171310]">{p.nom}</h2>
              <p className="mt-1 text-[13px] text-[#171310]/50">{p.description}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="font-serif text-[38px] font-bold leading-none text-[#171310]">
                  {Number(p.prix).toLocaleString('fr-FR')}
                </span>
                <span className="text-[13px] mb-1 text-[#171310]/50">FCFA / mois</span>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <Check className="w-4 h-4 flex-shrink-0 stroke-[2] text-[#5C3A21]" />
                    <span className="text-[#171310]/75">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleChoisir(p.id)}
                disabled={isCurrent}
                className="mt-7 h-10 w-full rounded-lg text-[13px] font-semibold transition-colors bg-[#5C3A21] text-white hover:bg-[#3B2313] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCurrent ? 'Forfait actuel' : 'Choisir ce forfait'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmation */}
      {confirm && plan && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[420px] p-6">
              <h3 className="font-serif text-[20px] font-medium text-[#171310] mb-2">
                Passer au forfait {plan.nom}
              </h3>
              <p className="text-[13px] text-[#171310]/70 leading-relaxed mb-5">
                Vous êtes sur le point de changer votre forfait vers{' '}
                <strong>{plan.nom}</strong> à{' '}
                <strong>{Number(plan.prix).toLocaleString('fr-FR')} FCFA / mois</strong>.
              </p>

              <div className="rounded-xl bg-[#F5F4F2] p-4 mb-5 flex items-center justify-between">
                <span className="text-[13px] text-[#171310]/70">Nouveau forfait</span>
                <div className="text-right">
                  <div className="text-[14px] font-semibold text-[#171310]">{plan.nom}</div>
                  <div className="text-[12px] text-[#171310]/50">
                    {Number(plan.prix).toLocaleString('fr-FR')} FCFA / mois
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(false)}
                  className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmerPayer}
                  className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-semibold transition-colors"
                >
                  Confirmer et payer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
