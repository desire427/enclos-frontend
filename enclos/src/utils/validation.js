const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u;
const TEXT_PATTERN = /^[^<>]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^(?:7[05678]\d{7}|[235]\d{8})$/;
const GPS_PATTERN = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

export function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function required(value, label) {
  return clean(value) ? '' : `${label} est obligatoire.`;
}

export function validateName(value, label = 'Le nom', { optional = false, min = 3, max = 100 } = {}) {
  const normalized = clean(value);
  if (!normalized && optional) return '';
  if (!normalized) return `${label} est obligatoire.`;
  if (normalized.length < min) return `${label} doit contenir au moins ${min} caractères.`;
  if (normalized.length > max) return `${label} ne doit pas dépasser ${max} caractères.`;
  if (!NAME_PATTERN.test(normalized)) return `${label} doit commencer par une lettre et ne contenir que des lettres, espaces, apostrophes ou tirets.`;
  if (/^(.)\1+$/.test(normalized.replace(/\s/g, '').toLowerCase())) return `${label} contient une répétition invalide.`;
  return '';
}

export function validateText(value, label, { optional = false, min = 1, max = 500 } = {}) {
  const normalized = clean(value);
  if (!normalized && optional) return '';
  if (!normalized) return `${label} est obligatoire.`;
  if (normalized.length < min) return `${label} doit contenir au moins ${min} caractères.`;
  if (normalized.length > max) return `${label} ne doit pas dépasser ${max} caractères.`;
  if (!TEXT_PATTERN.test(normalized) || Array.from(normalized).some(character => {
    const code = character.charCodeAt(0);
    return (code >= 0 && code <= 31) || code === 127;
  })) return `${label} contient des caractères interdits.`;
  return '';
}

export function validateEmail(value) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return "L'adresse email est obligatoire.";
  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) return 'Veuillez saisir une adresse email valide.';
  return '';
}

export function validatePhone(value) {
  const digits = String(value).replace(/[\s.-]/g, '');
  const normalized = digits.startsWith('+221') ? digits.slice(4) : digits;
  if (!normalized) return 'Le numéro de téléphone est obligatoire.';
  if (!PHONE_PATTERN.test(normalized)) return 'Veuillez saisir un numéro sénégalais valide à 9 chiffres.';
  return '';
}

export function validatePassword(value, label = 'Le mot de passe') {
  if (!value) return `${label} est obligatoire.`;
  if (value.length < 8) return `${label} doit contenir au moins 8 caractères.`;
  if (value.length > 128) return `${label} ne doit pas dépasser 128 caractères.`;
  if (/\s/.test(value)) return `${label} ne doit pas contenir d'espace.`;
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z\d]/.test(value)) {
    return `${label} doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.`;
  }
  if (/password|azerty|12345678/i.test(value)) return `${label} est trop prévisible.`;
  return '';
}

export function validateNumber(value, label, { optional = false, min = 0, max = 1000000, decimals = 2, positive = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw && optional) return '';
  if (!raw) return `${label} est obligatoire.`;
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return `${label} doit être un nombre valide.`;
  const number = Number(raw);
  if (!Number.isFinite(number)) return `${label} doit être un nombre valide.`;
  if (positive ? number <= 0 : number < min) return positive ? `${label} doit être supérieur à zéro.` : `${label} ne peut pas être inférieur à ${min}.`;
  if (number > max) return `${label} ne peut pas dépasser ${max}.`;
  if ((raw.split('.')[1] || '').length > decimals) return `${label} ne peut pas avoir plus de ${decimals} décimales.`;
  return '';
}

