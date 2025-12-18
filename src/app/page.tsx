'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, CheckCircle, Plus, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('is_delivered', false) // Só o que não foi entregue
    
    if (data) {
      // Ordenação: Urgência > Data
      const sorted = data.sort((a, b) => {
        if (a.priority === 'alta' && b.priority !== 'alta') return -1;
        if (b.priority === 'alta' && a.priority !== 'alta') return 1;
        return new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime();
      })
      setOrders(sorted)
    }
    setLoading(false)
  }

  async function markAsDelivered(id: string) {
    if(!confirm("Confirmar entrega e pagamento total?")) return;
    await supabase.from('orders').update({ is_delivered: true, status: 'entregue' }).eq('id', id)
    fetchOrders()
  }

  useEffect(() => { fetchOrders() }, [])

  const filteredOrders = orders.filter(o => 
    o.client_name.toLowerCase().includes(search.toLowerCase()) || 
    o.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-10 text-center">Carregando prioridades...</div>

  return (
    <div>
      {/* Cabeçalho com Botão de Adicionar */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500 mt-1">Pedidos pendentes organizados por prioridade</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" placeholder="Busca rápida..." 
                  className="w-full pl-10 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-600 outline-none"
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <Link href="/novo-pedido" className="flex items-center gap-2 bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-bold shadow-md transition-all whitespace-nowrap">
                <Plus size={20} /> Adicionar
             </Link>
        </div>
      </header>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isLate = differenceInDays(new Date(), parseISO(order.delivery_date)) > 0
          const isHighPriority = order.priority === 'alta'
          const remaining = order.total_price - order.down_payment

          return (
            <div key={order.id} 
                 className={`relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow
                 ${isHighPriority ? 'border-l-[8px] border-l-red-600' : 'border-l-[8px] border-l-fuchsia-700'}
                 `}>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{order.client_name}</h3>
                  {isHighPriority && <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200"><AlertTriangle size={12}/> URGENTE</span>}
                  {isLate && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200">ATRASADO</span>}
                </div>
                
                <p className="text-gray-800 font-medium text-lg">{order.quantity}x {order.description}</p>
                <p className="text-sm text-gray-500 mt-1">{order.client_contact}</p>

                {order.observation && (
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                    Obs: {order.observation}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between items-end gap-3 min-w-[200px]">
                 <div className="text-right">
                    <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
                      <Clock size={16} /> Entrega:
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {format(parseISO(order.delivery_date), "dd/MM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-400">{order.delivery_time || '--:--'}</p>
                 </div>

                 <div className="w-full flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase">Falta</span>
                    <span className={`font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                      R$ {remaining.toFixed(2)}
                    </span>
                 </div>
                 
                 <button onClick={() => markAsDelivered(order.id)} className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black text-sm font-bold uppercase tracking-wide transition-colors">
                    <CheckCircle size={16} /> Concluir <Link href={`/editar/${order.id}`} className="text-gray-400 hover:text-fuchsia-700 text-xs underline mt-2 block text-center">
  Ver detalhes / Editar
</Link>
                 </button>
              </div>
            </div>
          )
        })}
        
        {filteredOrders.length === 0 && (
            <div className="text-center py-20 text-gray-400 italic">Nenhum pedido pendente nesta lista.</div>
        )}
      </div>
    </div>
  )
}