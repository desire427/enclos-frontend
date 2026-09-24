# Enclos Frontend - Documentation Complète

##  Vue d'ensemble du projet

**Enclos** est une application web de gestion d'élevage (cheptel) construite avec React et Vite. L'interface permet aux éleveurs de gérer leurs animaux, leur alimentation, leur santé, leurs gestations, et bien plus encore.

### Stack Technique

- **React 19.2.8** : Bibliothèque JavaScript pour construire des interfaces utilisateur
- **Vite 8.2.2** : Outil de build ultra-rapide pour le développement
- **React Router DOM 7.18.3** : Système de routing (navigation) pour React
- **Tailwind CSS 4.3.3** : Framework CSS utilitaire pour le styling
- **Lucide React 1.44.0** : Bibliothèque d'icônes modernes

### Architecture

L'application suit une architecture **SPA (Single Page Application)** :
- Toute l'application se charge en une seule page HTML
- La navigation se fait par le routing côté client (sans rechargement de page)
- Les données sont récupérées depuis une API REST backend Django

---

##  Arborescence du projet

```
enclos/
├── Dockerfile                 # Configuration pour le conteneur Docker
├── index.html                 # Point d'entrée HTML de l'application
├── nginx.conf                 # Configuration du serveur Nginx pour la production
├── package.json               # Dépendances et scripts du projet
├── package-lock.json          # Versions exactes des dépendances
├── vite.config.js             # Configuration de Vite
├── README.md                  # Ce fichier de documentation
├── public/                    # Fichiers statiques publics
│   ├── favicon.svg           # Icône de favicon
│   └── icons.svg             # Icônes SVG
└── src/                       # Code source de l'application
    ├── main.jsx              # Point d'entrée de l'application React
    ├── index.css             # Styles globaux
    ├── App.jsx               # Composant principal avec le routing
    ├── App.css               # Styles du composant App
    ├── API/                  # Couche de communication avec l'API backend
    │   └── api.js           # Fonctions pour les requêtes HTTP
    ├── assets/               # Assets statiques (images, logos)
    │   ├── hero.svg         # Image héros
    │   └── Logo.png         # Logo de l'application
    ├── components/           # Composants React réutilisables
    │   ├── common/         # Composants communs à toute l'application
    │   │   ├── AppFooter.jsx      # Footer de l'application connectée
    │   │   ├── AppHeader.jsx      # Header de l'application connectée
    │   │   ├── CreateSimpleModal.jsx  # Modal simple pour créer des enregistrements
    │   │   ├── FilterDropdown.jsx     # Dropdown pour filtrer les listes
    │   │   ├── PublicFooter.jsx      # Footer des pages publiques
    │   │   ├── PublicHeader.jsx      # Header des pages publiques
    │   │   └── Sidebar.jsx          # Barre latérale de navigation
    │   └── layouts/        # Composants de layout (structure de page)
    │       └── AppLayout.jsx    # Layout principal pour les pages connectées
    ├── hooks/               # Custom Hooks React (logique réutilisable)
    │   ├── useAlimRefs.js  # Hook pour charger les références d'alimentation
    │   └── useAnimals.js   # Hook pour charger la liste des animaux
    ├── pages/               # Pages de l'application
    │   ├── app/           # Pages de l'application connectée
    │   │   ├── Abonnement/       # Gestion des abonnements
    │   │   │   ├── Abonnement.jsx       # Liste des abonnements
    │   │   │   └── ChangerForfait.jsx   # Changement de forfait
    │   │   ├── Alertes/           # Gestion des alertes
    │   │   │   └── AlertesPanel.jsx    # Panneau des alertes
    │   │   ├── Alimentation/      # Gestion de l'alimentation
    │   │   │   ├── Alimentation.jsx         # Liste des alimentations
    │   │   │   ├── AjouterAlimentation.jsx # Formulaire d'ajout
    │   │   │   ├── DetailAliment.jsx        # Détails d'une alimentation
    │   │   │   └── ModifierAlimentation.jsx # Formulaire de modification
    │   │   ├── Dashboard/         # Tableau de bord principal
    │   │   │   └── Dashboard.jsx        # Page du dashboard avec KPIs et graphiques
    │   │   ├── Gestation/          # Gestion des gestations
    │   │   │   ├── Gestation.jsx         # Liste des gestations
    │   │   │   ├── DetailGestation.jsx   # Détails d'une gestation
    │   │   │   └── ModifierGestation.jsx # Formulaire de modification
    │   │   ├── Historique/        # Historique des événements
    │   │   │   └── Historique.jsx        # Page d'historique
    │   │   ├── MonCheptel/        # Gestion du cheptel (animaux)
    │   │   │   ├── MonCheptel.jsx        # Liste des animaux
    │   │   │   ├── AjoutAnimal.jsx       # Formulaire d'ajout
    │   │   │   ├── DetailAnimal.jsx      # Détails d'un animal
    │   │   │   └── ModifierAnimal.jsx    # Formulaire de modification
    │   │   ├── Parametres/        # Paramètres utilisateur
    │   │   │   └── Parametres.jsx        # Page des paramètres
    │   │   └── SuiviSante/        # Suivi de santé
    │   │       ├── SuiviSante.jsx        # Liste des suivis de santé
    │   │       ├── DetailSante.jsx       # Détails d'un suivi
    │   │       └── ModifierSante.jsx     # Formulaire de modification
    │   └── public/         # Pages publiques (sans authentification)
    │       ├── Accueil/        # Page d'accueil
    │       │   └── Accueil.jsx        # Landing page principale
    │       ├── Connexion/      # Page de connexion
    │       │   └── Connexion.jsx       # Formulaire de login
    │       ├── Inscription/   # Page d'inscription
    │       │   └── Inscription.jsx    # Formulaire d'inscription
    │       └── Paiement/       # Page de paiement
    │           └── Paiement.jsx        # Page de confirmation de paiement
    └── utils/               # Fonctions utilitaires
        └── validation.js    # Fonctions de validation des formulaires
```

