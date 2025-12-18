'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Wallet, AlertCircle } from 'lucide-react'

export default function Reports() {
  const [stats, setStats] = useState({ bruto: 0, liquido: 0, falta: 0, count: 0 })

  useEffect(() => {
    async function calculate() {
      const { data } = await supabase.from('orders').select('*')
      
      if (data) {
        let bruto = 0
        let falta = 0
        
        data.forEach(o => {
          bruto += o.total_price
          if (!o.is_delivered) {
             falta += (o.total_price - o.down_payment)
          }
        })

        setStats({
          bruto,
          falta,
          liquido: bruto - falta, // O que já entrou de verdade
          count: data.length
        })
      }
    }
    calculate()
  }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-gray-900">Relatório Financeiro</h2>

      {/* Cards Grandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Bruto */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-l-blue-600 border border-gray-100">
           <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
               <TrendingUp size={28} />
             </div>
             <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Vendido</p>
               <h3 className="text-3xl font-bold text-gray-900">R$ {stats.bruto.toFixed(2)}</h3>
             </div>
           </div>
           <p className="text-sm text-gray-400">Valor somado de todas as encomendas já feitas.</p>
        </div>

        {/* Liquido / Caixa */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-l-green-600 border border-gray-100">
           <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-green-50 text-green-600 rounded-full">
               <Wallet size={28} />
             </div>
             <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Em Caixa (Recebido)</p>
               <h3 className="text-3xl font-bold text-gray-900">R$ {stats.liquido.toFixed(2)}</h3>
             </div>
           </div>
           <p className="text-sm text-gray-400">Dinheiro que já entrou (Sinais + Pagamentos).</p>
        </div>

        {/* A Receber */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-[6px] border-l-red-500 border border-gray-100">
           <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-red-50 text-red-600 rounded-full">
               <AlertCircle size={28} />
             </div>
             <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Falta Receber</p>
               <h3 className="text-3xl font-bold text-gray-900">R$ {stats.falta.toFixed(2)}</h3>
             </div>
           </div>
           <p className="text-sm text-gray-400">Valor pendente de encomendas não entregues.</p>
        </div>
      </div>

      <div className="bg-fuchsia-900 text-white p-8 rounded-2xl text-center shadow-lg">
        <h3 className="text-2xl font-bold mb-2">Resumo da Loja</h3>
        <p className="opacity-80 text-lg">A loja Socorro Artes já recebeu um total de <strong className="text-yellow-300">{stats.count}</strong> encomendas!</p>
      </div>

    </div>
  )
}