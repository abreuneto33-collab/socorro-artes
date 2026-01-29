'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Download, Search, FileText, Trash2 } from 'lucide-react'

export default function Notes() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')

  // Função para buscar os dados (agora fora do useEffect para ser reutilizada)
  async function fetchAll() {
    const { data } = await supabase
      .from('orders')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Função para Excluir
  async function handleDelete(id: string) {
    const confirmacao = window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro do histórico? Isso não pode ser desfeito.")
    
    if (confirmacao) {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      
      if (error) {
        alert("Erro ao excluir: " + error.message)
      } else {
        // Atualiza a lista removendo o item apagado visualmente
        setOrders(prevOrders => prevOrders.filter(order => order.id !== id))
      }
    }
  }

  const downloadCSV = () => {
    const header = ["Data,Cliente,Total,Status,Obs"];
    const rows = orders.map(o => [
        format(parseISO(o.created_at), 'dd/MM/yyyy'),
        o.clients?.name || 'Cliente deletado',
        o.total_price.toFixed(2).replace('.', ','),
        o.is_delivered ? "Entregue" : "Pendente",
        o.observation || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "caderno_encomendas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = orders.filter(o => 
    o.clients?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <FileText className="text-fuchsia-700" /> Caderno de Encomendas
           </h2>
           <p className="text-sm text-gray-500">Histórico completo da loja</p>
        </div>
        <button onClick={downloadCSV} className="bg-gray-900 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-black transition-colors">
          <Download size={16} /> Baixar Tabela
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por cliente..." 
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
                <th className="p-3">Valor Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ações</th> {/* Nova Coluna */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-500">{format(parseISO(order.created_at), "dd/MM/yy")}</td>
                  <td className="p-3 font-bold text-gray-900">{order.clients?.name}</td>
                  <td className="p-3 font-medium">R$ {order.total_price.toFixed(2)}</td>
                  <td className="p-3">
                    {order.is_delivered 
                      ? <span className="text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded">Entregue</span>
                      : <span className="text-yellow-700 font-bold text-xs bg-yellow-100 px-2 py-1 rounded">Pendente</span>
                    }
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDelete(order.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir do histórico"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">Nenhum registro encontrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}