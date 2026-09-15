const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const AUTH_URL = `${API_BASE}/api/auth`;
const PLANS_URL = `${API_BASE}/api/plans`;
const SUBSCRIPTIONS_URL = `${API_BASE}/api/subscriptions`;
const MONCHEPTEL_URL = `${API_BASE}/api/animaux`;
const RACES_URL = `${API_BASE}/api/races`;
const ALIMENTATION_URL  = `${API_BASE}/api/alimentations`;
const TYPE_ALIMENT_URL  = `${API_BASE}/api/type-aliments`;
const FREQUENCE_URL     = `${API_BASE}/api/frequences`;
const HISTORIQUE_URL = `${API_BASE}/api/historiques`;
const GESTATION_URL = `${API_BASE}/api/gestations`;
const SANTE_URL = `${API_BASE}/api/sante`;
const ALERTES_URL = `${API_BASE}/api/alertes`;
const IA_URL = `${API_BASE}/api/ia`;

function getStoredToken() {
  return localStorage.getItem('enclos_access_token') || '';
}

function getStoredRefreshToken() {
  return localStorage.getItem('enclos_refresh_token') || '';
}

function getStoredFermeId() {
  return localStorage.getItem('enclos_ferme_id') || '';
}

async function refreshAccessToken() {
  const refresh = getStoredRefreshToken();
  if (!refresh) return '';

  const response = await fetch(`${AUTH_URL}/token/refresh/`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) return '';

  const payload = await response.json();
  if (!payload?.access) return '';
  localStorage.setItem('enclos_access_token', payload.access);
  if (payload.refresh) localStorage.setItem('enclos_refresh_token', payload.refresh);
  return payload.access;
}

function authHeaders(token) {
  const fermeId = getStoredFermeId();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // X-Ferme-Id uniquement pour les requêtes authentifiées
    ...(token && fermeId ? { 'X-Ferme-Id': fermeId } : {}),
  };
}

async function request(url, options = {}) {
  const explicitToken = options.token || '';
  const headers = authHeaders(explicitToken);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && !options.retried && explicitToken) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return request(url, { ...options, token: refreshedToken, retried: true });
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    const message = typeof payload === 'object' && payload && payload.detail
      ? payload.detail
      : (typeof payload === 'object' && payload ? JSON.stringify(payload) : String(payload));

    throw new Error(message || 'Erreur API');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

