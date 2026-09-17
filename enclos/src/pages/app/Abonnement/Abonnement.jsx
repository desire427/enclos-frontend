import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard, Calendar, Clock, Download, AlertCircle,
  CheckCircle, ArrowUpRight, RefreshCw,
} from 'lucide-react';
import api from '../../../API/api';

export default function Abonnement() {
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [maybeActive, planList, subscriptionList] = await Promise.all([
          api.getActiveSubscription().catch(() => null),
          api.getPlans(),
          api.getSubscriptions().catch(() => []),
        ]);

        let active = maybeActive;
        if (!active) {
          active = Array.isArray(subscriptionList) ? subscriptionList.find(item => item.statut === 'active') || null : null;
        }

        setSubscription(active);
        setSubscriptions(Array.isArray(subscriptionList) ? subscriptionList : []);
        setPlans(Array.isArray(planList) ? planList : []);
      } catch (err) {
        setError(err.message || 'Erreur de chargement de l’abonnement.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const plan = subscription?.plan ? plans.find(p => p.id === subscription.plan) : null;
  const joursRestants = subscription?.date_fin ? Math.max(0, Math.ceil((new Date(subscription.date_fin) - new Date()) / 86400000)) : 0;
  const dureeJours = subscription?.date_debut && subscription?.date_fin
    ? Math.max(1, Math.ceil((new Date(subscription.date_fin) - new Date(subscription.date_debut)) / 86400000))
    : 30;
  const urgence = joursRestants <= 7;

  async function downloadReceipt(item) {
    try {
      setError('');
      const confirmed = await api.confirmPaydunya(item.paydunya_token);
      if (!confirmed.receipt_url) {
        throw new Error('Le reçu PayDunya n’est pas encore disponible.');
      }
      setSubscriptions(current => current.map(entry => entry.id === confirmed.id ? confirmed : entry));
      if (confirmed.statut === 'active') setSubscription(confirmed);
      window.open(confirmed.receipt_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Impossible de télécharger la facture.');
    }
  }

  if (loading) {
    return <div className="text-sm text-[#171310]/60">Chargement de l’abonnement…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-700">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-serif text-[28px] leading-tight text-[#171310]">Mon Abonnement</h1>
        <p className="mt-1 text-[13px] text-[#171310]/50">Gérez votre forfait et vos paiements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-serif text-[26px] font-semibold text-[#171310]">
                  {plan ? `Forfait ${plan.nom}` : 'Forfait'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  {subscription?.statut || 'Actif'}
                </span>
              </div>

              <p className="mt-1 text-[13px] text-[#171310]/50">{plan?.description || 'Abonnement actif'}</p>

              <div className="mt-4 flex items-end gap-1">
                <span className="font-serif text-[36px] font-bold text-[#171310] leading-none">
                  {subscription?.montant_paye ? Number(subscription.montant_paye).toLocaleString('fr-FR') : '0'}
                </span>
                <span className="text-[14px] text-[#171310]/50 mb-1">FCFA / mois</span>
              </div>
            </div>

            <div className={`rounded-xl px-5 py-4 text-center min-w-[130px] border
              ${urgence ? 'bg-amber-50 border-amber-200' : 'bg-[#F5F4F2] border-[#E5E5E3]'}`}>
              <Clock className={`w-5 h-5 mx-auto mb-1.5 ${urgence ? 'text-amber-600' : 'text-[#171310]/40'}`} />
              <div className={`text-[22px] font-bold leading-none ${urgence ? 'text-amber-700' : 'text-[#171310]'}`}>{joursRestants}</div>
              <div className={`text-[11px] mt-1 font-medium ${urgence ? 'text-amber-600' : 'text-[#171310]/50'}`}>jours restants</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-[11px] text-[#171310]/50 mb-1.5">
              <span>{subscription?.date_debut ? new Date(subscription.date_debut).toLocaleDateString('fr-FR') : '—'}</span>
              <span>{subscription?.date_fin ? new Date(subscription.date_fin).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E5E5E3] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${urgence ? 'bg-amber-500' : 'bg-[#5C3A21]'}`}
                style={{ width: `${Math.min(100, Math.max(0, ((dureeJours - joursRestants) / dureeJours) * 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/paiement', { state: { selectedPlan: subscription?.plan || plan?.id } })}
              className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 stroke-[1.8]" /> Renouveler
            </button>
            <button type="button" onClick={() => setShowCancel(true)} className="h-9 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F5F4F2] text-[#171310]/70 px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors">
              Annuler l'abonnement
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6 flex flex-col gap-4">
          {[
            { label: 'ID de l\'abonnement', value: subscription?.id || '—', icon: CreditCard },
            { label: 'Montant payé', value: subscription?.montant_paye ? `${Number(subscription.montant_paye).toLocaleString('fr-FR')} FCFA` : '0 FCFA', icon: null },
            { label: 'Date de début', value: subscription?.date_debut ? new Date(subscription.date_debut).toLocaleDateString('fr-FR') : '—', icon: Calendar },
            { label: 'Date de paiement', value: subscription?.date_paiement ? new Date(subscription.date_paiement).toLocaleDateString('fr-FR') : '—', icon: Calendar },
            { label: 'Prochaine échéance', value: subscription?.date_fin ? new Date(subscription.date_fin).toLocaleDateString('fr-FR') : '—', icon: Calendar },
            { label: 'Mode de paiement', value: subscription?.moyen_paiement || '—', icon: null },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-[#171310]/30" />}
                <span className="text-[12px] text-[#171310]/50">{label}</span>
              </div>
              <span className="text-[13px] font-medium text-[#171310]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 mt-5">
        <div className="rounded-2xl border border-[#E5E5E3] bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-full bg-[#F5F4F2] flex items-center justify-center mb-4">
              <ArrowUpRight className="w-4 h-4 text-[#5C3A21]" />
            </div>
            <h2 className="font-serif text-[17px] font-medium text-[#171310]">
              Faire évoluer votre exploitation ?
            </h2>
            <p className="mt-2 text-[13px] text-[#171310]/60 leading-relaxed">
              Passez au plan adapté à votre croissance.
            </p>
          </div>
          <Link to="/abonnement/changer" className="mt-5 h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors">
            Changer de forfait
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E5E5E3] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E5E3]">
            <h2 className="font-serif text-[17px] font-medium text-[#171310]">Historique des factures</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '480px' }}>
            <thead>
              <tr className="h-10 bg-[#F5F4F2] border-b border-[#E5E5E3]">
                {['Facture','Date','Montant','Statut','Action'].map(h => (
                  <th key={h} className="px-4 text-left text-[11px] font-semibold uppercase tracking-wide text-[#171310]/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.length ? subscriptions.map((item, i) => (
                <tr key={item.id} className={`h-12 ${i < subscriptions.length - 1 ? 'border-b border-[#E5E5E3]' : ''}`}>
                  <td className="px-4 text-[13px] font-medium text-[#171310]">SUB-{item.id}</td>
                  <td className="px-4 text-[13px] text-[#171310]/70">{item.date_paiement ? new Date(item.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 text-[13px] text-[#171310]/70">{Number(item.montant_paye || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">{item.statut}</span></td>
                  <td className="px-4"><button type="button" onClick={() => downloadReceipt(item)} disabled={!item.paydunya_token} className="inline-flex items-center gap-1.5 text-[12px] text-[#5C3A21] hover:underline font-medium disabled:opacity-40"><Download className="w-3.5 h-3.5" />Télécharger</button></td>
                </tr>
              )) : <tr><td colSpan="5" className="px-4 py-4 text-sm text-[#171310]/60">Aucune facture.</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {showCancel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowCancel(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[420px] p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-serif text-[20px] font-medium text-[#171310]">Annuler l’abonnement</span>
              </div>
              <p className="text-[13px] text-[#171310]/70 leading-relaxed mb-5">
                Voulez-vous vraiment annuler votre abonnement actuel ?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowCancel(false)} className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors">
                  Non
                </button>
                <button type="button" onClick={() => setShowCancel(false)} className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white px-4 text-[13px] font-semibold transition-colors">
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
