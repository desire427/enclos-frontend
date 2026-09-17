import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, HeartPulse, Wheat,
  History, Baby, CreditCard, Settings, X,
} from 'lucide-react';
import Logo from '../../assets/Logo.png';
import api from '../../API/api';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cheptel',     icon: PawPrint,         label: 'Mon cheptel' },
  { to: '/sante',       icon: HeartPulse,       label: 'Suivi santé' },
  { to: '/alimentation',icon: Wheat,            label: 'Alimentation' },
  { to: '/historique',  icon: History,          label: 'Historique' },
  { to: '/gestation',   icon: Baby,             label: 'Gestation' },
];

const accountItems = [
  { to: '/abonnement', icon: CreditCard, label: 'Abonnement' },
  { to: '/parametres', icon: Settings,   label: 'Paramètres' },
];

export default function Sidebar({ open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();

  /* Fermer la sidebar mobile à chaque changement de route */
  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getCurrentUser();
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Impossible de charger le profil.');
      }
    }

    loadProfile();
  }, []);

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    : 'Utilisateur';
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'EN';

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[220px] bg-[#1d1d1d] text-white z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo + bouton fermer (mobile) */}
        <div className="h-[64px] bg-white flex items-center px-4 border-b border-[#EEEEEE] justify-between">
          <NavLink to="/" className="flex items-center w-[160px]">
            <img src={Logo} alt="Enclos" />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center text-[#171310]/60 hover:text-[#171310] transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 pt-4 flex-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-1 h-8 flex items-center px-[10px] rounded-[6px] text-[12px] transition-colors duration-150
                ${isActive
                  ? 'bg-[#f4f4f4] text-[#5C3A21] font-semibold'
                  : 'text-[#e5e5e5] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-2 stroke-[1.7]" />
              {label}
            </NavLink>
          ))}

          {/* Section compte */}
          <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-[0.6px] text-[#888]">
            Compte
          </div>

          {accountItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-1 h-8 flex items-center px-[10px] rounded-[6px] text-[12px] transition-colors duration-150
                ${isActive
                  ? 'bg-[#f4f4f4] text-[#5C3A21] font-semibold'
                  : 'text-[#e5e5e5] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-2 stroke-[1.7]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Utilisateur */}
        <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(to bottom right, #60a5fa)' }}
          >
            {initials}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[12px] text-white font-medium truncate max-w-[120px]">{fullName}</div>
            {profile?.email && (
              <div className="text-[10px] text-[#e5e5e5]/70 truncate max-w-[120px]">{profile.email}</div>
            )}
            {error ? <div className="text-[10px] text-red-300">{error}</div> : (
              <NavLink
                to="/connexion"
                className="text-[11px] text-[#8B5E3C] hover:text-white transition-colors"
              >
                Déconnexion
              </NavLink>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