export const api = {
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

  setToken(token) {
    if (token) {
      localStorage.setItem('enclos_access_token', token);
    } else {
      localStorage.removeItem('enclos_access_token');
    }
  },

  setActiveFarm(fermeId, fermeNom) {
    if (fermeId) {
      localStorage.setItem('enclos_ferme_id', String(fermeId));
      localStorage.setItem('enclos_ferme_nom', fermeNom || '');
    } else {
      localStorage.removeItem('enclos_ferme_id');
      localStorage.removeItem('enclos_ferme_nom');
    }
  },

  getActiveFarm() {
    return {
      id: localStorage.getItem('enclos_ferme_id') || '',
      nom: localStorage.getItem('enclos_ferme_nom') || '',
    };
  },

  hasSession() {
    return Boolean(getStoredToken() || getStoredRefreshToken());
  },

  clearToken() {
    localStorage.removeItem('enclos_access_token');
    localStorage.removeItem('enclos_refresh_token');
    localStorage.removeItem('enclos_ferme_id');
    localStorage.removeItem('enclos_ferme_nom');
  },

  async login({ username, password, nom_ferme }) {
    const payload = await request(`${AUTH_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (payload?.access) {
      this.setToken(payload.access);
      if (payload.refresh) localStorage.setItem('enclos_refresh_token', payload.refresh);

      // Sélectionner la ferme correspondant au nom saisi
      if (nom_ferme && nom_ferme.trim()) {
        try {
          const farms = await request(`${API_BASE}/api/fermes/`, {
            method: 'GET',
            token: payload.access,
          });
          const list = Array.isArray(farms) ? farms : [];
          const match = list.find(f => f.nom.trim().toLowerCase() === nom_ferme.trim().toLowerCase());
          const chosen = match || list[0];
          if (chosen) {
            this.setActiveFarm(chosen.id, chosen.nom);
          }
        } catch (_) {
          // Ne pas bloquer la connexion si la récupération des fermes échoue
        }
      } else {
        // Pas de nom de ferme précisé → prendre la première ferme
        try {
          const farms = await request(`${API_BASE}/api/fermes/`, {
            method: 'GET',
            token: payload.access,
          });
          const list = Array.isArray(farms) ? farms : [];
          if (list[0]) this.setActiveFarm(list[0].id, list[0].nom);
        } catch (_) {}
      }
    }

    return payload;
  },

  async register(payload) {
    return request(`${AUTH_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async createFarm(payload) {
    return request(`${API_BASE}/api/fermes/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getFarms() {
    return request(`${API_BASE}/api/fermes/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async getPlans() {
    return request(`${PLANS_URL}/`);
  },

  async getPlan(id) {
    return request(`${PLANS_URL}/${id}/`);
  },

  async getSubscriptions() {
    return request(`${SUBSCRIPTIONS_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async getActiveSubscription() {
    return request(`${SUBSCRIPTIONS_URL}/active/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createPaydunyaCheckout(payload) {
    return request(`${SUBSCRIPTIONS_URL}/paydunya/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async confirmPaydunya(token) {
    return request(`${SUBSCRIPTIONS_URL}/confirm-paydunya/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify({ token }),
    });
  },

  async createSubscription(payload) {
    return request(`${SUBSCRIPTIONS_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateSubscription(id, payload) {
    return request(`${SUBSCRIPTIONS_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getAnimals() {
    return request(`${MONCHEPTEL_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async getRaces(espece = null) {
    const url = espece
      ? `${RACES_URL}/?espece=${encodeURIComponent(espece)}`
      : `${RACES_URL}/`;
    return request(url, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createRace(payload) {
    return request(`${RACES_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateRace(id, payload) {
    return request(`${RACES_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteRace(id) {
    return request(`${RACES_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async createAnimal(payload) {
    return request(`${MONCHEPTEL_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getAnimal(id) {
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async updateAnimal(id, payload) {
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteAnimal(id) {
    return request(`${MONCHEPTEL_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async getAlimentations() {
    return request(`${ALIMENTATION_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createAlimentation(payload) {
    return request(`${ALIMENTATION_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  /* ── Types d'aliment ── */
  async getTypeAliments() {
    return request(`${TYPE_ALIMENT_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createTypeAliment(payload) {
    return request(`${TYPE_ALIMENT_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateTypeAliment(id, payload) {
    return request(`${TYPE_ALIMENT_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteTypeAliment(id) {
    return request(`${TYPE_ALIMENT_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  /* ── Fréquences d'alimentation ── */
  async getFrequences() {
    return request(`${FREQUENCE_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createFrequence(payload) {
    return request(`${FREQUENCE_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateFrequence(id, payload) {
    return request(`${FREQUENCE_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteFrequence(id) {
    return request(`${FREQUENCE_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async getAlimentation(id) {
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async updateAlimentation(id, payload) {
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteAlimentation(id) {
    return request(`${ALIMENTATION_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async getHistorique() {
    return request(`${HISTORIQUE_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createHistorique(payload) {
    return request(`${HISTORIQUE_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getGestations() {
    return request(`${GESTATION_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createGestation(payload) {
    return request(`${GESTATION_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getGestation(id) {
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async updateGestation(id, payload) {
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteGestation(id) {
    return request(`${GESTATION_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async getSante(id = null) {
    const url = id ? `${SANTE_URL}/${id}/` : `${SANTE_URL}/`;
    return request(url, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async getSuiviSanteOuvert(animalId) {
    const data = await request(`${SANTE_URL}/?animal=${animalId}`, {
      method: 'GET',
      token: getStoredToken(),
    });
    const list = Array.isArray(data) ? data : (data?.results || []);
    return list.find((s) => {
      const statut = (s.statut || '').toLowerCase();
      return statut !== 'guéri' && statut !== 'gueri' && !s.date_fin;
    }) || null;
  },

  async getSanteById(id) {
    return request(`${SANTE_URL}/${id}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async createSante(payload) {
    return request(`${SANTE_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async updateSante(id, payload) {
    return request(`${SANTE_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async deleteSante(id) {
    return request(`${SANTE_URL}/${id}/`, {
      method: 'DELETE',
      token: getStoredToken(),
    });
  },

  async getAlertes() {
    return request(`${ALERTES_URL}/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async updateAlerte(id, payload) {
    return request(`${ALERTES_URL}/${id}/`, {
      method: 'PATCH',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getPredictions(animalId = null) {
    const suffix = animalId ? `/?animal=${encodeURIComponent(animalId)}` : '/';
    return request(`${IA_URL}/predictions${suffix}`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },

  async predireAnimal({ animal_id, alimentation_id = null }) {
    return request(`${IA_URL}/predire/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify({ animal_id, alimentation_id, declencheur: 'manuel' }),
    });
  },

  async createAlerte(payload) {
    return request(`${ALERTES_URL}/`, {
      method: 'POST',
      token: getStoredToken(),
      body: JSON.stringify(payload),
    });
  },

  async getCurrentUser() {
    return request(`${AUTH_URL}/users/me/`, {
      method: 'GET',
      token: getStoredToken(),
    });
  },
};

export default api;
