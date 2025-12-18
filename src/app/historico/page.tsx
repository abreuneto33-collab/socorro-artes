'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Download, Search, CheckCircle, Clock, DollarSign, Wallet, TrendingUp } from 'lucide-react'

export default function History() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados para totais
  const [totalBruto, setTotalBruto] = useState(0)
  const [totalRecebido, setTotalRecebido] = useState(0)
  const [totalFalta, setTotalFalta] = useState(0)

  useEffect(() => {
    async function fetchAll() {
      // Busca tudo cronologicamente (data do pedido)
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) {
        setOrders(data)
        calculateTotals(data)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  function calculateTotals(data: any[]) {
    let bruto = 0
    let falta = 0

    data.forEach(o => {
      bruto += o.total_price
      // Se NÃO foi entregue ainda, conta o que falta
      if (!o.is_delivered) {
        falta += (o.total_price - o.down_payment)
      }
      // Se JÁ foi entregue, consideramos que tudo foi pago (falta = 0)
    })

    setTotalBruto(bruto)
    setTotalFalta(falta)
    setTotalRecebido(bruto - falta)
  }

  const downloadCSV = () => {
    const header = ["Data Pedido,Cliente,Contato,Produto,Qtd,Total,Entregue em,Status"];
    const rows = orders.map(o => [
        `"${format(parseISO(o.created_at), 'dd/MM/yyyy')}"`,
        `"${o.client_name}"`,
        `"${o.client_contact || ''}"`,
        `"${o.description}"`,
        o.quantity,
        o.total_price.toFixed(2).replace('.', ','),
        `"${format(parseISO(o.delivery_date), 'dd/MM/yyyy')}"`,
        o.is_delivered ? "Entregue" : "Pendente"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `socorro_artes_relatorio_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredOrders = orders.filter(o => 
    o.client_name.toLowerCase().includes(search.toLowerCase()) ||
    o.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando histórico financeiro...</div>

  return (
    <div className="space-y-8">
      
      {/* Cards Financeiros */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 border border-gray-100">
           <div className="flex items-center gap-3 mb-2 text-blue-600">
             <TrendingUp size={24} />
             <h3 className="font-bold text-sm uppercase tracking-wide">Total Bruto (Vendido)</h3>
           </div>
           <p className="text-3xl font-bold text-gray-900">R$ {totalBruto.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 border border-gray-100">
           <div className="flex items-center gap-3 mb-2 text-green-600">
             <Wallet size={24} />
             <h3 className="font-bold text-sm uppercase tracking-wide">Total Recebido (Caixa)</h3>
           </div>
           <p className="text-3xl font-bold text-gray-900">R$ {totalRecebido.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-orange-500 border border-gray-100">
           <div className="flex items-center gap-3 mb-2 text-orange-600">
             <DollarSign size={24} />
             <h3 className="font-bold text-sm uppercase tracking-wide">A Receber</h3>
           </div>
           <p className="text-3xl font-bold text-gray-900">R$ {totalFalta.toFixed(2)}</p>
           <p className="text-xs text-gray-400 mt-1">Valores pendentes de entrega</p>
        </div>
      </section>

      {/* Tabela e Filtros */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar histórico..." 
              className="w-full pl-12 p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-fuchsia-600 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={downloadCSV} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black font-medium transition-colors shadow-lg">
            <Download size={18} /> Baixar Relatório
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">Data Pedido</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500">
                      {format(parseISO(order.created_at), "dd/MM/yy")}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {order.client_name}
                      <div className="text-xs font-normal text-gray-400">{order.client_contact}</div>
                    </td>
                    <td className="p-4 text-gray-700">
                        {order.quantity}x {order.description}
                    </td>
                    <td className="p-4 font-medium">
                      R$ {order.total_price.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {order.payment_method}
                    </td>
                    <td className="p-4 text-center">
                      {order.is_delivered ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> Entregue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}