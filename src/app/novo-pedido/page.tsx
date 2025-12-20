'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Plus, Trash2, Search, UserPlus, Image as ImageIcon, X } from 'lucide-react'

export default function NewOrder() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Dados do Cliente
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [newClientMode, setNewClientMode] = useState(false)
  const [clientForm, setClientForm] = useState({ name: '', contact: '', address: '' })
  
  // Dados do Pedido
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [items, setItems] = useState([{ product_name: '', quantity: 1, unit_price: 0 }])
  const [downPayment, setDownPayment] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [obs, setObs] = useState('')
  const [priority, setPriority] = useState('normal')

  // Imagens
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Busca clientes ao carregar
  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      if(data) setClients(data)
    })
  }, [])

  // Cálculos
  const totalOrder = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  const remaining = totalOrder - (parseFloat(downPayment) || 0)

  // Funções de Cliente
  const handleClientSelect = (e: any) => {
    const client = clients.find(c => c.id === e.target.value)
    setSelectedClient(client)
    setNewClientMode(false)
  }

  const handleNewClientChange = (e: any) => setClientForm({...clientForm, [e.target.name]: e.target.value})

  // Funções de Itens
  const addItem = () => setItems([...items, { product_name: '', quantity: 1, unit_price: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Upload Imagem
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('encomendas').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('encomendas').getPublicUrl(fileName)
      setImages([...images, publicUrl])
    }
    setUploading(false)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    let clientId = selectedClient?.id

    // 1. Se for cliente novo, cria ele primeiro
    if (newClientMode || !clientId) {
      const { data: newClient, error } = await supabase.from('clients').insert([clientForm]).select().single()
      if (error) { alert('Erro ao criar cliente'); setLoading(false); return }
      clientId = newClient.id
    }

    // 2. Cria o Pedido
    const { data: order, error: orderError } = await supabase.from('orders').insert([{
      client_id: clientId,
      order_date: orderDate,
      delivery_date: deliveryDate,
      delivery_time: deliveryTime || null,
      total_price: totalOrder,
      down_payment: parseFloat(downPayment) || 0,
      payment_method: paymentMethod,
      observation: obs,
      priority: priority,
      images: images,
      status: 'pendente',
      is_delivered: false,
      material_status: false,
      art_status: false
    }]).select().single()

    if (orderError) { alert('Erro no pedido: ' + orderError.message); setLoading(false); return }

    // 3. Salva os Itens
    const itemsToSave = items.map(i => ({
      order_id: order.id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price
    }))
    
    await supabase.from('order_items').insert(itemsToSave)

    alert('Pedido salvo com sucesso!')
    router.push('/')
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft /></button>
        <h2 className="text-2xl font-bold">Novo Pedido Completo</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SEÇÃO CLIENTE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg text-gray-700">1. Quem é o Cliente?</h3>
             <button type="button" onClick={() => {setNewClientMode(!newClientMode); setSelectedClient(null)}} className="text-sm text-fuchsia-700 font-bold flex items-center gap-1 hover:underline">
               {newClientMode ? <Search size={16}/> : <UserPlus size={16}/>} 
               {newClientMode ? 'Selecionar Existente' : 'Cadastrar Novo'}
             </button>
           </div>

           {!newClientMode ? (
             <select className="w-full p-3 border rounded-lg bg-gray-50" onChange={handleClientSelect} required={!newClientMode}>
               <option value="">Selecione um cliente...</option>
               {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           ) : (
             <div className="grid md:grid-cols-2 gap-4">
               <input placeholder="Nome Completo" name="name" onChange={handleNewClientChange} className="p-3 border rounded-lg" required />
               <input placeholder="Contato (Zap)" name="contact" onChange={handleNewClientChange} className="p-3 border rounded-lg" />
               <input placeholder="Endereço Completo" name="address" onChange={handleNewClientChange} className="p-3 border rounded-lg md:col-span-2" />
             </div>
           )}
           
           {selectedClient && (
             <div className="mt-4 bg-fuchsia-50 p-3 rounded text-sm text-gray-600">
               <strong>Cliente Selecionado:</strong> {selectedClient.name} <br/>
               Contato: {selectedClient.contact} — Endereço: {selectedClient.address}
             </div>
           )}
        </div>

        {/* SEÇÃO PRODUTOS (ITENS) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-100">
           <h3 className="font-bold text-lg text-gray-700 mb-4">2. O que será feito? (Produtos)</h3>
           
           <div className="space-y-3">
             {items.map((item, idx) => (
               <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input placeholder="Nome do Produto" value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} className="w-full p-2 border rounded" required />
                  </div>
                  <div className="w-20">
                    <input type="number" min="1" placeholder="Qtd" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="w-full p-2 border rounded" required />
                  </div>
                  <div className="w-28">
                    <input type="number" step="0.01" placeholder="R$ Unit." value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value))} className="w-full p-2 border rounded" required />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
               </div>
             ))}
           </div>
           
           <button type="button" onClick={addItem} className="mt-4 flex items-center gap-2 text-sm font-bold text-fuchsia-700 hover:bg-fuchsia-50 px-3 py-2 rounded transition">
             <Plus size={16} /> Adicionar outro produto
           </button>
        </div>

        {/* SEÇÃO IMAGENS E OBS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-100">
           <h3 className="font-bold text-lg text-gray-700 mb-4">3. Fotos e Detalhes</h3>
           <textarea placeholder="Observações gerais (Cores, detalhes...)" value={obs} onChange={e => setObs(e.target.value)} className="w-full p-3 border rounded-lg mb-4 h-24" />
           
           <div className="flex flex-wrap gap-4 mb-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Ref" className="w-full h-full object-cover rounded border" />
                  <button type="button" onClick={() => setImages(images.filter(x => x !== url))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X size={10}/></button>
                </div>
              ))}
           </div>
           <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 inline-flex items-center gap-2">
             <ImageIcon size={16}/> {uploading ? 'Enviando...' : 'Anexar Imagem'}
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
           </label>
        </div>

        {/* SEÇÃO DATAS E PAGAMENTO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-fuchsia-100">
           <div className="grid md:grid-cols-2 gap-6 mb-6">
             <div>
               <label className="text-sm font-bold text-gray-600">Data do Pedido</label>
               <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full p-2 border rounded" />
             </div>
             <div>
               <label className="text-sm font-bold text-gray-600">Data de Entrega</label>
               <input type="date" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full p-2 border rounded" />
             </div>
           </div>

           <div className="bg-fuchsia-50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
             <div>
               <span className="block text-xs font-bold text-gray-500 uppercase">Total Pedido</span>
               <span className="text-xl font-bold text-gray-900">R$ {totalOrder.toFixed(2)}</span>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase block">Sinal (R$)</label>
               <input type="number" step="0.01" value={downPayment} onChange={e => setDownPayment(e.target.value)} className="w-24 p-1 border rounded" />
             </div>
             <div>
               <span className="block text-xs font-bold text-gray-500 uppercase">Falta Pagar</span>
               <span className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>R$ {remaining.toFixed(2)}</span>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase block">Prioridade</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="p-1 border rounded bg-white w-full">
                  <option value="normal">Normal</option>
                  <option value="alta">URGENTE</option>
                </select>
             </div>
           </div>
        </div>

        <button disabled={loading} className="w-full bg-fuchsia-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-fuchsia-900 flex justify-center gap-2">
          <Save /> {loading ? 'Processando...' : 'Salvar Encomenda'}
        </button>

      </form>
    </div>
  )
}