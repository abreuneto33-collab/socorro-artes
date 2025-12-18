'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'

export default function NewOrder() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_contact: '',
    description: '',
    observation: '',
    quantity: 1,
    total_price: '',
    down_payment: '',
    delivery_date: '',
    delivery_time: '', // O erro estava aqui
    payment_method: 'Pix', // Novo campo
    priority: 'normal'
  })

  // Cálculos em tempo real
  const total = parseFloat(formData.total_price) || 0
  const down = parseFloat(formData.down_payment) || 0
  const remaining = total - down

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    // CORREÇÃO DO ERRO DE TIME: Se estiver vazio, envia null
    const timeToSend = formData.delivery_time ? formData.delivery_time : null

    const { error } = await supabase.from('orders').insert([{
      ...formData,
      total_price: total,
      down_payment: down,
      delivery_time: timeToSend,
      is_delivered: false,
      status: 'pendente'
    }])

    if (error) {
      alert('Erro ao salvar: ' + error.message)
      console.error(error)
    } else {
      alert('Pedido adicionado com sucesso!')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Novo Pedido</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
        
        {/* Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Cliente</label>
            <input required name="client_name" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none" placeholder="Ex: Dona Maria" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contato (Zap)</label>
            <input name="client_contact" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none" placeholder="(00) 00000-0000" />
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-1">O que vai ser feito?</label>
            <input required name="description" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none" placeholder="Ex: Jogo de Banheiro" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade</label>
                    <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
                    <input name="observation" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Detalhes, cores, etc..." />
                </div>
            </div>
        </div>

        {/* Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">Valor Total (R$)</label>
               <input type="number" step="0.01" required name="total_price" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0.00" />
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">Sinal Pago (R$)</label>
               <input type="number" step="0.01" name="down_payment" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0.00" />
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">Forma de Pagto</label>
               <select name="payment_method" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
               </select>
             </div>
             <div className="flex flex-col justify-center">
                <span className="text-xs text-gray-500 uppercase font-bold">Resta Pagar</span>
                <span className={`text-xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {remaining.toFixed(2)}
                </span>
             </div>
        </div>

        {/* Datas e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Data da Entrega</label>
             <input type="date" required name="delivery_date" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
           </div>
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Horário (Opcional)</label>
             <input type="time" name="delivery_time" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
           </div>
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Prioridade</label>
             <select name="priority" onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white font-medium">
                <option value="normal">Normal</option>
                <option value="alta">ALTA (Urgente)</option>
             </select>
           </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-fuchsia-800 text-white font-bold py-4 rounded-xl hover:bg-fuchsia-900 transition-all flex items-center justify-center gap-2 text-lg shadow-lg">
          <Save size={24} /> 
          {loading ? 'Salvando...' : 'Salvar Pedido'}
        </button>

      </form>
    </div>
  )
}