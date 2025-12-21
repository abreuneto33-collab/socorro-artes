'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  // Estado para zoom na imagem
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', description: '', base_price: '', image_url: '' })
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
  }

  // Upload da Foto do Produto
  async function handleImageUpload(e: any) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `prod_${Date.now()}.${file.name.split('.').pop()}`
    
    const { error } = await supabase.storage.from('encomendas').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('encomendas').getPublicUrl(fileName)
      setForm({ ...form, image_url: publicUrl })
    }
    setUploading(false)
  }

  async function addProduct(e: any) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('products').insert([{ 
      name: form.name, 
      description: form.description, 
      base_price: parseFloat(form.base_price),
      image_url: form.image_url 
    }])
    setForm({ name: '', description: '', base_price: '', image_url: '' })
    fetchProducts()
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if(confirm('Tem certeza que deseja apagar este produto?')) {
      await supabase.from('products').delete().eq('id', id)
      fetchProducts()
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <Package className="text-fuchsia-700" /> Catálogo de Produtos
      </h2>
      
      {/* Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-100 mb-8">
        <h3 className="font-bold text-lg mb-4 text-gray-700">Adicionar Novo Produto</h3>
        <form onSubmit={addProduct} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Área da Foto */}
            <div className="w-full md:w-40 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
               {form.image_url ? (
                 <>
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                   <button type="button" onClick={() => setForm({...form, image_url: ''})} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><X size={12}/></button>
                 </>
               ) : (
                 <label className="cursor-pointer text-center text-xs text-gray-500 w-full h-full flex flex-col items-center justify-center hover:bg-gray-200">
                    <ImageIcon size={24} className="mb-1" />
                    {uploading ? 'Enviando...' : 'Add Foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               )}
            </div>

            <div className="flex-1 space-y-4">
               <div className="grid md:grid-cols-2 gap-4">
                 <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-3 border rounded-lg w-full outline-none focus:border-fuchsia-500" placeholder="Nome do Produto" />
                 <input required type="number" step="0.01" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} className="p-3 border rounded-lg w-full outline-none focus:border-fuchsia-500" placeholder="Preço Base (R$)" />
               </div>
               <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-3 border rounded-lg w-full h-20 outline-none focus:border-fuchsia-500" placeholder="Descrição, materiais usados..." />
            </div>
          </div>
          
          <button disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all">
            {loading ? 'Salvando...' : 'Cadastrar Produto'}
          </button>
        </form>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all flex flex-col overflow-hidden group">
             <div className="h-48 bg-gray-100 relative cursor-pointer" onClick={() => setZoomImage(p.image_url)}>
               {p.image_url ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={40} /></div>
               )}
             </div>
             
             <div className="p-4 flex-1 flex flex-col justify-between">
               <div>
                 <h3 className="font-bold text-gray-900 truncate" title={p.name}>{p.name}</h3>
                 <p className="text-xs text-gray-500 line-clamp-2 mt-1 h-8">{p.description}</p>
               </div>
               
               <div className="mt-4 flex justify-between items-center border-t pt-3">
                 <span className="font-extrabold text-fuchsia-700 text-lg">R$ {p.base_price.toFixed(2)}</span>
                 <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Modal de Zoom */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImage} className="max-w-full max-h-full rounded shadow-2xl" alt="Zoom" />
          <button className="absolute top-5 right-5 text-white bg-gray-800 rounded-full p-2"><X /></button>
        </div>
      )}
    </div>
  )
}