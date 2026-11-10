"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, ShieldAlert, Eye, EyeOff, Lock, Check, AlertCircle } from "lucide-react";
import { fetchVaultSecrets, createVaultSecret, deleteVaultSecret } from "../../lib/api";
import { VaultSecret } from "../../lib/types";

export const VaultCard: React.FC = () => {
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [showValue, setShowValue] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSecrets = async () => {
    setLoading(true);
    const data = await fetchVaultSecrets();
    setSecrets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) {
      setError("Variable name and secret value are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await createVaultSecret(name.trim(), value.trim());
    setSubmitting(false);
    if (ok) {
      setName("");
      setValue("");
      setShowAddForm(false);
      await loadSecrets();
    } else {
      setError("Failed to encrypt and store secret. Ensure name is valid alphanumeric identifier.");
    }
  };

  const handleDelete = async (secretName: string) => {
    if (!confirm(`Delete secret ${secretName}? This cannot be undone.`)) return;
    const ok = await deleteVaultSecret(secretName);
    if (ok) {
      await loadSecrets();
    }
  };

  return (
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-[#00EC97]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Sovereign Secrets Vault
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#00EC97]/10 text-[#00EC97] px-2 py-0.5 rounded border border-[#00EC97]/20">
            Runtime Injection Only
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2 py-1 bg-[#14171E] hover:bg-[#1E222A] border border-[#1E222A] text-[#EDEDEF] text-[11px] rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-[#00EC97]" />
            <span>Add Secret</span>
          </button>
        </div>
      </div>

      <div className="bg-[#090A0D] border border-[#1E222A] rounded p-2 text-[10px] text-[#7E8492] flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-[#00EC97] shrink-0 mt-0.5" />
        <span className="leading-tight">
          Secrets are encrypted at rest with Fernet PBKDF2. Decrypted values are strictly injected into subprocess <code className="text-[#EDEDEF]">os.environ</code> at execution time and <span className="text-[#00EC97]">never exposed to LLM prompt context</span>. Terminal logs are stream-redacted.
        </span>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#090A0D] border border-[#00EC97]/30 rounded p-3 flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold text-[#EDEDEF] flex items-center justify-between">
            <span>Store New Runtime Secret</span>
            <span className="text-[10px] text-[#7E8492]">AES-256 Encrypted</span>
          </div>

          {error && (
            <div className="text-[10px] text-[#FF4B4B] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-[10px] text-[#7E8492] uppercase tracking-wider block mb-1">
                Environment Variable Name
              </label>
              <input
                type="text"
                placeholder="e.g. GITHUB_TOKEN, PRIVATE_RPC_KEY"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                className="w-full bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#7E8492] uppercase tracking-wider block mb-1">
                Secret Value
              </label>
              <div className="relative">
                <input
                  type={showValue ? "text" : "password"}
                  placeholder="Enter secret value..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-2 top-2 text-[#7E8492] hover:text-[#EDEDEF]"
                >
                  {showValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-[11px] text-[#7E8492] hover:text-[#EDEDEF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 bg-[#00EC97] hover:bg-[#00EC97]/90 text-[#090A0D] text-[11px] font-semibold rounded flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>{submitting ? "Encrypting..." : "Save to Vault"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Secrets List */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48">
        {loading ? (
          <div className="text-[11px] text-[#7E8492] py-2 text-center">Loading vault keychain...</div>
        ) : secrets.length === 0 ? (
          <div className="text-[11px] text-[#7E8492] py-3 text-center border border-dashed border-[#1E222A] rounded">
            No custom runtime secrets stored yet. Click "Add Secret" to add keys.
          </div>
        ) : (
          secrets.map((sec) => (
            <div
              key={sec.name}
              className="bg-[#090A0D] border border-[#1A1D24] hover:border-[#1E222A] rounded p-2 flex items-center justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-[#EDEDEF] tracking-wide">
                  ${sec.name}
                </span>
                <span className="text-[10px] text-[#7E8492]">
                  Value: <span className="text-[#00EC97] font-mono tracking-widest">{sec.masked_preview}</span> • Stored: {sec.created_at.slice(0, 10)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(sec.name)}
                className="p-1 text-[#7E8492] hover:text-[#FF4B4B] hover:bg-[#FF4B4B]/10 rounded transition-colors"
                title={`Delete ${sec.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
