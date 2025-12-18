'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Download, Search, FileText } from 'lucide-react'

export default function Notes() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchAll() {
      // Pega tudo, do mais recente pro mais antigo
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (data) setOrders(data)
    }
    fetchAll()
  }, [])

  const downloadCSV = () => {
    const header = ["Data,Cliente,Produto,Valor Total,Status,Observacao"];
    const rows = orders.map(o => [
        format(parseISO(o.created_at), 'dd/MM/yyyy'),
        o.client_name,
        o.description,
        o.total_price,
        o.is_delivered ? "Entregue" : "Pendente",
        o.observation || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "todas_as_notas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = orders.filter(o => o.client_name.toLowerCase().includes(search.toLowerCase()) || o.description.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <FileText className="text-fuchsia-700" /> Caderno de Encomendas
           </h2>
           <p className="text-gray-500 text-sm">Registro completo de todos os pedidos da história</p>
        </div>
        <button onClick={downloadCSV} className="bg-gray-900 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-black">
          <Download size={16} /> Baixar Tudo
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar no caderno..." 
            className="w-full pl-10 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-600 outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-500">{format(parseISO(order.created_at), "dd/MM/yy")}</td>
                  <td className="p-3 font-medium text-gray-900">{order.client_name}</td>
                  <td className="p-3 text-gray-600">{order.quantity}x {order.description}</td>
                  <td className="p-3 font-medium">R$ {order.total_price.toFixed(2)}</td>
                  <td className="p-3">
                    {order.is_delivered 
                      ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Entregue</span>
                      : <span className="text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded">Pendente</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}