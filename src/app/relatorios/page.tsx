'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Wallet, AlertCircle, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Reports() {
  const [stats, setStats] = useState({ bruto: 0, liquido: 0, falta: 0, count: 0 })
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Pega todos os pedidos
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: true })
      
      if (data) {
        let bruto = 0
        let falta = 0
        const monthlyData: any = {}
        
        data.forEach(o => {
          // 1. Cálculos dos Cards
          bruto += o.total_price
          if (!o.is_delivered) {
             falta += (o.total_price - o.down_payment)
          }

          // 2. Preparação para o Gráfico (Agrupar por Mês)
          // Cria uma chave tipo "jan" ou "fev"
          const monthKey = format(parseISO(o.created_at), 'MMM', { locale: ptBR }).toUpperCase()
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey] += o.total_price
          } else {
            monthlyData[monthKey] = o.total_price
          }
        })

        // Transforma o objeto em array para o gráfico: [{name: 'JAN', total: 500}, ...]
        // Dica: Isso aqui ordena grosseiramente pela ordem que apareceram no banco
        const formattedChartData = Object.keys(monthlyData).map(key => ({
          name: key,
          total: monthlyData[key]
        }))

        setChartData(formattedChartData)

        setStats({
          bruto,
          falta,
          liquido: bruto - falta,
          count: data.length
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-20 text-center">Calculando lucros...</div>

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-fuchsia-100 rounded-lg text-fuchsia-800">
          <BarChart3 size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Relatórios & Lucros</h2>
          <p className="text-gray-500">Acompanhe a saúde financeira da Socorro Artes</p>
        </div>
      </div>

      {/* 1. CARDS FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-[6px] border-l-blue-600 border border-gray-100 relative overflow-hidden">
           <div className="absolute right-[-20px] top-[-20px] opacity-10 text-blue-600">
             <TrendingUp size={150} />
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Vendido (Bruto)</p>
           <h3 className="text-3xl font-bold text-gray-900">R$ {stats.bruto.toFixed(2)}</h3>
           <p className="text-sm text-blue-600 font-medium mt-2">Todas as vendas somadas</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-[6px] border-l-green-600 border border-gray-100 relative overflow-hidden">
           <div className="absolute right-[-20px] top-[-20px] opacity-10 text-green-600">
             <Wallet size={150} />
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dinheiro em Caixa</p>
           <h3 className="text-3xl font-bold text-gray-900">R$ {stats.liquido.toFixed(2)}</h3>
           <p className="text-sm text-green-600 font-medium mt-2">O que já entrou no bolso</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-[6px] border-l-red-500 border border-gray-100 relative overflow-hidden">
           <div className="absolute right-[-20px] top-[-20px] opacity-10 text-red-600">
             <AlertCircle size={150} />
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Falta Receber</p>
           <h3 className="text-3xl font-bold text-gray-900">R$ {stats.falta.toFixed(2)}</h3>
           <p className="text-sm text-red-500 font-medium mt-2">Encomendas não finalizadas</p>
        </div>
      </div>

      {/* 2. GRÁFICO DE VENDAS */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-fuchsia-700" /> Vendas por Mês
        </h3>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
  cursor={{fill: '#fdf4ff'}}
  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
  // CORREÇÃO AQUI: Troquei 'number' por 'any' e adicionei Number() por segurança
  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Vendido']}
/>
              <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={50}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#a21caf" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
           <p className="text-center text-gray-400 mt-4 text-sm">Cadastre vendas para ver o gráfico crescer!</p>
        )}
      </div>

      {/* Resumo Final */}
      <div className="bg-gray-900 text-white p-8 rounded-2xl text-center shadow-xl">
        <h3 className="text-2xl font-bold mb-2">Total de Encomendas</h3>
        <p className="opacity-80 text-lg">
          A loja Socorro Artes já realizou <strong className="text-fuchsia-400 text-2xl mx-1">{stats.count}</strong> sonhos em forma de artesanato!
        </p>
      </div>

    </div>
  )
}