---

##  Rôle détaillé de chaque fichier

### Fichiers de configuration

#### `package.json`
Définit les dépendances du projet et les scripts npm disponibles :
- `dependencies` : Bibliothèques nécessaires pour l'exécution (React, Router, Tailwind, etc.)
- `devDependencies` : Outils de développement (Vite, linters, etc.)
- `scripts` : Commandes disponibles (`npm run dev`, `npm run build`, etc.)

#### `vite.config.js`
Configuration du bundler Vite :
- Configure les plugins (React, Tailwind CSS)
- Définit les alias, les options de build, etc.

#### `index.html`
Point d'entrée HTML de l'application :
- Contient un élément `<div id="root">` où React va monter l'application
- Charge les scripts et styles nécessaires

#### `Dockerfile`
Instructions pour construire une image Docker de l'application :
- Définit l'environnement d'exécution (Node.js)
- Installe les dépendances
- Build l'application pour la production

#### `nginx.conf`
Configuration du serveur web Nginx pour servir l'application en production :
- Gère le routing côté serveur
- Sert les fichiers statiques
- Redirige les requêtes vers index.html (pour le routing client)

### Fichiers source principaux

#### `src/main.jsx`
**Point d'entrée de l'application React**
```javascript
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
- Monte l'application React dans l'élément `<div id="root">` du HTML
- `StrictMode` active des vérifications supplémentaires en développement

#### `src/App.jsx`
**Composant principal avec le routing**
Définit toutes les routes de l'application :
- **Pages publiques** : Accueil, Inscription, Connexion, Paiement
- **Pages app** : Dashboard, Cheptel, Alimentation, etc.
- Utilise `BrowserRouter` pour la navigation
- Utilise `AppLayout` pour les pages connectées (sidebar + header)

#### `src/index.css`
Styles globaux de l'application :
- Reset CSS
- Variables CSS
- Styles de base appliqués à toute l'application

### Dossier `src/API/`

#### `src/API/api.js`
**Couche de communication avec l'API backend**
Fichier crucial qui gère toutes les interactions avec le backend Django :

**Fonctionnalités principales :**
- `request()` : Fonction centrale pour les requêtes HTTP avec gestion automatique du rafraîchissement de token JWT
- `authHeaders()` : Construction des en-têtes HTTP avec authentification
- `refreshAccessToken()` : Rafraîchissement automatique du token JWT quand il expire
- Gestion du localStorage pour stocker les tokens et l'ID de ferme active

**Méthodes API disponibles :**
- **Authentification** : `login()`, `register()`, `setToken()`, `clearToken()`
- **Ferme** : `createFarm()`, `getFarms()`, `setActiveFarm()`, `getActiveFarm()`
- **Abonnements** : `getPlans()`, `getSubscriptions()`, `createPaydunyaCheckout()`
- **Animaux** : CRUD complet pour la gestion du cheptel
- **Alimentation** : CRUD pour les alimentations et références
- **Santé** : CRUD pour les suivis de santé
- **Gestation** : CRUD pour les gestations
- **Historique** : Récupération de l'historique des événements
- **Alertes** : Gestion des alertes système

### Dossier `src/components/`

#### `src/components/layouts/AppLayout.jsx`
**Layout principal pour les pages connectées**
Structure commune à toutes les pages de l'application :
- Sidebar de navigation
- Header avec menu hamburger mobile
- Zone de contenu principale
- Footer
- **Protection des routes** : Redirige vers `/connexion` si l'utilisateur n'est pas connecté

#### `src/components/common/Sidebar.jsx`
**Barre latérale de navigation**
- Affiche le logo et le menu de navigation
- Liste les items de navigation (Dashboard, Cheptel, Santé, etc.)
- Affiche le profil utilisateur connecté
- Gère l'état ouvert/fermé sur mobile
- Met en surbrillance la page active

#### `src/components/common/AppHeader.jsx`
**Header de l'application connectée**
- Affiche le nom de la ferme active
- Bouton menu hamburger pour mobile
- Informations utilisateur

#### `src/components/common/PublicHeader.jsx`
**Header des pages publiques**
- Logo de l'application
- Navigation publique (Accueil, Connexion, Inscription)
- Indicateur d'étapes (pour le processus d'inscription)

#### `src/components/common/AppFooter.jsx` & `PublicFooter.jsx`
**Footers** : Informations légales, liens utiles, copyright

#### `src/components/common/CreateSimpleModal.jsx`
**Modal générique pour créer des enregistrements**
- Formulaire simple dans une modal
- Réutilisable pour différentes entités

#### `src/components/common/FilterDropdown.jsx`
**Dropdown pour filtrer les listes**
- Filtres dynamiques pour les tableaux de données
- Interface utilisateur pour sélectionner des critères de filtrage

### Dossier `src/hooks/`

Les **Custom Hooks** sont des fonctions React qui permettent de réutiliser la logique d'état et d'effets entre plusieurs composants.

#### `src/hooks/useAnimals.js`
**Hook pour charger la liste des animaux**
```javascript
const { animals, loading, error } = useAnimals();
```
- `animals` : Tableau des animaux chargés depuis l'API
- `loading` : État de chargement (true/false)
- `error` : Message d'erreur si le chargement échoue

**Utilisation :** Récupère automatiquement la liste des animaux au montage du composant.

#### `src/hooks/useAlimRefs.js`
**Hook pour charger les références d'alimentation**
```javascript
const { typeAliments, frequences, loading, reload } = useAlimRefs();
```
- `typeAliments` : Liste des types d'aliments disponibles
- `frequences` : Liste des fréquences d'alimentation
- `loading` : État de chargement
- `reload` : Fonction pour recharger les données

**Utilisation :** Charge les données de référence pour les formulaires d'alimentation.

### Dossier `src/pages/`

#### Pages publiques (`src/pages/public/`)

##### `Accueil/Accueil.jsx`
**Landing page principale**
- Présentation de l'application
- Avantages et fonctionnalités
- Call-to-action pour s'inscrire

##### `Connexion/Connexion.jsx`
**Page de connexion**
- Formulaire de login (username, password, nom de ferme)
- Validation des champs
- Appel à l'API pour l'authentification
- Redirection vers le dashboard après connexion réussie
- Gestion de l'affichage/masquage du mot de passe

##### `Inscription/Inscription.jsx`
**Page d'inscription**
- Formulaire complet d'inscription utilisateur
- Création du compte utilisateur
- Création de la ferme
- Sélection du plan d'abonnement
- Validation complexe de tous les champs

##### `Paiement/Paiement.jsx`
**Page de confirmation de paiement**
- Affichage des détails du paiement
- Confirmation après redirection depuis Paydunya
- Création de l'abonnement après paiement réussi

#### Pages application (`src/pages/app/`)

##### `Dashboard/Dashboard.jsx`
**Tableau de bord principal**
- **KPIs** : Indicateurs clés de performance (Total animaux, Alimentations, Gestations, Alertes)
- **Graphiques** : Distribution par espèce (donut chart), Évolution mensuelle (bar chart)
- Données en temps réel chargées depuis l'API
- Design avec cartes et statistiques visuelles

##### `MonCheptel/` - Gestion du cheptel

###### `MonCheptel.jsx`
- Liste de tous les animaux de la ferme active
- Filtres par espèce, sexe, statut
- Actions rapides (ajouter, modifier, supprimer)
- Tableau avec informations essentielles

###### `AjoutAnimal.jsx`
- Formulaire d'ajout d'un nouvel animal
- Champs : nom, espèce, sexe, date de naissance, poids, couleur, observations
- Validation des données
- Appel API pour créer l'animal

###### `DetailAnimal.jsx`
- Affichage détaillé d'un animal
- Historique des alimentations
- Historique de santé
- Historique des gestations (si femelle)
- Actions : modifier, supprimer

###### `ModifierAnimal.jsx`
- Formulaire de modification d'un animal existant
- Pré-rempli avec les données actuelles
- Validation et mise à jour via API

##### `Alimentation/` - Gestion de l'alimentation

###### `Alimentation.jsx`
- Liste des alimentations enregistrées
- Filtres par animal, type d'aliment, date
- Statistiques globales d'alimentation

###### `AjouterAlimentation.jsx`
- Formulaire d'ajout d'une alimentation
- Sélection de l'animal, type d'aliment, fréquence
- Quantité, date, notes
- Validation et création via API

###### `DetailAliment.jsx`
- Détails d'une alimentation
- Informations sur l'animal concerné
- Actions : modifier, supprimer

###### `ModifierAlimentation.jsx`
- Formulaire de modification d'une alimentation
- Mise à jour via API

##### `SuiviSante/` - Suivi de santé

###### `SuiviSante.jsx`
- Liste des suivis de santé
- Filtres par statut (Malade, En traitement, Guéri, Sous surveillance)
- KPIs : nombre de malades, en traitement, guéris

###### `DetailSante.jsx`
- Détails d'un suivi de santé
- Informations médicales (température, poids, fréquence cardiaque)
- Historique des consultations
- Actions : modifier, supprimer

###### `ModifierSante.jsx`
- Formulaire de modification d'un suivi de santé
- Mise à jour des informations médicales

##### `Gestation/` - Gestion des gestations

###### `Gestation.jsx`
- Liste des gestations en cours
- Filtres par statut (En cours, Imminente, Terminée)
- KPIs : gestations actives, imminentes, terminées

###### `DetailGestation.jsx`
- Détails d'une gestation
- Informations sur la femelle
- Dates importantes (saillie, prévue, mise bas)
- Actions : modifier, supprimer

###### `ModifierGestation.jsx`
- Formulaire de modification d'une gestation
- Mise à jour des dates et informations

##### `Historique/Historique.jsx`
- Historique complet des événements du cheptel
- Timeline des événements (naissances, maladies, alimentations, etc.)
- Filtres par type d'événement et période

##### `Abonnement/` - Gestion des abonnements

###### `Abonnement.jsx`
- Affichage de l'abonnement actif
- Liste des plans disponibles
- Historique des abonnements
- Options de changement de forfait

###### `ChangerForfait.jsx`
- Formulaire pour changer de plan d'abonnement
- Sélection du nouveau plan
- Processus de paiement via Paydunya

##### `Parametres/Parametres.jsx`
- Paramètres du compte utilisateur
- Modification des informations personnelles
- Gestion des fermes
- Préférences de l'application

##### `Alertes/AlertesPanel.jsx`
- Panneau de gestion des alertes
- Liste des alertes système
- Statuts (lue, non lue)
- Actions sur les alertes

### Dossier `src/utils/`

#### `src/utils/validation.js`
**Fonctions de validation des formulaires**
Contient toutes les fonctions de validation utilisées dans l'application :

**Validateurs de base :**
- `clean()` : Nettoyage des chaînes (suppression des espaces multiples)
- `required()` : Vérifie qu'un champ est rempli
- `validateName()` : Validation des noms (lettres, espaces, apostrophes)
- `validateText()` : Validation des textes généraux
- `validateEmail()` : Validation des adresses email
- `validatePhone()` : Validation des numéros de téléphone sénégalais
- `validatePassword()` : Validation des mots de passe (complexité)
- `validateNumber()` : Validation des nombres
- `validateDate()` : Validation des dates
- `validateSelect()` : Validation des sélections
- `validateGps()` : Validation des coordonnées GPS

**Validateurs de formulaires complets :**
- `validateRegistration()` : Validation du formulaire d'inscription
- `validateLogin()` : Validation du formulaire de connexion
- `validatePayment()` : Validation du formulaire de paiement
- `validateAlimentation()` : Validation du formulaire d'alimentation
- `validateAnimal()` : Validation du formulaire animal
- `validateGestation()` : Validation du formulaire de gestation
- `validateSante()` : Validation du formulaire de santé
- `validateFarm()` : Validation du formulaire de ferme

---

##  Concepts React expliqués

### Composants React

Un **composant** est une fonction JavaScript qui retourne du JSX (HTML-like). C'est le bloc de base de React.

```javascript
// Exemple de composant simple
function MonComposant() {
  return <div>Bonjour!</div>;
}
```

**Props (Properties)** : Les props sont des données passées d'un composant parent à un composant enfant.

```javascript
function Card({ title, content }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );
}