export function validateDate(value, label, { optional = false, notFuture = false } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw && optional) return '';
  if (!raw) return `${label} est obligatoire.`;
  const date = new Date(`${raw}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime())) return `${label} est invalide.`;
  if (notFuture && date > new Date()) return `${label} ne peut pas être dans le futur.`;
  return '';
}

export function validateSelect(value, label, options, { optional = false } = {}) {
  if (!value && optional) return '';
  if (!value) return `${label} est obligatoire.`;
  return options && !options.includes(value) ? `${label} sélectionné est invalide.` : '';
}

export function validateGps(value, { optional = true } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw && optional) return '';
  const match = raw.match(GPS_PATTERN);
  if (!match || Number(match[1]) < -90 || Number(match[1]) > 90 || Number(match[2]) < -180 || Number(match[2]) > 180) return 'Les coordonnées GPS doivent être au format latitude, longitude valide.';
  return '';
}

export function firstError(errors) {
  return Object.values(errors).find(Boolean) || '';
}

export function validateRegistration(values) {
  const errors = {
    nom: validateName(values.nom, 'Le nom complet', { min: 3, max: 100 }),
    email: validateEmail(values.email),
    telephone: validatePhone(values.telephone),
    motDePasse: validatePassword(values.motDePasse),
    nomFerme: validateName(values.nomFerme, 'Le nom de la ferme', { min: 3, max: 100 }),
    localisation: validateText(values.localisation, 'La localisation', { min: 2, max: 150 }),
    superficie: validateNumber(values.superficie, 'La superficie', { optional: true, min: 0, max: 100000, decimals: 2 }),
    coordGPS: validateGps(values.coordGPS),
    description: validateText(values.description, 'La description', { optional: true, max: 1000 }),
    conditions: values.conditions ? '' : 'Veuillez accepter les conditions d’utilisation.',
    plan: values.selectedPlan ? '' : 'Veuillez sélectionner un forfait.',
  };
  return { errors, message: firstError(errors) };
}

export function validateLogin(values) {
  const errors = {
    username: validateText(values.username, "Le nom d'utilisateur", { min: 2, max: 150 }),
    farmName: validateName(values.farmName, 'Le nom de la ferme', { min: 3, max: 100 }),
    password: required(values.password, 'Le mot de passe'),
  };
  return { errors, message: firstError(errors) };
}

export function validatePayment(values) {
  const errors = {
    phone: values.paymentType === 'mobile' ? validatePhone(values.phone) : '',
    plan: values.planId ? '' : 'Aucun forfait valide sélectionné.',
    cardNumber: values.paymentType === 'card' && !/^\d{16}$/.test(String(values.cardNumber || '').replace(/\s/g, '')) ? 'Le numéro de carte doit contenir 16 chiffres.' : '',
    expiry: values.paymentType === 'card' && !/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(String(values.expiry || '').trim()) ? "La date d'expiration doit être au format MM / AA." : '',
    cvv: values.paymentType === 'card' && !/^\d{3,4}$/.test(String(values.cvv || '').trim()) ? 'Le CVV doit contenir 3 ou 4 chiffres.' : '',
  };
  return { errors, message: firstError(errors) };
}

export function validateAlimentation(values) {
  const errors = {
    animal: validateSelect(values.animal, "L'animal"),
    typeAliment: validateSelect(values.typeAliment, "Le type d'aliment"),
    frequence: validateSelect(values.frequence, 'La fréquence'),
    quantite: validateNumber(values.quantite, 'La quantité', { min: 0, positive: true, max: 100000, decimals: 2 }),
    date: validateDate(values.date, 'La date', { notFuture: true }),
    note: validateText(values.note, 'La note', { optional: true, max: 1000 }),
  };
  return { errors, message: firstError(errors) };
}

export function validateAnimal(values) {
  const errors = {
    nom: validateName(values.nom, "Le nom de l'animal", { optional: true, min: 2, max: 100 }),
    espece: validateSelect(values.espece, "L'espèce", ['bovin', 'ovin', 'caprin', 'porcin']),
    sexe: validateSelect(values.sexe, 'Le sexe', ['femelle', 'male']),
    dateNaissance: validateDate(values.dateNaissance, 'La date de naissance', { optional: true, notFuture: true }),
    poids: validateNumber(values.poids, 'Le poids', { optional: true, min: 0, max: 10000, decimals: 2 }),
    couleur: validateText(values.couleur, 'La couleur', { optional: true, min: 2, max: 100 }),
    observations: validateText(values.observations, 'Les observations', { optional: true, max: 2000 }),
  };
  return { errors, message: firstError(errors) };
}

export function validateGestation(values, isNew = true) {
  const errors = {
    animal: isNew ? validateSelect(values.animalId, "L'animal") : '',
    statut: validateSelect(values.statut, 'Le statut', ['En cours', 'Imminente', 'Terminée']),
    dateDebut: validateDate(values.dateDebut, 'La date de saillie', { notFuture: true }),
    datePrevue: validateDate(values.datePrevue, 'La date prévue'),
    dateMiseBas: validateDate(values.dateMiseBas, 'La date de mise bas', { optional: true }),
    dureeJours: validateNumber(values.dureeJours, 'La durée', { optional: true, min: 1, max: 1000, decimals: 0 }),
    nombreNaissances: validateNumber(values.nombreNaissances, 'Le nombre de naissances', { optional: true, min: 0, max: 1000, decimals: 0 }),
    note: validateText(values.note, 'La note', { optional: true, max: 2000 }),
  };
  if (!errors.dateDebut && !errors.datePrevue && values.datePrevue < values.dateDebut) errors.datePrevue = 'La date prévue doit être postérieure à la date de saillie.';
  if (!errors.dateMiseBas && values.dateMiseBas && values.dateMiseBas < values.dateDebut) errors.dateMiseBas = 'La date de mise bas doit être postérieure à la date de saillie.';
  return { errors, message: firstError(errors) };
}

export function validateSante(values, isNew = true) {
  const errors = {
    animal: isNew ? validateSelect(values.animalId, "L'animal") : '',
    statut: validateSelect(values.statut, 'Le statut', ['Malade', 'En traitement', 'Guéri', 'Sous surveillance']),
    dateDebut: validateDate(values.dateDebut, 'La date de début', { notFuture: true }),
    dateProchain: validateDate(values.dateProchain, 'La prochaine consultation', { optional: true }),
    poidsKg: validateNumber(values.poidsKg, 'Le poids', { optional: true, min: 0, max: 10000, decimals: 2 }),
    temperature: validateNumber(values.temperature, 'La température', { optional: true, min: 20, max: 50, decimals: 2 }),
    frequenceCardiaque: validateNumber(values.frequenceCardiaque, 'La fréquence cardiaque', { optional: true, min: 1, max: 500, decimals: 0 }),
    note: validateText(values.note, 'La note', { optional: true, max: 2000 }),
  };
  if (!errors.dateProchain && values.dateProchain && values.dateProchain < values.dateDebut) errors.dateProchain = 'La prochaine consultation doit être postérieure à la date de début.';
  return { errors, message: firstError(errors) };
}

export function validateFarm(values) {
  const errors = {
    nom: validateName(values.nom, 'Le nom de la ferme', { min: 3, max: 100 }),
    localisation: validateText(values.localisation, 'La localisation', { min: 2, max: 150 }),
    superficie: validateNumber(values.superficie, 'La superficie', { min: 0, max: 100000, decimals: 2 }),
    description: validateText(values.description, 'La description', { optional: true, max: 1000 }),
    coordonneesGPS: validateGps(values.coordonneesGPS),
  };
  return { errors, message: firstError(errors) };
}

export function validateSimpleRecord(nom, description) {
  const errors = {
    nom: validateName(nom, 'Le nom', { min: 3, max: 100 }),
    description: validateText(description, 'La description', { optional: true, max: 1000 }),
  };
  return { errors, message: firstError(errors) };
}
