# Enclos — Frontend

Interface web d'Enclos, une application de gestion d'élevage. Le frontend est une SPA React qui consomme l'API REST Django et reçoit les alertes en temps réel.

## Technologies

- React 19 et React Router
- Vite 8
- Tailwind CSS 4
- Lucide React
- `qr-scanner` pour la lecture des QR codes
- Nginx pour servir la version de production dans Docker

## Fonctionnalités de la V2

- Pages publiques : accueil, inscription, connexion et paiement d'un forfait.
- Tableau de bord : indicateurs du cheptel, graphiques, activités récentes et alertes.
- Gestion du cheptel : ajout, consultation et modification des animaux, recherche et filtres.
- Lecture d'un QR code avec la caméra ou import d'une image pour retrouver la fiche d'un animal.
- Diagnostic IA : envoi d'une image et d'observations, échange avec l'assistant, pistes à vérifier et recommandations. Cette aide ne remplace pas l'avis d'un vétérinaire.
- Suivi de l'alimentation : consultation, ajout et modification des rations.
- Suivi de santé : consultations, mesures, notes, ordonnances et rappels associés.
- Gestion des gestations : dates de saillie et de mise bas, mâle reproducteur, statut, naissances et notes.
- Historique des événements du cheptel.
- Alertes consultables depuis le panneau de notifications, avec mise à jour de leur statut.
- Paramètres du profil, du mot de passe et des fermes associées au compte.
- Abonnements : consultation et changement de forfait, historique des paiements et annulation.
- Paiement via PayDunya avec Wave, Orange Money ou carte bancaire, selon la configuration du service.

## Structure du frontend

Le code de l'application se trouve dans `frontend/enclos/src/` :

```text
src/
├── API/                 # Requêtes vers l'API Django
├── components/          # Composants communs et mises en page
├── hooks/               # Hooks de chargement des animaux et références
├── pages/
│   ├── app/              # Pages protégées : cheptel, alimentation, santé, etc.
│   └── public/           # Accueil, inscription, connexion et paiement
└── utils/                # Validation et utilitaires
```

`App.jsx` déclare les routes. `AppLayout.jsx` protège les routes de l'application et fournit l'en-tête, la navigation et le pied de page. `API/api.js` centralise les appels HTTP, les jetons JWT et l'identifiant de la ferme active.

## Prérequis et lancement local

- Node.js compatible avec Vite 8 et npm.
- API backend disponible. Par défaut, le frontend utilise `http://127.0.0.1:8000`.

Depuis `frontend/enclos/` :

```bash
npm ci
npm run dev
```

Vite affiche l'adresse locale à ouvrir dans le navigateur (par défaut `http://localhost:5173`).

Pour utiliser une autre adresse d'API, créer un fichier `.env.local` dans `frontend/enclos/` :

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Cette variable est intégrée au bundle lors du build. Après toute modification, relancer le serveur Vite ou reconstruire l'image de production.

## Scripts npm

Depuis `frontend/enclos/` :

```bash
npm run dev      # Serveur Vite de développement
npm run build    # Build de production dans dist/
npm run preview  # Prévisualisation locale du build
npm run lint     # Vérification avec oxlint
```

## Docker

Le Dockerfile du frontend utilise une construction multi-étapes : Node.js construit l'application, puis Nginx sert les fichiers compilés. `nginx.conf` renvoie les routes de la SPA vers `index.html` et relaie les connexions WebSocket sous `/ws/` vers le service `backend`.

Le fichier `docker-compose.yml` se trouve à la racine du projet. Depuis cette racine :

```bash
docker compose up --build
```

Services et accès par défaut :

| Service | Rôle | Accès depuis l'hôte |
| --- | --- | --- |
| `frontend` | Application React servie par Nginx | `http://localhost:5173` |
| `backend` | API Django | `http://localhost:8000` |
| `reminders` | Vérifie les prises échues et crée les alertes | Pas de port exposé |
| `db` | PostgreSQL 16 | `localhost:5433` (port hôte configurable avec `DB_FORWARD_PORT`) |

Le frontend Docker contacte par défaut l'API sur `http://127.0.0.1:8000` depuis le navigateur. Cette configuration convient à un lancement local sur la même machine. Pour un déploiement distant, il faut transmettre une valeur `VITE_API_BASE_URL` adaptée à l'adresse publiquement accessible de l'API au build Vite, puis reconstruire le bundle frontend. Le Dockerfile et la configuration Compose actuels ne transmettent pas automatiquement cette variable au build.

Commandes utiles, à lancer depuis la racine du projet :

```bash
docker compose ps
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f reminders
docker compose exec backend python manage.py createsuperuser
docker compose down
```

Les migrations Django sont exécutées au démarrage du conteneur backend. Le service `reminders` attend que le backend soit prêt, puis vérifie les prises échues toutes les 30 secondes. Les alertes apparaissent dans le panneau de notifications de l'application ; ce ne sont pas des notifications natives du système d'exploitation. Les données PostgreSQL sont conservées dans le volume `enclos_pgdata`. `docker compose down` conserve ce volume ; `docker compose down -v` le supprime également et efface les données de la base.

Le build du backend télécharge le modèle d'IA : une connexion Internet est donc nécessaire lors de la construction de l'image. Le montage `./models:/models` de Compose permet aussi de fournir un modèle local à cet emplacement.

## Configuration et sécurité

- Le backend charge sa configuration depuis `backend/.env`. Ne publiez pas ce fichier et ne placez pas de clés ou de mots de passe dans ce README.
- Les paramètres de base de données Docker doivent correspondre entre le service PostgreSQL de `docker-compose.yml` et les variables `DB_*` de `backend/.env`.
- PostgreSQL reste accessible aux autres conteneurs sous le nom `db` sur le port interne `5432`. Le port hôte est `5433` par défaut afin d'éviter les conflits avec un PostgreSQL déjà installé ; configure `DB_FORWARD_PORT` si ce port hôte est lui aussi occupé.
- Remplacez les identifiants de démonstration et configurez des secrets distincts avant tout déploiement.
- Les fonctionnalités d'IA et de paiement dépendent des clés et URL de services externes configurées côté backend.

## Vérification

Pour vérifier le frontend avant livraison :

```bash
npm run lint
npm run build
```