// Utilisation
<Card title="Mon titre" content="Mon contenu" />
```

### Hooks React

Les **hooks** sont des fonctions spéciales qui permettent d'ajouter des fonctionnalités React aux composants fonctionnels. Ils commencent toujours par `use`.

#### `useState`

**`useState`** permet d'ajouter un **état local** à un composant. L'état est une donnée qui peut changer et qui provoque le re-rendu du composant quand elle change.

```javascript
import { useState } from 'react';

function Compteur() {
  // Déclare une variable d'état "count" avec la valeur initiale 0
  // setCount est la fonction pour modifier cette valeur
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Compteur: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrémenter
      </button>
    </div>
  );
}
```

**Utilisation dans le projet :**
- Gestion des formulaires (valeurs des champs)
- États de chargement (`loading`)
- Messages d'erreur (`error`)
- États d'ouverture/fermeture des modals
- Filtrage et tri des données

#### `useEffect`

**`useEffect`** permet d'effectuer des **effets de bord** (side effects) dans les composants fonctionnels. Les effets de bord sont des opérations qui ne sont pas liées au rendu direct, comme :
- Appels API
- Abonnements (subscriptions)
- Manipulation du DOM
- Timers

```javascript
import { useState, useEffect } from 'react';

function ProfilUtilisateur({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cette fonction s'exécute après chaque rendu
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]); // Le tableau de dépendances : ne s'exécute que si userId change
  // Si le tableau est vide [], s'exécute une seule fois au montage

  if (loading) return <div>Chargement...</div>;
  return <div>Bonjour, {user.name}</div>;
}
```

**Utilisation dans le projet :**
- Chargement des données depuis l'API au montage du composant
- Nettoyage des ressources (unsubscribe, clearTimeout)
- Mise à jour du document.title
- Écoute d'événements globaux

#### `useRef`

**`useRef`** permet de créer une **référence mutable** qui persiste entre les rendus. Contrairement à `useState`, modifier une ref ne provoque pas de re-rendu.

```javascript
import { useRef, useEffect } from 'react';

