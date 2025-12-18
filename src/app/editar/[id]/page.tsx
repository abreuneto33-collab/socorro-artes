'use client'
import { useEffect, useState, use } from 'react' // Adicionei 'use' aqui
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Trash2, Image as ImageIcon, X } from 'lucide-react'

// Ajuste para Next.js 15/16: params é uma Promise
export default function EditOrder({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  
  // Desembrulha o ID da URL (obrigatório no Next.js novo)
  const { id } = use(params)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<any>({
    client_name: '', total_price: 0, down_payment: 0, 
    images: []
  })

  useEffect(() => {
    async function fetchOrder() {
      // Busca o pedido usando o ID
      const { data } = await supabase.from('orders').select('*').eq('id', id).single()
      if (data) setFormData(data)
    }
    if (id) fetchOrder()
  }, [id])

  // Função de Upload de Imagem
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage.from('encomendas').upload(filePath, file)

    if (uploadError) {
      alert('Erro ao subir imagem: ' + uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('encomendas').getPublicUrl(filePath)
      
      setFormData((prev: any) => ({
        ...prev,
        images: [...(prev.images || []), publicUrl]
      }))
    }
    setUploading(false)
  }

  const removeImage = (urlToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((url: string) => url !== urlToRemove)
    }))
  }

  const handleDelete = async () => {
    if(!confirm("Tem certeza que quer EXCLUIR este pedido para sempre?")) return;
    await supabase.from('orders').delete().eq('id', id)
    router.push('/')
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('orders').update(formData).eq('id', id)
    if (!error) {
        alert('Alterações salvas!')
        router.back()
    } else {
        alert('Erro ao salvar: ' + error.message)
    }
    setLoading(false)
  }

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })

  if (!formData.client_name) return <div className="p-10 text-center">Carregando pedido...</div>

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft /></button>
        <h2 className="text-2xl font-bold">Editar Pedido</h2>
        <button onClick={handleDelete} className="text-red-600 p-2 hover:bg-red-50 rounded transition-colors"><Trash2 /></button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="text-sm font-bold text-gray-700">Cliente</label>
             <input value={formData.client_name} name="client_name" onChange={handleChange} className="w-full p-3 border rounded-lg outline-none focus:border-fuchsia-500" />
          </div>
          <div>
             <label className="text-sm font-bold text-gray-700">Contato</label>
             <input value={formData.client_contact || ''} name="client_contact" onChange={handleChange} className="w-full p-3 border rounded-lg outline-none focus:border-fuchsia-500" />
          </div>
        </div>

        <div>
            <label className="text-sm font-bold text-gray-700">Descrição</label>
            <input value={formData.description} name="description" onChange={handleChange} className="w-full p-3 border rounded-lg outline-none focus:border-fuchsia-500" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="text-sm font-bold text-gray-700">Entrega</label>
              <input type="date" value={formData.delivery_date} name="delivery_date" onChange={handleChange} className="w-full p-3 border rounded-lg outline-none" />
           </div>
           <div>
              <label className="text-sm font-bold text-gray-700">Prioridade</label>
              <select value={formData.priority} name="priority" onChange={handleChange} className="w-full p-3 border rounded-lg bg-white outline-none">
                  <option value="normal">Normal</option>
                  <option value="alta">ALTA</option>
              </select>
           </div>
        </div>

        {/* Área de Imagens */}
        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
           <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><ImageIcon size={18}/> Fotos do Pedido</h3>
           
           <div className="flex flex-wrap gap-4 mb-4">
              {formData.images && formData.images.map((url: string, index: number) => (
                  <div key={index} className="relative group w-24 h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Foto" className="w-full h-full object-cover rounded-lg border" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700">
                        <X size={12} />
                      </button>
                  </div>
              ))}
           </div>

           <label className="cursor-pointer bg-fuchsia-100 text-fuchsia-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-200 transition inline-block">
              {uploading ? 'Enviando...' : '+ Adicionar Foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
           </label>
        </div>

        <button disabled={loading} className="w-full bg-fuchsia-800 text-white font-bold py-4 rounded-xl flex justify-center gap-2 hover:bg-fuchsia-900 shadow-lg">
          <Save /> {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  )
}