import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../../components/common/PublicHeader';
import PublicFooter from '../../../components/common/PublicFooter';
import heroSvg from '../../../assets/hero.svg';
import api from '../../../API/api';

export default function Accueil() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await api.getPlans();
        setPlans(data);
      } catch (err) {
        setError(err.message || 'Impossible de charger les forfaits.');
      }
    }

    loadPlans();
  }, []);

  return (
    <div className="antialiased min-h-screen flex flex-col">
      <PublicHeader mode="landing" />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section id="accueil" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 lg:pt-20 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center">
            <div className="reveal">
              <p className="text-[#5C3A21] font-semibold text-sm tracking-wide">Gestion de cheptel</p>
              <h1 className="font-serif text-[2.6rem] leading-[1.08] sm:text-6xl sm:leading-[1.05] mt-4 text-[#171310] max-w-xl">
                La gestion de votre élevage, simplement.
              </h1>
              <p className="mt-6 text-lg text-[#171310]/70 max-w-md leading-relaxed">
                Enclos centralise vos animaux, leur santé et leur alimentation, et vous aide à décider grâce à l'intelligence artificielle — pensé pour le terrain, pas pour un bureau.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/inscription"
                  className="px-7 py-3.5 rounded-lg font-semibold text-center bg-[#5C3A21] text-white hover:bg-[#3B2313] transition-colors"
                >
                  Commencer avec Enclos
                </Link>
                <a
                  href="#fonctionnalites"
                  className="px-7 py-3.5 rounded-lg font-medium text-center border-[1.5px] border-[#171310] text-[#171310] hover:bg-[#171310] hover:text-white transition-colors"
                >
                  Découvrir les fonctionnalités
                </a>
              </div>
              <div className="fence-post h-10 mt-11 max-w-md"></div>
            </div>

            <div className="reveal" style={{ animationDelay: '.12s' }}>
              <div className="border border-[#171310]/15 rounded-2xl p-3 bg-[#F5F4F2]">
                <img src={heroSvg} alt="Aperçu du tableau de bord Enclos" />
              </div>
              <p className="text-sm text-[#171310]/50 mt-3 text-center">Suivi du cheptel, en un coup d'œil.</p>
            </div>
          </div>
        </section>

        <div className="fence-rule"></div>

        {/* ===== FONCTIONNALITÉS ===== */}
        <section id="fonctionnalites" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-28">
          <div className="max-w-xl">
            <h2 className="font-serif text-4xl sm:text-[2.75rem] leading-tight text-[#171310]">
              Tout votre élevage, dans une seule application
            </h2>
            <p className="mt-5 text-[#171310]/70 text-lg leading-relaxed">
              Trois piliers pensés pour le quotidien d'un éleveur, du registre d'animaux jusqu'à l'aide à la décision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-14">
            <article className="border border-[#17131017] bg-white rounded-2xl p-8 flex flex-col">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="mb-6">
                <rect x="3" y="7" width="28" height="22" rx="2.5" stroke="#5C3A21" strokeWidth="1.8"/>
                <path d="M3 14h28" stroke="#5C3A21" strokeWidth="1.8"/>
                <path d="M10 7V4M24 7V4" stroke="#171310" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="10" cy="20" r="2" fill="#171310"/>
                <circle cx="17" cy="20" r="2" fill="#171310"/>
                <circle cx="24" cy="20" r="2" fill="#171310"/>
              </svg>
              <h3 className="font-serif text-xl text-[#171310]">Gestion du cheptel</h3>
              <p className="mt-3 text-[#171310]/70 leading-relaxed flex-1">
                Enregistrez chaque animal, suivez son évolution et organisez votre cheptel par lot, enclos ou race.
              </p>
            </article>

            <article className="border border-[#17131017] bg-white rounded-2xl p-8 flex flex-col">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="mb-6">
                <path d="M17 4 C17 4 8 12 8 19 a9 9 0 0 0 18 0 C26 12 17 4 17 4Z" stroke="#5C3A21" strokeWidth="1.8"/>
                <path d="M13 20l3 3 5-6" stroke="#171310" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="font-serif text-xl text-[#171310]">Santé &amp; alimentation</h3>
              <p className="mt-3 text-[#171310]/70 leading-relaxed flex-1">
                Programmez vaccinations et traitements, suivez les rations alimentaires et gardez un historique sanitaire complet.
              </p>
            </article>

            <article className="border border-[#17131017] bg-white rounded-2xl p-8 flex flex-col">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="mb-6">
                <circle cx="17" cy="17" r="13" stroke="#5C3A21" strokeWidth="1.8"/>
                <path d="M17 10v7l5 3" stroke="#171310" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <h3 className="font-serif text-xl text-[#171310]">Intelligence artificielle</h3>
              <p className="mt-3 text-[#171310]/70 leading-relaxed flex-1">
                Recevez des recommandations basées sur vos données, détectez les anomalies tôt et prenez des décisions plus sûres.
              </p>
            </article>
          </div>
        </section>

        {/* ===== VALEUR / CONFIANCE ===== */}
        <section className="bg-[#171310] text-white py-16 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
              <div>
                <h2 className="font-serif text-4xl sm:text-[2.75rem] leading-tight">
                  Pourquoi les éleveurs choisissent Enclos
                </h2>
                <p className="mt-5 text-white/65 text-lg leading-relaxed max-w-md">
                  Une application conçue pour remplacer le carnet papier et les fichiers éparpillés, sans complexité inutile.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
                {[
                  ['Gain de temps', "Moins de paperasse, plus de temps sur le terrain avec vos animaux."],
                  ['Suivi précis', "Chaque animal est tracé, de sa naissance à ses derniers soins."],
                  ['Données centralisées', "Toutes vos fermes et vos équipes accèdent aux mêmes informations à jour."],
                  ['Décisions éclairées', "L'IA d'Enclos repère les signaux faibles avant qu'ils ne deviennent des problèmes."],
                ].map(([title, desc]) => (
                  <div key={title}>
                    <h3 className="font-serif text-xl">{title}</h3>
                    <p className="mt-2 text-white/65 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== TARIFS ===== */}
        <section id="tarifs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-28">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-serif text-4xl sm:text-[2.75rem] leading-tight text-[#171310]">
              Un tarif pour chaque exploitation
            </h2>
            <p className="mt-5 text-[#171310]/70 text-lg leading-relaxed">
              Changez de plan à tout moment, sans engagement.
            </p>
          </div>

          {error && <div className="max-w-2xl mx-auto mt-8 text-sm text-red-700">{error}</div>}

          <div className="grid md:grid-cols-3 gap-6 mt-14 items-start">
            {plans.length === 0 && !error && (
              <div className="md:col-span-3 text-center text-[#171310]/60 text-sm">Chargement des forfaits...</div>
            )}

            {plans.map((plan, idx) => {
              if (idx === 1) {
                return (
                  <div key={plan.id} className="rounded-2xl p-8 bg-[#171310] text-white relative md:-translate-y-4 shadow-[0_20px_50px_-20px_rgba(23,19,16,0.4)]">
                    <span className="absolute -top-3.5 left-8 bg-[#5C3A21] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      Recommandé
                    </span>
                    <h3 className="font-serif text-2xl">{plan.nom}</h3>
                    <p className="mt-2 text-white/60 text-sm">{plan.description}</p>
                    <p className="mt-6">
                      <span className="font-serif text-4xl">{Number(plan.prix).toLocaleString('fr-FR')}</span>
                      <span className="text-white/60"> FCFA / mois</span>
                    </p>
                    <ul className="mt-7 space-y-3.5 text-white/80 text-[15px]">
                      <li className="flex gap-2.5"><span className="font-bold">—</span> {plan.nb_fermes_max ? `${plan.nb_fermes_max} ferme${plan.nb_fermes_max > 1 ? 's' : ''}` : 'Fermes illimitées'}</li>
                      <li className="flex gap-2.5"><span className="font-bold">—</span> {plan.nb_animaux_max ? `${plan.nb_animaux_max} animal${plan.nb_animaux_max > 1 ? 's' : ''}` : 'Animaux illimités'}</li>
                      <li className="flex gap-2.5"><span className="font-bold">—</span> {plan.acces_ia ? 'Accès IA complet' : 'Accès IA limité'}</li>
                      {plan.acces_support && <li className="flex gap-2.5"><span className="font-bold">—</span> Support prioritaire</li>}
                      {plan.acces_analyses && <li className="flex gap-2.5"><span className="font-bold">—</span> Analyses avancées</li>}
                    </ul>
                    <Link
                      to={`/inscription?plan=${plan.id}`}
                      className="mt-8 block text-center px-6 py-3 rounded-lg font-semibold bg-white text-[#171310] hover:bg-white/90 transition-colors"
                    >
                      Choisir ce plan
                    </Link>
                  </div>
                );
              }

              return (
                <div key={plan.id} className="border border-[#17131017] bg-white rounded-2xl p-8">
                  <h3 className="font-serif text-2xl text-[#171310]">{plan.nom}</h3>
                  <p className="mt-2 text-[#171310]/60 text-sm">{plan.description}</p>
                  <p className="mt-6">
                    <span className="font-serif text-4xl text-[#171310]">{Number(plan.prix).toLocaleString('fr-FR')}</span>
                    <span className="text-[#171310]/60"> FCFA / mois</span>
                  </p>
                  <ul className="mt-7 space-y-3.5 text-[#171310]/75 text-[15px]">
                    <li className="flex gap-2.5"><span className="text-[#5C3A21] font-bold">—</span> {plan.nb_fermes_max ? `${plan.nb_fermes_max} ferme${plan.nb_fermes_max > 1 ? 's' : ''}` : 'Fermes illimitées'}</li>
                    <li className="flex gap-2.5"><span className="text-[#5C3A21] font-bold">—</span> {plan.nb_animaux_max ? `${plan.nb_animaux_max} animal${plan.nb_animaux_max > 1 ? 's' : ''}` : 'Animaux illimités'}</li>
                    <li className="flex gap-2.5"><span className="text-[#5C3A21] font-bold">—</span> {plan.acces_ia ? 'Accès IA complet' : 'Accès IA limité'}</li>
                    {plan.acces_support && <li className="flex gap-2.5"><span className="text-[#5C3A21] font-bold">—</span> Support prioritaire</li>}
                    {plan.acces_analyses && <li className="flex gap-2.5"><span className="text-[#5C3A21] font-bold">—</span> Analyses avancées</li>}
                  </ul>
                  <Link
                    to={`/inscription?plan=${plan.id}`}
                    className="mt-8 block text-center px-6 py-3 rounded-lg font-medium border-[1.5px] border-[#171310] text-[#171310] hover:bg-[#171310] hover:text-white transition-colors"
                  >
                    Choisir ce plan
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="bg-[#F5F4F2] border-y border-[#171310]/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 text-center">
            <h2 className="font-serif text-4xl sm:text-5xl leading-tight text-[#171310]">
              Prêt à simplifier la gestion de votre élevage&nbsp;?
            </h2>
            <p className="mt-5 text-[#171310]/70 text-lg max-w-lg mx-auto leading-relaxed">
              Rejoignez les éleveurs qui gèrent déjà leur cheptel avec Enclos.
            </p>
            <Link
              to="/inscription"
              className="mt-9 inline-block px-9 py-4 rounded-lg font-semibold bg-[#5C3A21] text-white hover:bg-[#3B2313] transition-colors"
            >
              Créer mon compte
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter variant="light" />
    </div>
  );
}
