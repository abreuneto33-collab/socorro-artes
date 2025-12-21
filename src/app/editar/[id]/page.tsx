'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Trash2, Image as ImageIcon, X, Plus, Calendar, Clock, DollarSign } from 'lucide-react'

export default function EditOrder({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params) // Next.js 16 Unwrap
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Estados separados para organizar
  const [order, setOrder] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      // 1. Busca Pedido + Cliente
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*, clients(*)')
        .eq('id', id)
        .single()
      
      if (error || !orderData) {
        alert('Pedido não encontrado.')
        router.push('/')
        return
      }

      setOrder(orderData)
      setClient(orderData.clients)

      // 2. Busca Itens
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)
      
      if (itemsData) setItems(itemsData)
      
      setLoading(false)
    }
    fetchData()
  }, [id, router])

  // Funções de Update locais
  const updateOrder = (field: string, value: any) => setOrder({ ...order, [field]: value })
  
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }
  
  const addItem = () => setItems([...items, { product_name: '', quantity: 1, unit_price: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  // Upload
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('encomendas').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('encomendas').getPublicUrl(fileName)
      setOrder((prev: any) => ({ ...prev, images: [...(prev.images || []), publicUrl] }))
    }
    setUploading(false)
  }

  // Salvar Geral
  const handleSave = async (e: any) => {
    e.preventDefault()
    setSaving(true)

    // Recalcula total
    const total = items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)

    // 1. Atualiza Pedido
    const { error } = await supabase.from('orders').update({
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time,
      priority: order.priority,
      observation: order.observation,
      down_payment: order.down_payment,
      total_price: total,
      images: order.images
    }).eq('id', id)

    if (error) { alert('Erro ao atualizar pedido'); setSaving(false); return }

    // 2. Atualiza Itens (Estratégia: Deleta todos e recria os atuais)
    await supabase.from('order_items').delete().eq('order_id', id)
    
    const itemsToSave = items.map(i => ({
      order_id: id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price
    }))
    await supabase.from('order_items').insert(itemsToSave)

    alert('Alterações salvas com sucesso!')
    setSaving(false)
  }

  if (loading) return <div className="p-20 text-center font-bold text-gray-500">Carregando detalhes...</div>

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft /></button>
        <h2 className="text-2xl font-extrabold text-gray-900">Detalhes & Edição</h2>
        <button onClick={async () => {if(confirm('Excluir?')) { await supabase.from('orders').delete().eq('id', id); router.push('/') }}} className="text-red-600 bg-red-50 px-3 py-2 rounded-lg font-bold hover:bg-red-100 flex items-center gap-2">
           <Trash2 size={18} /> Excluir
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card Cliente (Fixo) */}
        <div className="bg-fuchsia-50 p-6 rounded-xl border border-fuchsia-100">
           <h3 className="text-sm font-bold text-fuchsia-800 uppercase mb-2">Cliente</h3>
           <p className="text-2xl font-bold text-gray-900">{client?.name}</p>
           <p className="text-gray-600">{client?.contact}</p>
           <p className="text-gray-500 text-sm mt-1">{client?.address}</p>
        </div>

        {/* Card Itens */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Itens do Pedido</h3>
          {items.map((item, idx) => (
             <div key={idx} className="flex gap-2 mb-3 items-end">
               <div className="flex-1">
                 <label className="text-xs font-bold text-gray-500">Produto</label>
                 <input value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} className="w-full p-2 border rounded font-medium" />
               </div>
               <div className="w-20">
                 <label className="text-xs font-bold text-gray-500">Qtd</label>
                 <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full p-2 border rounded text-center" />
               </div>
               <div className="w-28">
                 <label className="text-xs font-bold text-gray-500">R$ Unit</label>
                 <input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-full p-2 border rounded" />
               </div>
               <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 mb-1"><Trash2 size={18}/></button>
             </div>
          ))}
          <button type="button" onClick={addItem} className="mt-2 text-sm font-bold text-fuchsia-700 flex items-center gap-1"><Plus size={16}/> Adicionar Item</button>
        </div>

        {/* Datas e Valores (Destaque) */}
        <div className="grid md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
               <Calendar size={20} /> Datas
             </div>
             <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-gray-500">Data de Entrega</label>
                 <input type="date" value={order.delivery_date} onChange={e => updateOrder('delivery_date', e.target.value)} className="w-full p-2 border rounded font-bold text-lg" />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500">Horário</label>
                 <input type="time" value={order.delivery_time || ''} onChange={e => updateOrder('delivery_time', e.target.value)} className="w-full p-2 border rounded" />
               </div>
             </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
               <DollarSign size={20} /> Financeiro
             </div>
             <div className="space-y-3">
               <div>
                 <label className="text-xs font-bold text-gray-500">Já Pagou (Sinal)</label>
                 <input type="number" value={order.down_payment} onChange={e => updateOrder('down_payment', e.target.value)} className="w-full p-2 border rounded" />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500">Prioridade</label>
                  <select value={order.priority} onChange={e => updateOrder('priority', e.target.value)} className={`w-full p-2 border rounded font-bold ${order.priority === 'alta' ? 'text-red-600 bg-red-50' : 'text-gray-700'}`}>
                    <option value="normal">Normal</option>
                    <option value="alta">ALTA URGÊNCIA</option>
                  </select>
               </div>
             </div>
           </div>
        </div>

        {/* Imagens e Obs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <label className="font-bold text-gray-700 mb-2 block">Observações</label>
           <textarea value={order.observation || ''} onChange={e => updateOrder('observation', e.target.value)} className="w-full p-3 border rounded h-24 mb-6" />

           <label className="font-bold text-gray-700 mb-2 block">Imagens Anexadas</label>
           <div className="flex flex-wrap gap-4 mb-4">
              {order.images?.map((url: string, i: number) => (
                <div key={i} className="relative w-24 h-24 cursor-pointer group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="anexo" className="w-full h-full object-cover rounded border" onClick={() => setZoomImage(url)} />
                  <button type="button" onClick={() => updateOrder('images', order.images.filter((x:string) => x !== url))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow"><X size={12}/></button>
                </div>
              ))}
              
              <label className="cursor-pointer w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded hover:bg-gray-50">
                 <ImageIcon className="text-gray-400 mb-1" />
                 <span className="text-xs text-gray-500">{uploading ? '...' : '+ Foto'}</span>
                 <input type="file" className="hidden" onChange={handleImageUpload} />
              </label>
           </div>
        </div>

        <button disabled={saving} className="w-full bg-fuchsia-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-fuchsia-900 flex justify-center gap-2">
           <Save /> {saving ? 'Salvando...' : 'Salvar Todas Alterações'}
        </button>
      </form>

      {/* Modal Zoom */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImage} className="max-w-full max-h-full rounded shadow-2xl" alt="Zoom" />
          <button className="absolute top-5 right-5 text-white bg-gray-800 p-2 rounded-full"><X /></button>
        </div>
      )}
    </div>
  )
}