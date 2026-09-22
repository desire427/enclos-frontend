import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Warehouse, LockKeyhole, Eye, EyeOff, ArrowRight } from 'lucide-react';
import PublicHeader from '../../../components/common/PublicHeader';
import PublicFooter from '../../../components/common/PublicFooter';
import api from '../../../API/api';
import { clean, validateLogin } from '../../../utils/validation';

export default function Connexion() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [farmName, setFarmName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validation = validateLogin({ username, farmName, password });
    setValidationErrors(validation.errors);
    if (validation.message) {
      setError(validation.message);
      return;
    }
    setLoading(true);

    try {
      const payload = await api.login({ username: clean(username), password, nom_ferme: clean(farmName) });
      if (payload?.access) {
        api.setToken(payload.access);
        navigate('/dashboard');
      } else {
        setError('Identifiants invalides.');
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader mode="steps" currentStep={3} />

      <main className="flex-1 bg-[#F5F4F2] flex flex-col items-center px-4 sm:px-6 lg:px-10 py-12">
        <h1 className="font-serif text-[28px] sm:text-[32px] leading-tight text-[#171310] mb-2">Connexion</h1>
        <p className="text-[#171310]/60 text-[15px] mb-8">Accédez à votre exploitation en toute sécurité.</p>

        <div className="w-full max-w-[420px] bg-white border border-[#E5E5E3] rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="username" className="block text-[13px] font-semibold text-[#171310] mb-2">
                Nom d’utilisateur <span className="text-red-700">*</span>
              </label>
              <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 gap-[10px] bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                <Mail className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />
                <input
                  id="username"
                  type="text"
                  placeholder="alphonse"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                  required
                />
              </div>
              <FieldError message={validationErrors.username} />
            </div>

            <div className="mb-5">
              <label htmlFor="farm" className="block text-[13px] font-semibold text-[#171310] mb-2">
                Nom de la ferme <span className="text-red-700">*</span>
              </label>
              <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 gap-[10px] bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                <Warehouse className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />
                <input
                  id="farm"
                  type="text"
                  placeholder="Bergerie du Baobab"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  className="w-full text-[14px] text-[#171310] bg-transparent outline-none"
                />
              </div>
              <FieldError message={validationErrors.farmName} />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-[13px] font-semibold text-[#171310] mb-2">
                Mot de passe <span className="text-red-700">*</span>
              </label>
              <div className="h-11 border border-[#DCDCD9] rounded-[10px] flex items-center px-3 gap-[10px] bg-white focus-within:border-[#5C3A21] focus-within:shadow-[0_0_0_3px_rgba(92,58,33,0.12)] transition-all">
                <LockKeyhole className="w-4 h-4 text-[#171310]/50 stroke-[1.6]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="........"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-[14px] text-[#171310] bg-transparent outline-none tracking-[2px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-[#171310]/60"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4 stroke-[1.6]" />
                    : <Eye className="w-4 h-4 stroke-[1.6]" />
                  }
                </button>
              </div>
              <FieldError message={validationErrors.password} />
            </div>

            {error && <div className="mb-4 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:translate-y-px disabled:opacity-70"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="#" className="text-[13px] text-[#171310]/60 underline underline-offset-2 hover:text-[#171310] transition-colors">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <p className="text-[13px] text-[#171310]/60 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-[#5C3A21] font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </main>

      <PublicFooter variant="simple" />
    </div>
  );
}

function FieldError({ message }) {
  return message ? <p className="mt-1 text-[11px] text-red-700">{message}</p> : null;
}
