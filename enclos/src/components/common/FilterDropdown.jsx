/**
 * Composant dropdown de filtre réutilisable.
 * Se ferme automatiquement quand on clique en dehors.
 *
 * Props :
 *   icon    — composant lucide-react (optionnel)
 *   label   — texte du bouton (ex: "Espèce")
 *   options — tableau de strings
 *   value   — valeur sélectionnée
 *   onChange — callback (val) => void
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterDropdown({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310]/70 inline-flex items-center gap-2 hover:bg-[#F5F4F2] transition-colors"
      >
        {Icon && <Icon className="w-4 h-4 text-[#171310]/40" />}
        {label} : <span className="text-[#171310] font-medium">{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#171310]/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-[#E5E5E3] rounded-xl shadow-lg py-1 min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#F5F4F2] transition-colors
                ${value === opt ? 'font-semibold text-[#5C3A21]' : 'text-[#171310]'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
