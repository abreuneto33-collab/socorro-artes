'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, Plus, Trash2 } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '', base_price: '' })

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
  }

  async function addProduct(e: any) {
    e.preventDefault()
    await supabase.from('products').insert([{ ...form, base_price: parseFloat(form.base_price) }])
    setForm({ name: '', description: '', base_price: '' })
    fetchProducts()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2>
      
      <form onSubmit={addProduct} className="bg-white p-6 rounded-xl shadow border space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-2 border rounded w-full" placeholder="Nome do Produto" />
          <input required type="number" step="0.01" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} className="p-2 border rounded w-full" placeholder="Preço Base (R$)" />
        </div>
        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-2 border rounded w-full" placeholder="Descrição dos materiais usados..." />
        <button className="w-full bg-gray-900 text-white p-3 rounded font-bold">Cadastrar Produto</button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow border flex justify-between items-start">
             <div>
               <h3 className="font-bold text-lg">{p.name}</h3>
               <p className="text-sm text-gray-500 mb-2">{p.description}</p>
               <span className="bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded text-sm font-bold">Base: R$ {p.base_price.toFixed(2)}</span>
             </div>
             <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('products').delete().eq('id', p.id); fetchProducts() } }} className="text-red-400"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}