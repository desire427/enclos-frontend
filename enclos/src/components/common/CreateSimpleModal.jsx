/**
 * Modal générique pour créer un enregistrement simple (nom + description).
 * Utilisée pour TypeAliment, FrequenceAlimentation, etc.
 *
 * Props :
 *   open       — boolean
 *   onClose    — fn()
 *   title      — ex: "Créer un type d'aliment"
 *   label      — ex: "Type d'aliment" (pour le label du champ)
 *   placeholder — ex: "Ex: Foin de luzerne"
 *   onConfirm  — async fn(nom, description) → throws on error
 */
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { clean, validateSimpleRecord } from '../../utils/validation';

const inputCls = 'h-11 w-full rounded-lg border border-[#E5E5E3] bg-white px-3 text-[13px] text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors';

export default function CreateSimpleModal({ open, onClose, title, label, placeholder, onConfirm }) {
  const [nom,         setNom]         = useState('');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  if (!open) return null;

  function reset() {
    setNom('');
    setDescription('');
    setError('');
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validateSimpleRecord(nom, description);
    if (validation.message) { setError(validation.message); return; }
    setError('');
    try {
      setSaving(true);
      await onConfirm(clean(nom), clean(description));
      reset();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E5E3] shadow-xl w-full max-w-[420px]">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
              <h3 className="font-serif text-[17px] font-medium text-[#171310]">{title}</h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F4F2] transition-colors"
              >
                <X className="w-4 h-4 text-[#171310]/60" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-red-600 text-[12px]">{error}</p>}

              <div>
                <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  disabled={saving}
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#171310] mb-2">
                  Description <span className="text-[#171310]/40 font-normal">(optionnel)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Précisions supplémentaires…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={saving}
                  className="w-full resize-none rounded-lg border border-[#E5E5E3] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#171310] outline-none placeholder:text-[#171310]/40 focus:border-[#5C3A21] transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="h-9 rounded-lg border border-[#E5E5E3] bg-white px-4 text-[13px] font-medium text-[#171310] hover:bg-[#F5F4F2] transition-colors disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-lg bg-[#5C3A21] hover:bg-[#3B2313] disabled:opacity-60 text-white px-4 text-[13px] font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                {saving ? 'Création…' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