function InputAutoFocus() {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus automatique sur l'input au montage
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

**Utilisations courantes :**
- Accéder direct aux éléments DOM
- Stocker des valeurs qui ne doivent pas provoquer de re-rendu
- Gérer des timers et intervals
- Stocker la valeur précédente d'un état

#### `useCallback`

**`useCallback`** mémorise une fonction pour qu'elle ne soit recréée qu'à changer de ses dépendances. Utile pour optimiser les performances avec `React.memo`.

```javascript
import { useState, useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // Cette fonction ne sera recréée que si 'count' change
  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return <Child onClick={handleClick} />;
}
```

**Utilisation dans le projet :**
- Fonctions passées comme props aux composants enfants
- Optimisation des re-rendus inutiles

#### `useMemo`

**`useMemo`** mémorise une valeur calculée pour éviter de recalculer à chaque rendu.

```javascript
import { useState, useMemo } from 'react';

function Liste({ items }) {
  const [filter, setFilter] = useState('');

  // Le filtrage ne se recalcule que si 'items' ou 'filter' change
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(filter));
  }, [items, filter]);

  return <ul>{filteredItems.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

**Utilisation dans le projet :**
- Calculs coûteux (filtrage, tri, transformations)
- Optimisation des performances

#### Custom Hooks

Les **custom hooks** sont des fonctions qui utilisent d'autres hooks pour encapsuler de la logique réutilisable.

```javascript
// Custom hook pour charger des données
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Utilisation
function UsersList() {
  const { data: users, loading, error } = useFetch('/api/users');

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

**Custom hooks dans le projet :**
- `useAnimals()` : Charge la liste des animaux
- `useAlimRefs()` : Charge les références d'alimentation

### React Router

**React Router** est la bibliothèque standard pour le routing dans React. Elle permet de naviguer entre les différentes pages de l'application sans rechargement.

**Composants principaux :**
- `BrowserRouter` : Enveloppe l'application pour activer le routing
- `Routes` : Conteneur pour les routes
- `Route` : Définit une route (path + composant)
- `Link` : Navigation déclarative (remplace les balises `<a>`)
- `NavLink` : Link avec classes actives
- `useNavigate` : Hook pour la navigation programmatique
- `useLocation` : Hook pour accéder à l'URL actuelle
- `Outlet` : Point d'injection pour les routes imbriquées (layouts)

```javascript
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

function Navigation() {
  const navigate = useNavigate();
  
  return (
    <nav>
      <Link to="/">Accueil</Link>
      <Link to="/about">À propos</Link>
      <button onClick={() => navigate('/contact')}>Contact</button>
    </nav>
  );
}
```

### JSX

**JSX** est une extension syntaxique de JavaScript qui permet d'écrire du code HTML-like dans JavaScript. Il est transpilé en JavaScript pur par des outils comme Babel.

```javascript
// JSX
const element = <div className="hello">Bonjour!</div>;

// Transpilé en JavaScript
const element = React.createElement('div', { className: 'hello' }, 'Bonjour!');
```

**Règles JSX :**
- Toujours retourner un seul élément racine
- Utiliser `className` au lieu de `class`
- Les expressions JavaScript sont entre accolades `{ }`
- Les attributs sont en camelCase (`onClick`, `onChange`)
- Les éléments auto-fermants doivent avoir un slash final `<img />`

### État vs Props

**Props (Properties)** :
- Passées du parent vers l'enfant
- Immutables (lecture seule)
- Permettent la communication entre composants

**State (État)** :
- Géré localement dans le composant
- Mutable (modifiable avec setState)
- Provoque un re-rendu quand il change
- Private au composant

```javascript
function Parent() {
  const [count, setCount] = useState(0); // State local
  
  return <Child count={count} onIncrement={() => setCount(count + 1)} />;
}

function Child({ count, onIncrement }) { // Props reçues
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onIncrement}>Incrémenter</button>
    </div>
  );
}
```

### Cycle de vie d'un composant

Les composants fonctionnels avec hooks ont un cycle de vie simplifié :

1. **Mounting (Montage)** : Le composant est créé et inséré dans le DOM
   - `useEffect` avec tableau vide `[]` s'exécute une seule fois

2. **Updating (Mise à jour)** : Le composant se re-rend quand ses props ou state changent
   - `useEffect` avec dépendances s'exécute quand les dépendances changent

3. **Unmounting (Démontage)** : Le composant est retiré du DOM
   - La fonction de retour de `useEffect` s'exécute pour le nettoyage

```javascript
useEffect(() => {
  // Code exécuté au montage
  console.log('Composant monté');
  
  // Fonction de nettoyage exécutée au démontage
  return () => {
    console.log('Composant démonté');
  };
}, []);
```

---

##  Scripts disponibles

Dans le fichier `package.json`, les scripts suivants sont disponibles :

### `npm run dev`
Lance le serveur de développement Vite :
- Hot Module Replacement (HMR) : Les changements sont appliqués sans rechargement
- Serveur accessible sur `http://localhost:5173`
- Mode développement avec messages d'erreur détaillés

### `npm run build`
Build l'application pour la production :
- Minification du code
- Optimisation des assets
- Génération du dossier `dist/` prêt à être déployé

### `npm run preview`
Prévisualise le build de production localement :
- Sert les fichiers du dossier `dist/`
- Simule l'environnement de production

### `npm run lint`
Exécute le linter (oxlint) pour vérifier la qualité du code :
- Détecte les erreurs potentielles
- Vérifie le respect des conventions de code

---

## 🔌 Communication avec l'API

### Architecture de l'API

L'application communique avec un backend Django REST via des requêtes HTTP :

**Base URL** : Configurée via la variable d'environnement `VITE_API_BASE_URL` (défaut : `http://127.0.0.1:8000`)

**Endpoints principaux :**
- `/api/auth/` : Authentification (login, register, refresh token)
- `/api/plans/` : Plans d'abonnement
- `/api/subscriptions/` : Abonnements utilisateurs
- `/api/animaux/` : Gestion des animaux
- `/api/alimentations/` : Alimentations
- `/api/sante/` : Suivi de santé
- `/api/gestations/` : Gestations
- `/api/historiques/` : Historique des événements
- `/api/alertes/` : Alertes système
- `/api/fermes/` : Gestion des fermes

### Authentification JWT

L'application utilise des **JSON Web Tokens (JWT)** pour l'authentification :

1. **Login** : L'utilisateur envoie username/password → Récupère `access_token` et `refresh_token`
2. **Requêtes authentifiées** : Le `access_token` est envoyé dans l'en-tête `Authorization: Bearer <token>`
3. **Rafraîchissement** : Quand le `access_token` expire, le `refresh_token` permet d'en obtenir un nouveau
4. **Stockage** : Les tokens sont stockés dans le `localStorage` du navigateur

### Gestion des erreurs

La couche API gère automatiquement :
- Erreurs 401 (Unauthorized) → Rafraîchissement automatique du token
- Erreurs réseau → Messages d'erreur utilisateur
- Parsing des réponses JSON

---

##  Styling avec Tailwind CSS

L'application utilise **Tailwind CSS**, un framework CSS utilitaire qui permet de styler les composants directement avec des classes.

**Exemples de classes Tailwind :**
- `bg-white` : Fond blanc
- `text-[#171310]` : Texte avec couleur personnalisée
- `p-5` : Padding de 1.25rem
- `rounded-2xl` : Border radius large
- `shadow-sm` : Ombre légère
- `flex` : Display flex
- `grid-cols-4` : Grille avec 4 colonnes
- `hover:bg-gray-100` : Background au survol

**Configuration Tailwind** : Définie dans `vite.config.js` avec le plugin `@tailwindcss/vite`

---

## 🐳 Dockerisation

L'application peut être conteneurisée avec Docker :

### Dockerfile
- Base image : Node.js Alpine
- Installation des dépendances
- Build de l'application
- Copie des fichiers build
- Exposition du port 80

### nginx.conf
- Sert les fichiers statiques
- Gère le routing SPA (toutes les routes redirigent vers index.html)
- Optimisation pour la production

### Docker Compose
Intégré dans le projet global avec :
- Service frontend (Nginx + React build)
- Service backend (Django)
- Service database (PostgreSQL)

---

##  Bonnes pratiques React

### 1. Utiliser des composants fonctionnels
Préférer les composants fonctionnels avec hooks aux composants classe.

### 2. Extraire la logique dans des custom hooks
Encapsuler la logique réutilisable dans des hooks personnalisés.

### 3. Optimiser les performances
- Utiliser `useCallback` et `useMemo` pour les calculs coûteux
- Éviter les re-rendus inutiles avec `React.memo`

### 4. Gérer les erreurs
- Toujours gérer les erreurs des appels API
- Afficher des messages d'erreur clairs aux utilisateurs

### 5. Valider les données
- Valider les formulaires côté client
- Ne jamais faire confiance aux données utilisateur

### 6. Organiser le code
- Structurer les dossiers par fonctionnalité
- Séparer les composants, hooks, et utilitaires
- Nommer les fichiers de manière descriptive

---

## 🔍 Débogage

### Outils de développement React
- **React DevTools** : Extension navigateur pour inspecter les composants React
- **Console du navigateur** : Pour voir les erreurs et les logs
- **Network tab** : Pour inspecter les requêtes API

### Erreurs courantes
- **Erreur de hook** : Les hooks doivent être appelés au niveau supérieur du composant
- **Erreur de rendu** : Vérifier que les composants retournent toujours un seul élément
- **Erreur d'API** : Vérifier que le backend est accessible et que les tokens sont valides

---

##  Ressources pour approfondir

- [Documentation React](https://react.dev/)
- [Documentation React Router](https://reactrouter.com/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Vite](https://vitejs.dev/)
- [JavaScript moderne](https://javascript.info/)

---

##  Contribution

Pour contribuer à ce projet :
1. Fork le repository
2. Créez une branche pour votre fonctionnalité
3. Commitez vos changements
4. Push et créez une Pull Request

---

##  Licence

Ce projet est développé dans le cadre de l'application Enclos pour la gestion d'élevage.

---

**Dernière mise à jour :** Septembre 2026
**Version :** 1.0.0
