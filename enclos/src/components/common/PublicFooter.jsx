/**
 * Footer public.
 * variant: "light" (landing footer complet) | "simple" (une ligne)
 */
export default function PublicFooter({ variant = 'simple' }) {
  if (variant === 'light') {
    return (
      <footer id="contact" className="bg-[#171310] text-white/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center w-[160px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="none">
                  <rect x="2" y="10" width="28" height="28" rx="6" stroke="#4A2E1B" strokeWidth="2.5" fill="#FFFFFF"/>
                  <path d="M7 24H25M16 15V33" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="24" r="3.5" fill="#141414"/>
                  <text x="38" y="29" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="20" fontWeight="800" letterSpacing="-0.5px" fill="#FFFFFF">ENCLOS</text>
                  <circle cx="132" cy="27" r="2.5" fill="#FFFFFF"/>
                </svg>
              </div>
              <p className="mt-4 text-sm leading-relaxed max-w-[220px]">
                La gestion de votre élevage, simplement.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Produit</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="/connexion" className="hover:text-white transition-colors">Se connecter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Légal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li>contact@enclos.app</li>
                <li>+221 33 000 00 00</li>
                <li>Dakar, Sénégal</li>
              </ul>
            </div>
          </div>
          <div className="mt-14 pt-8 border-t border-white/10 text-xs text-white/40">
            © 2026 Enclos. Tous droits réservés.
          </div>
        </div>
      </footer>
    );
  }

  // variant === "simple"
  return (
    <footer className="h-[56px] border-t border-[#EEEEEE] px-6 lg:px-10 flex items-center justify-between">
      <span className="text-[12px] text-[#171310]/60">© 2026 Enclos. Tous droits réservés.</span>
      <div className="flex items-center gap-5 text-[12px] text-[#171310]/60">
        <a href="#" className="hover:text-[#171310] transition-colors">Mentions Légales</a>
        <a href="#" className="hover:text-[#171310] transition-colors">Confidentialité</a>
        <a href="#" className="hover:text-[#171310] transition-colors">CGU</a>
      </div>
    </footer>
  );
}
