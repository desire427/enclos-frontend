// Récupère l'URL de base de l'API depuis les variables d'environnement Vite
// Si VITE_API_BASE_URL n'est pas défini, utilise localhost:8000 par défaut
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Construction des URLs des différents endpoints de l'API backend
// Chaque constante correspond à une ressource spécifique de l'application
const AUTH_URL = `${API_BASE}/api/auth`;           // Endpoint pour l'authentification (login, register, refresh token)
const PLANS_URL = `${API_BASE}/api/plans`;         // Endpoint pour les plans d'abonnement
const SUBSCRIPTIONS_URL = `${API_BASE}/api/subscriptions`; // Endpoint pour les abonnements utilisateurs
const MONCHEPTEL_URL = `${API_BASE}/api/animaux`;  // Endpoint pour la gestion des animaux (bétail)
const RACES_URL = `${API_BASE}/api/races`;         // Endpoint pour les races d'animaux
const ALIMENTATION_URL  = `${API_BASE}/api/alimentations`; // Endpoint pour les alimentations des animaux
const TYPE_ALIMENT_URL  = `${API_BASE}/api/type-aliments`; // Endpoint pour les types d'aliments
const FREQUENCE_URL     = `${API_BASE}/api/frequences`;    // Endpoint pour les fréquences d'alimentation
const HISTORIQUE_URL = `${API_BASE}/api/historiques`;       // Endpoint pour l'historique des événements
const GESTATION_URL = `${API_BASE}/api/gestations`;         // Endpoint pour les gestations des femelles
const SANTE_URL = `${API_BASE}/api/sante`;                 // Endpoint pour le suivi de santé
const ALERTES_URL = `${API_BASE}/api/alertes`;             // Endpoint pour les alertes système
const IA_URL = `${API_BASE}/api/ia`;                       // Endpoint pour les fonctionnalités d'intelligence artificielle

// Fonction utilitaire pour récupérer le token d'accès JWT depuis le localStorage
// Le token d'accès est utilisé pour authentifier les requêtes vers l'API
// Si le token n'existe pas, retourne une chaîne vide
function getStoredToken() {
  return localStorage.getItem('enclos_access_token') || '';
}

// Fonction utilitaire pour récupérer le token de rafraîchissement depuis le localStorage
// Le token de rafraîchissement permet d'obtenir un nouveau token d'accès quand celui-ci expire
// Si le token n'existe pas, retourne une chaîne vide
function getStoredRefreshToken() {
  return localStorage.getItem('enclos_refresh_token') || '';
}

// Fonction utilitaire pour récupérer l'ID de la ferme active depuis le localStorage
// L'ID de la ferme est envoyé dans l'en-tête X-Ferme-Id pour filtrer les données par ferme
// Si l'ID n'existe pas, retourne une chaîne vide
function getStoredFermeId() {
  return localStorage.getItem('enclos_ferme_id') || '';
}

// Fonction asynchrone pour rafraîchir le token d'accès quand il expire
// Utilise le token de rafraîchissement pour obtenir un nouveau token d'accès valide
async function refreshAccessToken() {
  // Récupère le token de rafraîchissement depuis le localStorage
  const refresh = getStoredRefreshToken();
  // Si aucun token de rafraîchissement n'est disponible, retourne une chaîne vide
  if (!refresh) return '';

  // Envoie une requête POST à l'endpoint de rafraîchissement de token
  const response = await fetch(`${AUTH_URL}/token/refresh/`, {
    method: 'POST',  // Méthode HTTP POST pour envoyer le token de rafraîchissement
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, // En-têtes pour indiquer que l'on envoie et reçoit du JSON
    body: JSON.stringify({ refresh }), // Corps de la requête contenant le token de rafraîchissement
  });
  // Si la requête échoue (statut HTTP différent de 2xx), retourne une chaîne vide
  if (!response.ok) return '';

  // Parse la réponse JSON de l'API
  const payload = await response.json();
  // Si la réponse ne contient pas de nouveau token d'accès, retourne une chaîne vide
  if (!payload?.access) return '';
  // Stocke le nouveau token d'accès dans le localStorage
  localStorage.setItem('enclos_access_token', payload.access);
  // Si la réponse contient aussi un nouveau token de rafraîchissement, le stocke également
  if (payload.refresh) localStorage.setItem('enclos_refresh_token', payload.refresh);
  // Retourne le nouveau token d'accès pour être utilisé dans les requêtes suivantes
  return payload.access;
}

