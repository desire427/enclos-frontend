export default function AppFooter() {
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
