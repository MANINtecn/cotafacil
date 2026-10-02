import React, { useState } from 'react';
import { Vendor } from '../types';
import { Building2, Plus, Trash2, Edit2, X, CheckCircle2, Phone, Truck, DollarSign } from 'lucide-react';
import { formatCurrencyBRL, sanitizeCurrencyInput, parseCurrencyValue } from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id' | 'hasViewed'>) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
}

export const ManageVendorsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [minOrderStr, setMinOrderStr] = useState('500,00');
  const [deliveryDays, setDeliveryDays] = useState('Entrega em 24h');
  const [city, setCity] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingVendorId(null);
    setCompany('');
    setName('');
    setPhone('');
    setMinOrderStr('500,00');
    setDeliveryDays('Entrega em 24h');
    setCity('');
    setIsFormOpen(true);
  };

  const handleStartEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setCompany(vendor.company);
    setName(vendor.name);
    setPhone(vendor.phone || '');
    setMinOrderStr(vendor.minOrderValue ? vendor.minOrderValue.toFixed(2).replace('.', ',') : '0,00');
    setDeliveryDays(vendor.deliveryDays || 'Entrega em 24h');
    setCity(vendor.city || '');
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingVendorId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !name.trim()) return;

    const validMin = parseCurrencyValue(minOrderStr);

    if (editingVendorId) {
      const existing = vendors.find((v) => v.id === editingVendorId);
      onUpdateVendor({
        id: editingVendorId,
        company: company.trim(),
        name: name.trim(),
        phone: phone.trim() || '(11) 99999-9999',
        minOrderValue: validMin,
        deliveryDays: deliveryDays.trim() || 'Entrega em 24h',
        city: city.trim() || 'São Paulo - SP',
        hasViewed: existing ? existing.hasViewed : false,
      });
    } else {
      onAddVendor({
        company: company.trim(),
        name: name.trim(),
        phone: phone.trim() || '(11) 99999-9999',
        minOrderValue: validMin,
        deliveryDays: deliveryDays.trim() || 'Entrega em 24h',
        city: city.trim() || 'São Paulo - SP',
      });
    }

    setIsFormOpen(false);
    setEditingVendorId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-neutral-200 shadow-2xl my-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Meus Fornecedores & Representantes
              </h3>
              <p className="text-[11px] text-neutral-500">
                Cadastre e edite seus fornecedores habituais com contato de WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-base font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toggle add button - only ONE plus icon, no extra plus in text */}
        {!isFormOpen ? (
          <button
            type="button"
            onClick={handleStartAdd}
            className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-neutral-50/50"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Fornecedor</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                {editingVendorId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700">Empresa / Distribuidora *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nome da Distribuidora ou Fornecedor"
                  required
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700">Nome do Contato / Representante *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do representante"
                  required
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700">WhatsApp (com DDD) *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98451-2210"
                  required
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700">Pedido Mínimo (R$)</label>
                <input
                  type="text"
                  value={minOrderStr}
                  onChange={(e) => setMinOrderStr(sanitizeCurrencyInput(e.target.value))}
                  placeholder="500,00"
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs font-mono-num font-bold text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700">Prazo Entrega</label>
                <input
                  type="text"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="Ex: 24h ou 2 dias"
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {editingVendorId ? 'Salvar Alterações do Fornecedor' : 'Cadastrar Fornecedor'}
            </button>
          </form>
        )}

        {/* Vendors list with Edit & Delete actions */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {vendors.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
              Nenhum fornecedor cadastrado ainda. Cadastre seus fornecedores acima para iniciar suas cotações.
            </div>
          ) : (
            vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="p-3.5 rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 bg-white flex items-center justify-between gap-3 shadow-2xs text-xs transition-colors"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="font-bold text-neutral-900 truncate">{vendor.company}</div>
                  <div className="text-neutral-500 flex flex-wrap items-center gap-2 text-[11px]">
                    <span>Contato: <strong className="text-neutral-700">{vendor.name}</strong></span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">{vendor.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono-num">
                    Pedido Mínimo: <strong className="text-neutral-800">{formatCurrencyBRL(vendor.minOrderValue)}</strong> • {vendor.deliveryDays || '24h'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(vendor)}
                    className="p-2 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                    title="Editar fornecedor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteVendor(vendor.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Excluir fornecedor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
