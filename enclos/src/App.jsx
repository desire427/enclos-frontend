import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from './components/layouts/AppLayout';

// Pages publiques
import Accueil     from './pages/public/Accueil/Accueil';
import Inscription from './pages/public/Inscription/Inscription';
import Connexion   from './pages/public/Connexion/Connexion';
import Paiement    from './pages/public/Paiement/Paiement';

// Dashboard
import Dashboard from './pages/app/Dashboard/Dashboard';

// Mon Cheptel
import MonCheptel     from './pages/app/MonCheptel/MonCheptel';
import AjoutAnimal    from './pages/app/MonCheptel/AjoutAnimal';
import DetailAnimal   from './pages/app/MonCheptel/DetailAnimal';
import ModifierAnimal from './pages/app/MonCheptel/ModifierAnimal';

// Alimentation
import Alimentation        from './pages/app/Alimentation/Alimentation';
import AjouterAlimentation from './pages/app/Alimentation/AjouterAlimentation';
import DetailAliment       from './pages/app/Alimentation/DetailAliment';
import ModifierAlimentation from './pages/app/Alimentation/ModifierAlimentation';

// Historique
import Historique from './pages/app/Historique/Historique';

// Suivi santé
import SuiviSante   from './pages/app/SuiviSante/SuiviSante';
import DetailSante  from './pages/app/SuiviSante/DetailSante';
import ModifierSante from './pages/app/SuiviSante/ModifierSante';

// Gestation
import Gestation        from './pages/app/Gestation/Gestation';
import DetailGestation  from './pages/app/Gestation/DetailGestation';
import ModifierGestation from './pages/app/Gestation/ModifierGestation';

// Abonnement
import Abonnement    from './pages/app/Abonnement/Abonnement';
import ChangerForfait from './pages/app/Abonnement/ChangerForfait';

// Paramètres
import Parametres from './pages/app/Parametres/Parametres';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== Pages publiques (sans sidebar) ===== */}
        <Route path="/"            element={<Accueil />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/connexion"   element={<Connexion />} />
        <Route path="/paiement"    element={<Paiement />} />

        {/* ===== Pages app (avec sidebar + header) ===== */}
        <Route element={<AppLayout />}>

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Mon Cheptel */}
          <Route path="/cheptel"              element={<MonCheptel />} />
          <Route path="/cheptel/ajouter"      element={<AjoutAnimal />} />
          <Route path="/cheptel/:id"          element={<DetailAnimal />} />
          <Route path="/cheptel/:id/modifier" element={<ModifierAnimal />} />

          {/* Alimentation */}
          <Route path="/alimentation"                element={<Alimentation />} />
          <Route path="/alimentation/ajouter"        element={<AjouterAlimentation />} />
          <Route path="/alimentation/:id"            element={<DetailAliment />} />
          <Route path="/alimentation/:id/modifier"   element={<ModifierAlimentation />} />

          {/* Historique */}
          <Route path="/historique" element={<Historique />} />

          {/* Suivi santé */}
          <Route path="/sante"              element={<SuiviSante />} />
          <Route path="/sante/ajouter"      element={<ModifierSante />} />
          <Route path="/sante/:id"          element={<DetailSante />} />
          <Route path="/sante/:id/modifier" element={<ModifierSante />} />

          {/* Gestation */}
          <Route path="/gestation"              element={<Gestation />} />
          <Route path="/gestation/ajouter"      element={<ModifierGestation />} />
          <Route path="/gestation/:id"          element={<DetailGestation />} />
          <Route path="/gestation/:id/modifier" element={<ModifierGestation />} />

          {/* Abonnement */}
          <Route path="/abonnement"         element={<Abonnement />} />
          <Route path="/abonnement/changer" element={<ChangerForfait />} />

          {/* Paramètres */}
          <Route path="/parametres" element={<Parametres />} />

          {/* Redirections routes non implémentées */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}
