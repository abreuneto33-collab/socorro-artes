'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, CheckCircle, Plus, AlertTriangle, Search, Palette, ShoppingBag, Edit } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchOrders() {
    // Busca pedidos + dados do cliente (join)
    const { data } = await supabase
      .from('orders')
      .select('*, clients(name, contact)')
      .eq('is_delivered', false)
    
    if (data) {
      const sorted = data.sort((a, b) => {
        if (a.priority === 'alta' && b.priority !== 'alta') return -1;
        if (b.priority === 'alta' && a.priority !== 'alta') return 1;
        return new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime();
      })
      setOrders(sorted)
    }
    setLoading(false)
  }

  async function toggleStatus(id: string, field: string, currentValue: boolean) {
    // Atualiza status material ou arte
    await supabase.from('orders').update({ [field]: !currentValue }).eq('id', id)
    fetchOrders()
  }

  async function markAsDelivered(id: string) {
    if(!confirm("Entregar pedido? Isso vai movê-lo para o histórico.")) return;
    await supabase.from('orders').update({ is_delivered: true, status: 'entregue' }).eq('id', id)
    fetchOrders()
  }

  useEffect(() => { fetchOrders() }, [])

  const filteredOrders = orders.filter(o => 
    o.clients?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-10 text-center">Carregando painel...</div>

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500 mt-1">Lista de Produção Ativa</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar cliente..." className="w-full pl-10 p-3 rounded-lg border focus:ring-2 focus:ring-fuchsia-600 outline-none" onChange={(e) => setSearch(e.target.value)} />
             </div>
             <Link href="/novo-pedido" className="flex items-center gap-2 bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-bold shadow-md whitespace-nowrap">
                <Plus size={20} /> Novo
             </Link>
        </div>
      </header>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isLate = differenceInDays(new Date(), parseISO(order.delivery_date)) > 0
          const remaining = order.total_price - order.down_payment
          const clientName = order.clients?.name || 'Cliente Desconhecido'

          return (
            <div key={order.id} 
                 className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all
                 ${order.priority === 'alta' ? 'border-l-[8px] border-l-red-600 bg-red-50/20' : 'border-l-[8px] border-l-fuchsia-700'}
                 `}>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{clientName}</h3>
                  {order.priority === 'alta' && <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded"><AlertTriangle size={12}/> URGENTE</span>}
                  {isLate && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">ATRASADO</span>}
                </div>
                
                {/* Status de Produção */}
                <div className="flex gap-3 mt-3 mb-2">
                  <button onClick={() => toggleStatus(order.id, 'material_status', order.material_status)} 
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border transition-colors ${order.material_status ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <ShoppingBag size={14} /> {order.material_status ? 'Material OK' : 'Comprar Material'}
                  </button>

                  <button onClick={() => toggleStatus(order.id, 'art_status', order.art_status)} 
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border transition-colors ${order.art_status ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    <Palette size={14} /> {order.art_status ? 'Arte Pronta' : 'Fazer Arte'}
                  </button>
                </div>

                <p className="text-gray-500 text-sm mt-2">{order.observation}</p>
                
                {/* Mini Galeria */}
                {order.images && order.images.length > 0 && (
                   <div className="flex gap-2 mt-3">
                     {order.images.map((img:string, i:number) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img} className="w-10 h-10 rounded border object-cover" alt="mini" />
                     ))}
                   </div>
                )}
              </div>

              {/* Coluna Direita - Datas e Botões Separados */}
              <div className="flex flex-col justify-between items-end gap-3 min-w-[220px]">
                 <div className="text-right">
                    <p className="text-sm text-gray-500 flex items-center justify-end gap-1"><Clock size={16} /> Entrega:</p>
                    <p className="text-xl font-bold text-gray-900">{format(parseISO(order.delivery_date), "dd/MM", { locale: ptBR })}</p>
                 </div>

                 <div className="w-full flex justify-between items-center bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase">Falta</span>
                    <span className={`font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>R$ {remaining.toFixed(2)}</span>
                 </div>
                 
                 {/* AQUI ESTÁ A CORREÇÃO DOS BOTÕES SEPARADOS */}
                 <div className="flex gap-2 w-full mt-1">
                    <Link href={`/editar/${order.id}`} className="flex-1 flex justify-center items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-bold uppercase transition-colors">
                      <Edit size={16} /> Detalhes
                    </Link>
                    
                    <button onClick={() => markAsDelivered(order.id)} className="flex-1 flex justify-center items-center gap-1 bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-black text-xs font-bold uppercase transition-colors">
                        <CheckCircle size={16} /> Concluir
                    </button>
                 </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}