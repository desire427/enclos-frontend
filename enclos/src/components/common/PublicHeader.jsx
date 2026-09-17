import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.png';

/**
 * Header public (landing, inscription, connexion, paiement).
 * mode: "landing" | "steps"
 * currentStep: 1 | 2 | 3  (utilisé quand mode="steps")
 */
export default function PublicHeader({ mode = 'landing', currentStep = 1 }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (mode === 'steps') {
    const steps = [
      { n: 1, label: 'Inscription' },
      { n: 2, label: 'Paiement' },
      { n: 3, label: 'Connexion' },
    ];
    return (
      <header className="sticky top-0 z-50 h-auto min-h-[64px] bg-white/95 backdrop-blur border-b border-[#EEEEEE] flex items-center px-4 sm:px-6 lg:px-10 py-3 gap-4">
        <Link to="/" className="flex items-center w-[120px] sm:w-[160px] shrink-0">
          <img src={Logo} alt="Enclos" />
        </Link>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 text-[12px] sm:text-[13px] text-[#171310] flex-wrap justify-end">
          {steps.map((s, i) => (
            <span key={s.n} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && <span className="text-[#171310]/30">/</span>}
              <span
                className={`w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full inline-flex items-center justify-center text-[10px] sm:text-[11px] font-semibold
                  ${s.n === currentStep
                    ? 'bg-[#5C3A21] text-white'
                    : 'border border-[#171310]/30 text-[#171310]/60'
                  }`}
              >
                {s.n}
              </span>
              <span className={`hidden sm:inline ${s.n === currentStep ? 'font-semibold' : 'text-[#171310]/60'}`}>
                {s.label}
              </span>
            </span>
          ))}
        </div>
      </header>
    );
  }

  // mode === "landing"
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#171310]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center w-[160px] shrink-0">
            <img src={Logo} alt="Enclos" />
          </Link>

          <nav className="hidden lg:flex items-center gap-9 text-[15px] font-medium text-[#171310]">
            <a href="#accueil" className="hover:text-[#5C3A21] transition-colors">Accueil</a>
            <a href="#fonctionnalites" className="hover:text-[#5C3A21] transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-[#5C3A21] transition-colors">Tarifs</a>
            <a href="#contact" className="hover:text-[#5C3A21] transition-colors">Contact</a>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/connexion"
              className="px-5 py-2.5 rounded-lg text-[15px] font-medium text-[#171310] border-[1.5px] border-[#171310] hover:bg-[#171310] hover:text-white transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/inscription"
              className="px-5 py-2.5 rounded-lg text-[15px] font-semibold bg-[#5C3A21] text-white hover:bg-[#3B2313] transition-colors"
            >
              S'inscrire
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            className="lg:hidden p-2 -mr-2 text-[#171310]"
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <nav className="lg:hidden flex flex-col gap-1 pb-5 text-[15px] font-medium text-[#171310]">
            <a href="#accueil" className="py-3 border-b border-[#171310]/10" onClick={() => setMenuOpen(false)}>Accueil</a>
            <a href="#fonctionnalites" className="py-3 border-b border-[#171310]/10" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#tarifs" className="py-3 border-b border-[#171310]/10" onClick={() => setMenuOpen(false)}>Tarifs</a>
            <a href="#contact" className="py-3 border-b border-[#171310]/10" onClick={() => setMenuOpen(false)}>Contact</a>
            <div className="flex flex-col gap-3 pt-4">
              <Link to="/connexion" className="text-center px-5 py-3 rounded-lg border-[1.5px] border-[#171310] hover:bg-[#171310] hover:text-white transition-colors">Se connecter</Link>
              <Link to="/inscription" className="text-center px-5 py-3 rounded-lg font-semibold bg-[#5C3A21] text-white hover:bg-[#3B2313] transition-colors">S'inscrire</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
