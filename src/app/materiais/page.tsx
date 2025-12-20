'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Plus, DollarSign } from 'lucide-react'

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', cost: '', supplier: '' })

  useEffect(() => { fetchMaterials() }, [])

  async function fetchMaterials() {
    const { data } = await supabase.from('materials').select('*').order('name')
    if (data) setMaterials(data)
  }

  async function addMaterial(e: any) {
    e.preventDefault()
    await supabase.from('materials').insert([{ ...form, cost: parseFloat(form.cost) }])
    setForm({ name: '', cost: '', supplier: '' })
    fetchMaterials()
  }

  async function deleteMaterial(id: string) {
    if(confirm('Apagar material?')) {
      await supabase.from('materials').delete().eq('id', id)
      fetchMaterials()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Meus Materiais de Trabalho</h2>
      
      {/* Formulário Rápido */}
      <form onSubmit={addMaterial} className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-bold text-gray-600">Nome do Material</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Ex: Linha Anne Branca" />
        </div>
        <div className="w-32">
          <label className="text-sm font-bold text-gray-600">Custo (R$)</label>
          <input required type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} className="w-full p-2 border rounded" placeholder="0.00" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-sm font-bold text-gray-600">Loja/Fornecedor</label>
          <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full p-2 border rounded" placeholder="Ex: Armarinho Central" />
        </div>
        <button className="bg-fuchsia-700 text-white p-3 rounded hover:bg-fuchsia-800"><Plus /></button>
      </form>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {materials.map(m => (
          <div key={m.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50">
             <div>
               <p className="font-bold text-gray-900">{m.name}</p>
               <p className="text-sm text-gray-500">{m.supplier || 'Sem fornecedor'}</p>
             </div>
             <div className="flex items-center gap-4">
               <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">R$ {m.cost.toFixed(2)}</span>
               <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}