import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, CreditCard, LockKeyhole } from 'lucide-react';
import PublicHeader from '../../../components/common/PublicHeader';
import PublicFooter from '../../../components/common/PublicFooter';
import api from '../../../API/api';
import { clean, validatePayment } from '../../../utils/validation';

export default function Paiement() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlanId = location.state?.selectedPlan || null;
  const paymentToken = new URLSearchParams(location.search).get('token');
  const registration = location.state?.registration || (() => {
    try {
      return JSON.parse(sessionStorage.getItem('enclos_pending_registration') || 'null');
    } catch {
      return null;
    }
  })();

  const [paymentType, setPaymentType] = useState('mobile');
  const [operator, setOperator] = useState('wave');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!paymentToken) return;

    async function confirmPayment() {
      try {
        setLoading(true);
        const subscription = await api.confirmPaydunya(paymentToken);
        if (subscription?.statut !== 'active') {
          throw new Error('Le paiement n’a pas encore été confirmé par PayDunya.');
        }
        if (subscription?.auth?.access) {
          api.setToken(subscription.auth.access);
          if (subscription.auth.refresh) {
            localStorage.setItem('enclos_refresh_token', subscription.auth.refresh);
          }
        }
        sessionStorage.removeItem('enclos_pending_registration');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.message || 'Impossible de confirmer le paiement.');
      } finally {
        setLoading(false);
      }
    }

    confirmPayment();
  }, [paymentToken, navigate]);

  useEffect(() => {
    async function loadPlan() {
      try {
        if (!selectedPlanId) {
          const plans = await api.getPlans();
          if (plans?.length) setPlan(plans[0]);
          return;
        }

        const chosen = await api.getPlan(selectedPlanId);
        setPlan(chosen);
      } catch (err) {
        setError(err.message || 'Impossible de charger le forfait.');
      }
    }
    loadPlan();
  }, [selectedPlanId]);

  async function handlePay() {
    setError('');
    const validation = validatePayment({ paymentType, phone, cardNumber, expiry, cvv, planId: plan?.id });
    setValidationErrors(validation.errors);
    if (validation.message) {
      setError(validation.message);
      return;
    }
    setLoading(true);

    try {
      if (!plan?.id) {
        throw new Error('Aucun forfait valide sélectionné.');
      }

      const payload = {
        plan: plan.id,
        montant_paye: Number(plan.prix),
        phone: clean(phone),
        operator,
        customer_name: 'Client test Enclos',
        registration,
      };

      const checkout = await api.createPaydunyaCheckout(payload);
      if (checkout?.checkout_url) {
        window.location.assign(checkout.checkout_url);
        return;
      }

      throw new Error('PayDunya n’a pas renvoyé d’URL de paiement.');
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement.');
    } finally {
      setLoading(false);
    }
  }

  if (paymentToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F4F2] px-4">
        <div className="text-center">
          {error
            ? <p className="text-sm text-red-700">{error}</p>
            : <p className="text-sm text-[#171310]/60">Confirmation du paiement...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader mode="steps" currentStep={2} />

      <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-[28px] sm:text-[32px] leading-tight text-[#171310] mb-2">Paiement</h1>
          <p className="text-[#171310]/60 text-[15px] mb-8">
            Finalisez votre inscription en réglant votre premier mois d'abonnement.
          </p>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
            <section className="border border-[#E5E5E3] rounded-2xl p-6 sm:p-8 bg-white">
              <div className="h-[48px] bg-[#F5F4F2] rounded-lg flex p-1 mb-6">
                <TabBtn active={paymentType === 'mobile'} onClick={() => setPaymentType('mobile')} icon={<Smartphone className="w-4 h-4 stroke-[1.8]" />} label="Mobile Money" />
                <TabBtn active={paymentType === 'card'} onClick={() => setPaymentType('card')} icon={<CreditCard className="w-4 h-4 stroke-[1.8]" />} label="Carte bancaire" />
              </div>

              {paymentType === 'mobile' && (
                <div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-5">
                    <OperatorCard value="wave" current={operator} onSelect={setOperator} logo={<span className="w-9 h-9 rounded-full bg-[#34261C] text-white flex items-center justify-center text-[14px] font-bold">≋</span>} label="Wave" />
                    <OperatorCard value="orange" current={operator} onSelect={setOperator} logo={<span className="w-9 h-9 rounded-full bg-[#222] text-white flex items-center justify-center text-[13px] font-bold">OM</span>} label="Orange Money" />
                  </div>
                  {validationErrors.phone && <p className="mt-1 text-[11px] text-red-700">{validationErrors.phone}</p>}

                  <div className="mb-6">
                    <label className="block text-[13px] font-semibold text-[#171310] mb-2">Numéro de téléphone</label>
                    <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center overflow-hidden bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                      <div className="px-3 h-full flex items-center bg-[#F5F4F2] border-r border-[#DCDCD9] text-[13px] font-medium">+221</div>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="77 452 89 10" className="w-full px-3 text-[14px] text-[#171310] bg-transparent outline-none" />
                    </div>
                  </div>

                  {error && <div className="mb-4 text-sm text-red-700">{error}</div>}

                  <button type="button" onClick={handlePay} disabled={loading || !plan} className="w-full h-[48px] rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors">
                    <LockKeyhole className="w-4 h-4 stroke-[2]" />
                    {loading ? 'Paiement...' : `Payer ${plan ? Number(plan.prix).toLocaleString('fr-FR') : '0'} FCFA`}
                  </button>
                </div>
              )}

              {paymentType === 'card' && (
                <div>
                  <div className="mb-5">
                    <label className="block text-[13px] font-semibold text-[#171310] mb-2">Numéro de carte</label>
                    <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 gap-[10px] bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                      <CreditCard className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />
                      <input type="text" inputMode="numeric" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="w-full text-[14px] text-[#171310] bg-transparent outline-none" />
                    </div>
                    {validationErrors.cardNumber && <p className="mt-1 text-[11px] text-red-700">{validationErrors.cardNumber}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#171310] mb-2">Date d'expiration</label>
                      <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 bg-white focus-within:border-[#5C3A21] transition-all">
                        <input type="text" inputMode="numeric" maxLength={7} value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM / AA" className="w-full text-[14px] text-[#171310] bg-transparent outline-none" />
                      </div>
                      {validationErrors.expiry && <p className="mt-1 text-[11px] text-red-700">{validationErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#171310] mb-2">CVV</label>
                      <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 bg-white focus-within:border-[#5C3A21] transition-all">
                        <input type="text" inputMode="numeric" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" className="w-full text-[14px] text-[#171310] bg-transparent outline-none" />
                      </div>
                      {validationErrors.cvv && <p className="mt-1 text-[11px] text-red-700">{validationErrors.cvv}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={handlePay} disabled={loading || !plan} className="w-full h-[48px] rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors">
                    <LockKeyhole className="w-4 h-4 stroke-[2]" />
                    {loading ? 'Paiement...' : `Payer ${plan ? Number(plan.prix).toLocaleString('fr-FR') : '0'} FCFA`}
                  </button>
                </div>
              )}
            </section>

            <aside className="border border-[#E5E5E3] rounded-2xl p-6 bg-white">
              <h2 className="font-serif text-xl text-[#171310] pb-3 border-b border-[#E5E5E3]">Récapitulatif</h2>
              <div className="py-3 border-b border-[#E5E5E3] flex items-center justify-between">
                <span className="text-[14px] text-[#171310]/70">{plan?.nom || 'Forfait'}</span>
                <span className="text-[14px] text-[#171310]/70">{plan?.prix ? `${Number(plan.prix).toLocaleString('fr-FR')} FCFA / mois` : '—'}</span>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#171310]">Total</span>
                <span className="font-serif text-[20px] font-semibold text-[#5C3A21]">{plan?.prix ? `${Number(plan.prix).toLocaleString('fr-FR')} FCFA` : '—'}</span>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <PublicFooter variant="simple" />
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-md flex items-center justify-center gap-2 text-[13px] font-semibold transition-all ${active ? 'bg-[#5C3A21] text-white' : 'text-[#171310]/60 hover:bg-[#edeae5]'}`}>{icon}{label}</button>
  );
}

function OperatorCard({ value, current, onSelect, logo, label }) {
  return (
    <button type="button" onClick={() => onSelect(value)} className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${current === value ? 'border-[#5C3A21] bg-[#F5F4F2]' : 'border-[#E5E5E3] bg-white hover:bg-[#F5F4F2]'}`}>
      {logo}
      <span className="text-[13px] font-semibold text-[#171310]">{label}</span>
    </button>
  );
}