// Fonction utilitaire pour construire les en-têtes HTTP des requêtes API
// Ajoute automatiquement l'authentification et l'ID de ferme si disponibles
function authHeaders(token) {
  // Récupère l'ID de la ferme active depuis le localStorage
  const fermeId = getStoredFermeId();
  // Retourne un objet contenant les en-têtes HTTP
  return {
    Accept: 'application/json', // Indique que le client accepte les réponses au format JSON
    'Content-Type': 'application/json', // Indique que le corps de la requête est au format JSON
    // Si un token est fourni, ajoute l'en-tête Authorization avec le schéma Bearer (standard JWT)
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Si un token est fourni ET qu'un ID de ferme existe, ajoute l'en-tête X-Ferme-Id
    // Cet en-tête personnalisé permet au backend de savoir quelle ferme est concernée par la requête
    ...(token && fermeId ? { 'X-Ferme-Id': fermeId } : {}),
  };
}

// Fonction principale de requête HTTP avec gestion automatique du rafraîchissement de token
// C'est la fonction centrale utilisée par toutes les méthodes de l'objet api
// @param url - L'URL complète de l'endpoint API à appeler
// @param options - Objet d'options pour la requête fetch (method, body, headers, token, etc.)
// @returns - La réponse de l'API parsée (JSON ou texte) ou null pour une réponse 204
// @throws - Une erreur si la requête échoue avec un statut HTTP différent de 2xx
async function request(url, options = {}) {
  // Récupère le token depuis les options s'il est fourni explicitement, sinon chaîne vide
  const explicitToken = options.token || '';
  // Construit les en-têtes HTTP avec authentification en utilisant le token
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = authHeaders(explicitToken);
  if (isFormData) delete headers['Content-Type'];

  // Effectue la requête HTTP avec l'API fetch native du navigateur
  const response = await fetch(url, {
    ...options, // Étale toutes les options fournies (method, body, etc.)
    headers: {
      ...headers, // Ajoute les en-têtes avec authentification
      ...(options.headers || {}), // Fusionne avec les en-têtes personnalisés fournis
    },
  });

  // GESTION AUTOMATIQUE DU RAFRAÎCHISSEMENT DE TOKEN
  // Si la réponse est 401 (Unauthorized) et que la requête n'a pas déjà été réessayée
  // et qu'un token était fourni, tente de rafraîchir le token
  if (response.status === 401 && !options.retried && explicitToken) {
    // Appelle la fonction de rafraîchissement pour obtenir un nouveau token
    const refreshedToken = await refreshAccessToken();
    // Si le rafraîchissement a réussi, réessaie la requête avec le nouveau token
    if (refreshedToken) {
      return request(url, { ...options, token: refreshedToken, retried: true });
    }
  }

  // GESTION DES ERREURS HTTP
  // Si la réponse n'est pas OK (statut HTTP différent de 2xx), lance une erreur
  if (!response.ok) {
    // Récupère le type de contenu de la réponse pour savoir comment la parser
    const contentType = response.headers.get('content-type') || '';
    // Parse le corps de la réponse en JSON si c'est du JSON, sinon en texte
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    // Extrait le message d'erreur de la réponse
    // Si la réponse est un objet avec une propriété 'detail', utilise celle-ci
    // Sinon, convertit l'objet en chaîne de caractères
    const message = typeof payload === 'object' && payload && payload.detail
      ? payload.detail
      : (typeof payload === 'object' && payload ? JSON.stringify(payload) : String(payload));

    // Lance une erreur avec le message extrait ou un message par défaut
    throw new Error(message || 'Erreur API');
  }

  // GESTION DE LA RÉPONSE 204 NO CONTENT
  // Le statut 204 signifie que la requête a réussi mais qu'il n'y a pas de contenu à retourner
  // C'est typiquement utilisé pour les requêtes DELETE
  if (response.status === 204) {
    return null;
  }

  // PARSE DE LA RÉPONSE NORMALE
  // Récupère le type de contenu de la réponse
  const contentType = response.headers.get('content-type') || '';
  // Retourne la réponse parsée en JSON si c'est du JSON, sinon en texte
  return contentType.includes('application/json') ? response.json() : response.text();
}

// Objet principal d'interfaçage avec l'API backend
// Contient toutes les méthodes pour communiquer avec les différents endpoints de l'API
// Cet objet est exporté et peut être importé dans les autres fichiers du projet
export const api = {
  // Exportation des URLs des endpoints pour référence externe si nécessaire
  AUTH_URL,
  PLANS_URL,
  SUBSCRIPTIONS_URL,
  MONCHEPTEL_URL,
  RACES_URL,
  HISTORIQUE_URL,
  GESTATION_URL,
  SANTE_URL,
  ALERTES_URL,
  IA_URL,

  // ============================================================
  // MÉTHODES DE GESTION DE SESSION ET STOCKAGE LOCAL
  // ============================================================

  // Méthode pour définir ou supprimer le token d'accès dans le localStorage
  // @param token - Le token JWT à stocker, ou null/false pour le supprimer
  setToken(token) {
    // Si un token est fourni (vrai), le stocke dans le localStorage avec la clé 'enclos_access_token'
    if (token) {
      localStorage.setItem('enclos_access_token', token);
    } else {
      // Sinon, supprime le token du localStorage (déconnexion)
      localStorage.removeItem('enclos_access_token');
    }
  },

  // Méthode pour définir la ferme active dans le localStorage
  // @param fermeId - L'identifiant unique de la ferme (number ou string)
  // @param fermeNom - Le nom de la ferme (string)
  setActiveFarm(fermeId, fermeNom) {
    // Si un ID de ferme est fourni, stocke l'ID et le nom dans le localStorage
    if (fermeId) {
      localStorage.setItem('enclos_ferme_id', String(fermeId)); // Convertit l'ID en string pour le stockage
      localStorage.setItem('enclos_ferme_nom', fermeNom || ''); // Stocke le nom, ou chaîne vide si non fourni
    } else {
      // Sinon, supprime les informations de ferme du localStorage
      localStorage.removeItem('enclos_ferme_id');
      localStorage.removeItem('enclos_ferme_nom');
    }
  },

  // Méthode pour récupérer la ferme active depuis le localStorage
  // @returns - Un objet contenant l'ID et le nom de la ferme active
  getActiveFarm() {
    return {
      id: localStorage.getItem('enclos_ferme_id') || '', // Récupère l'ID ou chaîne vide si non défini
      nom: localStorage.getItem('enclos_ferme_nom') || '', // Récupère le nom ou chaîne vide si non défini
    };
  },

  // Méthode pour vérifier si une session utilisateur existe
  // @returns - true si un token d'accès ou de rafraîchissement existe, false sinon
  hasSession() {
    // Convertit en booléen : true si l'un des tokens existe, false sinon
    return Boolean(getStoredToken() || getStoredRefreshToken());
  },

  // Méthode pour supprimer tous les tokens et informations de session du localStorage
  // Utilisée lors de la déconnexion de l'utilisateur
  clearToken() {
    localStorage.removeItem('enclos_access_token'); // Supprime le token d'accès
    localStorage.removeItem('enclos_refresh_token'); // Supprime le token de rafraîchissement
    localStorage.removeItem('enclos_ferme_id'); // Supprime l'ID de la ferme
    localStorage.removeItem('enclos_ferme_nom'); // Supprime le nom de la ferme
  },

  // ============================================================
  // MÉTHODES D'AUTHENTIFICATION
  // ============================================================

  // Méthode pour connecter un utilisateur avec son nom d'utilisateur et mot de passe
  // Stocke automatiquement les tokens et sélectionne une ferme
  // @param credentials - Objet contenant les identifiants de connexion
  // @param credentials.username - Nom d'utilisateur de l'utilisateur
  // @param credentials.password - Mot de passe de l'utilisateur
  // @param credentials.nom_ferme - Nom de la ferme à sélectionner (optionnel)
  // @returns - La réponse de l'API contenant les tokens et les informations utilisateur
  async login({ username, password, nom_ferme }) {
    // Envoie une requête POST à l'endpoint de token pour obtenir les tokens JWT
    const payload = await request(`${AUTH_URL}/token/`, {
      method: 'POST', // Méthode HTTP POST pour envoyer les identifiants
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, // En-têtes JSON
      body: JSON.stringify({ username, password }), // Corps avec username et password
    });

    // Si la réponse contient un token d'accès, la connexion a réussi
    if (payload?.access) {
      // Stocke le token d'accès dans le localStorage via la méthode setToken
      this.setToken(payload.access);
      // Si la réponse contient aussi un token de rafraîchissement, le stocke directement
      if (payload.refresh) localStorage.setItem('enclos_refresh_token', payload.refresh);

      // SÉLECTION AUTOMATIQUE DE LA FERME
      // Si un nom de ferme a été fourni lors de la connexion
      if (nom_ferme && nom_ferme.trim()) {
        try {
          // Récupère la liste des fermes de l'utilisateur via l'API
          const farms = await request(`${API_BASE}/api/fermes/`, {
            method: 'GET', // Méthode HTTP GET pour récupérer les fermes
            token: payload.access, // Utilise le nouveau token d'accès pour l'authentification
          });
          // S'assure que farms est un tableau, sinon utilise un tableau vide
          const list = Array.isArray(farms) ? farms : [];
          // Cherche une ferme dont le nom correspond (insensible à la casse et aux espaces)
          const match = list.find(f => f.nom.trim().toLowerCase() === nom_ferme.trim().toLowerCase());
          // Si aucune correspondance n'est trouvée, utilise la première ferme de la liste
          const chosen = match || list[0];
          // Si une ferme a été sélectionnée, la définit comme ferme active
          if (chosen) {
            this.setActiveFarm(chosen.id, chosen.nom);
          }
        } catch (_) {
          // Si la récupération des fermes échoue, ne bloque pas la connexion
          // L'utilisateur pourra sélectionner sa ferme plus tard
        }
      } else {
        // Si aucun nom de ferme n'a été précisé, sélectionne automatiquement la première ferme
        try {
          // Récupère la liste des fermes de l'utilisateur
          const farms = await request(`${API_BASE}/api/fermes/`, {
            method: 'GET',
            token: payload.access,
          });
          // S'assure que farms est un tableau
          const list = Array.isArray(farms) ? farms : [];
          // Si la liste contient au moins une ferme, sélectionne la première
          if (list[0]) this.setActiveFarm(list[0].id, list[0].nom);
        } catch (_) {
          // Si la récupération échoue, continue sans sélectionner de ferme
        }
      }
    }

    // Retourne le payload complet de la réponse (contient les tokens et infos utilisateur)
    return payload;
  },

  // Méthode pour enregistrer un nouvel utilisateur dans le système
  // @param payload - Objet contenant les données d'inscription (username, password, email, etc.)
  // @returns - La réponse de l'API avec les informations de l'utilisateur créé
  async register(payload) {
    // Envoie une requête POST à l'endpoint d'inscription
    return request(`${AUTH_URL}/users/register/`, {
      method: 'POST', // Méthode HTTP POST pour créer un nouvel utilisateur
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, // En-têtes JSON
      body: JSON.stringify(payload), // Corps avec les données d'inscription
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DES FERMES
  // ============================================================

  // Méthode pour créer une nouvelle ferme pour l'utilisateur connecté
  // @param payload - Objet contenant les données de la ferme (nom, adresse, description, etc.)
  // @returns - La ferme créée avec son ID et toutes ses informations
  async createFarm(payload) {
    // Envoie une requête POST à l'endpoint des fermes
    return request(`${API_BASE}/api/fermes/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle ferme
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de la ferme
    });
  },

  // Méthode pour récupérer la liste de toutes les fermes de l'utilisateur connecté
  // @returns - Un tableau contenant toutes les fermes de l'utilisateur
  async getFarms() {
    // Envoie une requête GET à l'endpoint des fermes
    return request(`${API_BASE}/api/fermes/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les fermes
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DES ABONNEMENTS ET PAIEMENTS
  // ============================================================

  // Méthode pour récupérer la liste des plans d'abonnement disponibles
  // @returns - Un tableau contenant tous les plans d'abonnement avec leurs prix et fonctionnalités
  async getPlans() {
    // Envoie une requête GET à l'endpoint des plans (pas besoin d'authentification)
    return request(`${PLANS_URL}/`);
  },

  // Méthode pour récupérer les détails d'un plan d'abonnement spécifique
  // @param id - L'identifiant unique du plan d'abonnement
  // @returns - Les détails complets du plan (prix, fonctionnalités, durée, etc.)
  async getPlan(id) {
    // Envoie une requête GET à l'endpoint du plan spécifique
    return request(`${PLANS_URL}/${id}/`);
  },

  // Méthode pour récupérer tous les abonnements de l'utilisateur connecté
  // @returns - Un tableau contenant tous les abonnements de l'utilisateur (actifs et expirés)
  async getSubscriptions() {
    // Envoie une requête GET à l'endpoint des abonnements
    return request(`${SUBSCRIPTIONS_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les abonnements
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour récupérer l'abonnement actif de l'utilisateur
  // @returns - L'abonnement actuellement actif ou null si aucun abonnement actif
  async getActiveSubscription() {
    // Envoie une requête GET à l'endpoint de l'abonnement actif
    return request(`${SUBSCRIPTIONS_URL}/active/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer l'abonnement actif
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer un checkout Paydunya pour le paiement en ligne
  // Paydunya est une solution de paiement africaine
  // @param payload - Objet contenant les données du checkout (plan_id, montant, etc.)
  // @returns - Les informations du checkout incluant l'URL de redirection vers la page de paiement
  async createPaydunyaCheckout(payload) {
    // Envoie une requête POST à l'endpoint Paydunya
    return request(`${SUBSCRIPTIONS_URL}/paydunya/`, {
      method: 'POST', // Méthode HTTP POST pour créer le checkout
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données du checkout
    });
  },

  // Méthode pour confirmer un paiement Paydunya après redirection depuis la page de paiement
  // @param token - Le token de confirmation fourni par Paydunya après le paiement
  // @returns - La confirmation du paiement avec les détails de l'abonnement créé
  async confirmPaydunya(token) {
    // Envoie une requête POST à l'endpoint de confirmation Paydunya
    return request(`${SUBSCRIPTIONS_URL}/confirm-paydunya/`, {
      method: 'POST', // Méthode HTTP POST pour confirmer le paiement
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify({ token }), // Corps avec le token de confirmation
    });
  },

  // Méthode pour créer un nouvel abonnement pour l'utilisateur
  // @param payload - Objet contenant les données de l'abonnement (plan_id, date_debut, etc.)
  // @returns - L'abonnement créé avec son ID et toutes ses informations
  async createSubscription(payload) {
    // Envoie une requête POST à l'endpoint des abonnements
    return request(`${SUBSCRIPTIONS_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer un abonnement
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de l'abonnement
    });
  },

  // Méthode pour mettre à jour un abonnement existant
  // @param id - L'identifiant unique de l'abonnement à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (statut, date_fin, etc.)
  // @returns - L'abonnement mis à jour avec ses nouvelles informations
  async updateSubscription(id, payload) {
    // Envoie une requête PATCH à l'endpoint de l'abonnement spécifique
    // PATCH est utilisé pour une mise à jour partielle (seuls les champs fournis sont modifiés)
    return request(`${SUBSCRIPTIONS_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DES ANIMAUX (BÉTAIL)
  // ============================================================

  // Méthode pour récupérer la liste de tous les animaux de la ferme active
  // @returns - Un tableau contenant tous les animaux avec leurs informations (nom, race, âge, etc.)
  async getAnimals() {
    // Envoie une requête GET à l'endpoint des animaux
    // L'en-tête X-Ferme-Id est automatiquement ajouté par authHeaders pour filtrer par ferme
    return request(`${MONCHEPTEL_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les animaux
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour récupérer la liste des races, filtrée par espèce si spécifiée
  // @param espece - L'espèce pour filtrer les races (ex: "bovin", "ovin", "caprin") - optionnel
  // @returns - Un tableau contenant les races (filtrées par espèce si fourni)
  async getRaces(espece = null) {
    // Construit l'URL avec ou sans paramètre de filtre selon si espece est fourni
    const url = espece
      ? `${RACES_URL}/?espece=${encodeURIComponent(espece)}` // Ajoute le paramètre espece à l'URL
      : `${RACES_URL}/`; // URL sans filtre
    // Envoie la requête GET avec l'URL construite
    return request(url, {
      method: 'GET', // Méthode HTTP GET pour récupérer les races
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer une nouvelle race dans le système
  // @param payload - Objet contenant les données de la race (nom, espece, description, etc.)
  // @returns - La race créée avec son ID et toutes ses informations
  async createRace(payload) {
    // Envoie une requête POST à l'endpoint des races
    return request(`${RACES_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle race
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de la race
    });
  },

  // Méthode pour mettre à jour une race existante
  // @param id - L'identifiant unique de la race à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (nom, description, etc.)
  // @returns - La race mise à jour avec ses nouvelles informations
  async updateRace(id, payload) {
    // Envoie une requête PATCH à l'endpoint de la race spécifique
    return request(`${RACES_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer une race du système
  // @param id - L'identifiant unique de la race à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteRace(id) {
    // Envoie une requête DELETE à l'endpoint de la race spécifique
    return request(`${RACES_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer la race
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer un nouvel animal dans la ferme active
  // @param payload - Objet contenant les données de l'animal (nom, race_id, date_naissance, sexe, poids, etc.)
  // @returns - L'animal créé avec son ID et toutes ses informations
  async createAnimal(payload) {
    // Envoie une requête POST à l'endpoint des animaux
    return request(`${MONCHEPTEL_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer un nouvel animal
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour récupérer les détails d'un animal spécifique
  // @param id - L'identifiant unique de l'animal
  // @returns - Les détails complets de l'animal (nom, race, âge, historique, etc.)
  async getAnimal(id) {
    // Envoie une requête GET à l'endpoint de l'animal spécifique
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les détails de l'animal
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  async getAnimalQr(id) {
    return request(`${MONCHEPTEL_URL}/${id}/qr/`, { method: 'GET', token: getStoredToken() });
  },

  async getOrdonnances(animalId) {
    return request(`${SANTE_URL.replace('/sante', '/ordonnances')}/?animal=${animalId}`, { method: 'GET', token: getStoredToken() });
  },

  async createOrdonnance(payload) {
    const url = `${SANTE_URL.replace('/sante', '/ordonnances')}/`;
    return request(url, { method: 'POST', token: getStoredToken(), body: payload instanceof FormData ? payload : JSON.stringify(payload) });
  },

  async updateOrdonnance(id, payload) {
    const url = `${SANTE_URL.replace('/sante', '/ordonnances')}/${id}/`;
    return request(url, { method: 'PATCH', token: getStoredToken(), body: payload instanceof FormData ? payload : JSON.stringify(payload) });
  },

  async deleteOrdonnance(id) {
    return request(`${SANTE_URL.replace('/sante', '/ordonnances')}/${id}/`, { method: 'DELETE', token: getStoredToken() });
  },

  // Méthode pour mettre à jour un animal existant
  // @param id - L'identifiant unique de l'animal à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (nom, poids, statut, etc.)
  // @returns - L'animal mis à jour avec ses nouvelles informations
  async updateAnimal(id, payload) {
    // Envoie une requête PATCH à l'endpoint de l'animal spécifique
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer un animal de la ferme
  // @param id - L'identifiant unique de l'animal à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteAnimal(id) {
    // Envoie une requête DELETE à l'endpoint de l'animal spécifique
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer l'animal
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DE L'ALIMENTATION
  // ============================================================

  // Méthode pour récupérer la liste de toutes les alimentations de la ferme active
  // @returns - Un tableau contenant toutes les alimentations avec leurs détails
  async getAlimentations() {
    // Envoie une requête GET à l'endpoint des alimentations
    return request(`${ALIMENTATION_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les alimentations
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer une nouvelle alimentation pour un animal
  // @param payload - Objet contenant les données de l'alimentation (animal_id, type_aliment_id, frequence_id, quantite, etc.)
  // @returns - L'alimentation créée avec son ID et toutes ses informations
  async createAlimentation(payload) {
    // Envoie une requête POST à l'endpoint des alimentations
    return request(`${ALIMENTATION_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle alimentation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de l'alimentation
    });
  },

  // ── GESTION DES TYPES D'ALIMENTS ──

  // Méthode pour récupérer la liste des types d'aliments disponibles
  // @returns - Un tableau contenant tous les types d'aliments (foin, grains, compléments, etc.)
  async getTypeAliments() {
    // Envoie une requête GET à l'endpoint des types d'aliments
    return request(`${TYPE_ALIMENT_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les types d'aliments
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer un nouveau type d'aliment
  // @param payload - Objet contenant les données du type d'aliment (nom, description, unite_mesure, etc.)
  // @returns - Le type d'aliment créé avec son ID et toutes ses informations
  async createTypeAliment(payload) {
    // Envoie une requête POST à l'endpoint des types d'aliments
    return request(`${TYPE_ALIMENT_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer un nouveau type d'aliment
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données du type d'aliment
    });
  },

  // Méthode pour mettre à jour un type d'aliment existant
  // @param id - L'identifiant unique du type d'aliment à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (nom, description, etc.)
  // @returns - Le type d'aliment mis à jour avec ses nouvelles informations
  async updateTypeAliment(id, payload) {
    // Envoie une requête PATCH à l'endpoint du type d'aliment spécifique
    return request(`${TYPE_ALIMENT_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer un type d'aliment
  // @param id - L'identifiant unique du type d'aliment à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteTypeAliment(id) {
    // Envoie une requête DELETE à l'endpoint du type d'aliment spécifique
    return request(`${TYPE_ALIMENT_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer le type d'aliment
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ── GESTION DES FRÉQUENCES D'ALIMENTATION ──

  // Méthode pour récupérer la liste des fréquences d'alimentation disponibles
  // @returns - Un tableau contenant toutes les fréquences (quotidien, hebdomadaire, mensuel, etc.)
  async getFrequences() {
    // Envoie une requête GET à l'endpoint des fréquences
    return request(`${FREQUENCE_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les fréquences
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer une nouvelle fréquence d'alimentation
  // @param payload - Objet contenant les données de la fréquence (nom, description, intervalle_jours, etc.)
  // @returns - La fréquence créée avec son ID et toutes ses informations
  async createFrequence(payload) {
    // Envoie une requête POST à l'endpoint des fréquences
    return request(`${FREQUENCE_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle fréquence
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de la fréquence
    });
  },

  // Méthode pour mettre à jour une fréquence d'alimentation existante
  // @param id - L'identifiant unique de la fréquence à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (nom, intervalle, etc.)
  // @returns - La fréquence mise à jour avec ses nouvelles informations
  async updateFrequence(id, payload) {
    // Envoie une requête PATCH à l'endpoint de la fréquence spécifique
    return request(`${FREQUENCE_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer une fréquence d'alimentation
  // @param id - L'identifiant unique de la fréquence à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteFrequence(id) {
    // Envoie une requête DELETE à l'endpoint de la fréquence spécifique
    return request(`${FREQUENCE_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer la fréquence
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour récupérer les détails d'une alimentation spécifique
  // @param id - L'identifiant unique de l'alimentation
  // @returns - Les détails complets de l'alimentation
  async getAlimentation(id) {
    // Envoie une requête GET à l'endpoint de l'alimentation spécifique
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les détails de l'alimentation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour mettre à jour une alimentation existante
  // @param id - L'identifiant unique de l'alimentation à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (quantite, frequence, etc.)
  // @returns - L'alimentation mise à jour avec ses nouvelles informations
  async updateAlimentation(id, payload) {
    // Envoie une requête PATCH à l'endpoint de l'alimentation spécifique
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer une alimentation
  // @param id - L'identifiant unique de l'alimentation à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteAlimentation(id) {
    // Envoie une requête DELETE à l'endpoint de l'alimentation spécifique
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer l'alimentation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DE L'HISTORIQUE
  // ============================================================

  // Méthode pour récupérer l'historique des événements de la ferme
  // @returns - Un tableau contenant tous les événements historiques (naissances, décès, maladies, etc.)
  async getHistorique() {
    // Envoie une requête GET à l'endpoint de l'historique
    return request(`${HISTORIQUE_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer l'historique
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer un nouvel événement dans l'historique
  // @param payload - Objet contenant les données de l'événement (type, description, animal_id, date, etc.)
  // @returns - L'événement créé avec son ID et toutes ses informations
  async createHistorique(payload) {
    // Envoie une requête POST à l'endpoint de l'historique
    return request(`${HISTORIQUE_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer un nouvel événement
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de l'événement
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DES GESTATIONS
  // ============================================================

  // Méthode pour récupérer la liste de toutes les gestations de la ferme
  // @returns - Un tableau contenant toutes les gestations avec leurs détails
  async getGestations() {
    // Envoie une requête GET à l'endpoint des gestations
    return request(`${GESTATION_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les gestations
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer une nouvelle gestation pour une femelle
  // @param payload - Objet contenant les données de la gestation (animal_id, date_debut, date_prevue, etc.)
  // @returns - La gestation créée avec son ID et toutes ses informations
  async createGestation(payload) {
    // Envoie une requête POST à l'endpoint des gestations
    return request(`${GESTATION_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle gestation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de la gestation
    });
  },

  // Méthode pour récupérer les détails d'une gestation spécifique
  // @param id - L'identifiant unique de la gestation
  // @returns - Les détails complets de la gestation
  async getGestation(id) {
    // Envoie une requête GET à l'endpoint de la gestation spécifique
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les détails de la gestation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour mettre à jour une gestation existante
  // @param id - L'identifiant unique de la gestation à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (date_fin, nombre_petits, statut, etc.)
  // @returns - La gestation mise à jour avec ses nouvelles informations
  async updateGestation(id, payload) {
    // Envoie une requête PATCH à l'endpoint de la gestation spécifique
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer une gestation
  // @param id - L'identifiant unique de la gestation à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteGestation(id) {
    // Envoie une requête DELETE à l'endpoint de la gestation spécifique
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer la gestation
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DE LA SANTÉ
  // ============================================================

  // Méthode pour récupérer la liste des suivis de santé (ou un suivi spécifique si ID fourni)
  // @param id - L'ID du suivi de santé spécifique (optionnel)
  // @returns - La liste des suivis de santé ou le suivi spécifique
  async getSante(id = null) {
    // Construit l'URL selon si un ID est fourni ou non
    const url = id ? `${SANTE_URL}/${id}/` : `${SANTE_URL}/`;
    // Envoie la requête GET avec l'URL construite
    return request(url, {
      method: 'GET', // Méthode HTTP GET pour récupérer les suivis de santé
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  async getSuivisSante(animalId) {
    const suffix = animalId ? `/?animal=${encodeURIComponent(animalId)}` : '/';
    return request(`${SANTE_URL}${suffix}`, { method: 'GET', token: getStoredToken() });
  },

  // Méthode pour récupérer le suivi de santé ouvert (non terminé) d'un animal
  // Un suivi est considéré ouvert si son statut n'est pas "guéri" et qu'il n'a pas de date_fin
  // @param animalId - L'identifiant unique de l'animal
  // @returns - Le suivi de santé ouvert ou null si aucun suivi ouvert n'existe
  async getSuiviSanteOuvert(animalId) {
    // Récupère tous les suivis de santé pour l'animal spécifié via le paramètre de requête
    const data = await request(`${SANTE_URL}/?animal=${animalId}`, {
      method: 'GET', // Méthode HTTP GET avec paramètre de filtrage par animal
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
    // S'assure que data est un tableau, sinon essaie data.results ou utilise un tableau vide
    const list = Array.isArray(data) ? data : (data?.results || []);
    // Cherche un suivi qui n'est pas guéri et qui n'a pas de date de fin
    return list.find((s) => {
      const statut = (s.statut || '').toLowerCase(); // Convertit le statut en minuscules
      // Retourne true si le statut n'est ni "guéri" ni "gueri" et qu'il n'y a pas de date_fin
      return statut !== 'guéri' && statut !== 'gueri' && !s.date_fin;
    }) || null; // Retourne null si aucun suivi ouvert n'est trouvé
  },

  // Méthode pour récupérer les détails d'un suivi de santé spécifique
  // @param id - L'identifiant unique du suivi de santé
  // @returns - Les détails complets du suivi de santé
  async getSanteById(id) {
    // Envoie une requête GET à l'endpoint du suivi de santé spécifique
    return request(`${SANTE_URL}/${id}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les détails du suivi
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour créer un nouveau suivi de santé
  // @param payload - Objet contenant les données du suivi (animal_id, maladie, symptomes, date_debut, etc.)
  // @returns - Le suivi de santé créé avec son ID et toutes ses informations
  async createSante(payload) {
    // Envoie une requête POST à l'endpoint des suivis de santé
    return request(`${SANTE_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer un nouveau suivi
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données du suivi
    });
  },

  // Méthode pour mettre à jour un suivi de santé existant
  // @param id - L'identifiant unique du suivi de santé à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (statut, traitement, date_fin, etc.)
  // @returns - Le suivi de santé mis à jour avec ses nouvelles informations
  async updateSante(id, payload) {
    // Envoie une requête PATCH à l'endpoint du suivi de santé spécifique
    return request(`${SANTE_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour supprimer un suivi de santé
  // @param id - L'identifiant unique du suivi de santé à supprimer
  // @returns - null (réponse HTTP 204 No Content)
  async deleteSante(id) {
    // Envoie une requête DELETE à l'endpoint du suivi de santé spécifique
    return request(`${SANTE_URL}/${id}/`, {
      method: 'DELETE', // Méthode HTTP DELETE pour supprimer le suivi
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DES ALERTES
  // ============================================================

  // Méthode pour récupérer la liste des alertes de la ferme
  // @returns - Un tableau contenant toutes les alertes (non lues, lues, archivées, etc.)
  async getAlertes() {
    // Envoie une requête GET à l'endpoint des alertes
    return request(`${ALERTES_URL}/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les alertes
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  // Méthode pour mettre à jour une alerte existante
  // @param id - L'identifiant unique de l'alerte à mettre à jour
  // @param payload - Objet contenant les données à mettre à jour (statut: lu/archivé, etc.)
  // @returns - L'alerte mise à jour avec ses nouvelles informations
  async updateAlerte(id, payload) {
    // Envoie une requête PATCH à l'endpoint de l'alerte spécifique
    return request(`${ALERTES_URL}/${id}/`, {
      method: 'PATCH', // Méthode HTTP PATCH pour mise à jour partielle
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: payload instanceof FormData ? payload : JSON.stringify(payload), // Corps de la requête
    });
  },

  // Méthode pour créer une nouvelle alerte
  // @param payload - Objet contenant les données de l'alerte (type, message, animal_id, priorite, etc.)
  // @returns - L'alerte créée avec son ID et toutes ses informations
  async createAlerte(payload) {
    // Envoie une requête POST à l'endpoint des alertes
    return request(`${ALERTES_URL}/`, {
      method: 'POST', // Méthode HTTP POST pour créer une nouvelle alerte
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify(payload), // Corps avec les données de l'alerte
    });
  },

  // ============================================================
  // MÉTHODES D'INTELLIGENCE ARTIFICIELLE
  // ============================================================

  // Méthode pour récupérer les prédictions IA (toutes ou pour un animal spécifique)
  // @param animalId - L'ID de l'animal pour filtrer les prédictions (optionnel)
  // @returns - Un tableau contenant les prédictions IA (croissance, santé, production, etc.)
  async getPredictions(animalId = null) {
    // Construit le suffixe de l'URL selon si un animalId est fourni ou non
    const suffix = animalId ? `/?animal=${encodeURIComponent(animalId)}` : '/';
    // Envoie la requête GET à l'endpoint des prédictions
    return request(`${IA_URL}/predictions${suffix}`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les prédictions
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },

  async preDiagnostic(payload) {
    return request(`${IA_URL}/pre-diagnostic/`, {
      method: 'POST', token: getStoredToken(),
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  },

  // Méthode pour déclencher une prédiction IA pour un animal spécifique
  // @param params - Objet contenant les paramètres de la prédiction
  // @param params.animal_id - L'identifiant unique de l'animal à prédire
  // @param params.alimentation_id - L'identifiant de l'alimentation à prendre en compte (optionnel)
  // @returns - Le résultat de la prédiction IA avec les informations prédites
  async predireAnimal({ animal_id, alimentation_id = null }) {
    // Envoie une requête POST à l'endpoint de prédiction
    return request(`${IA_URL}/predire/`, {
      method: 'POST', // Méthode HTTP POST pour déclencher la prédiction
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
      body: JSON.stringify({ animal_id, alimentation_id, declencheur: 'manuel' }), // Corps avec les paramètres et le déclencheur manuel
    });
  },

  // ============================================================
  // MÉTHODES DE GESTION DE L'UTILISATEUR
  // ============================================================

  // Méthode pour récupérer les informations de l'utilisateur connecté
  // @returns - Les informations de l'utilisateur (username, email, date_inscription, etc.)
  async getCurrentUser() {
    // Envoie une requête GET à l'endpoint de l'utilisateur courant
    return request(`${AUTH_URL}/users/me/`, {
      method: 'GET', // Méthode HTTP GET pour récupérer les infos utilisateur
      token: getStoredToken(), // Utilise le token d'accès stocké pour l'authentification
    });
  },
};

// Export par défaut de l'objet api pour permettre son importation dans les autres fichiers
// Peut être importé de deux façons :
// - import { api } from './api.js' (import nommé)
// - import api from './api.js' (import par défaut)
export default api;
