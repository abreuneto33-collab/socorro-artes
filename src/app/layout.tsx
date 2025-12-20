'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, BookOpen, PieChart, PlusCircle, Menu, X, LogOut, Package, Scissors } from 'lucide-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Lista de páginas que NÃO devem ter a sidebar
  const publicPages = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha']
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      // Se não tem sessão e tenta acessar página interna, manda pro login
      if (!session && !isPublicPage) {
        router.push('/login')
      }
      setLoading(false)
    }

    // Escuta mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && !isPublicPage) {
        router.push('/login')
      }
    })

    checkSession()

    return () => subscription.unsubscribe()
  }, [pathname, isPublicPage, router])

  return (
    <html lang="pt-br">
      <head>
        <title>Socorro Artes</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#701a75" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      
      <body className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
        
        {/* Carregando... (Tela de espera inicial) */}
        {loading && (
           <div className="fixed inset-0 bg-fuchsia-900 z-[100] flex items-center justify-center text-white">
             <div className="animate-pulse font-bold text-xl">Carregando Socorro Artes...</div>
           </div>
        )}

        {/* 1. SE FOR PÁGINA PÚBLICA (Login, Cadastro...), MOSTRA SÓ O CONTEÚDO */}
        {isPublicPage ? (
          <main className="w-full min-h-screen flex flex-col">{children}</main>
        ) : (
          /* 2. SE FOR SISTEMA INTERNO, MOSTRA SIDEBAR + CONTEÚDO */
          <>
            {/* Botão Mobile */}
            <button 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden fixed top-4 right-4 z-50 bg-fuchsia-900 text-white p-2 rounded shadow-lg"
            >
              {isMobileOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar */}
            <aside className={`
              fixed md:fixed inset-y-0 left-0 z-40 w-64 bg-fuchsia-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
              ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
            `}>
              <div className="h-24 flex flex-col justify-center pl-8 border-b border-fuchsia-800 bg-fuchsia-950">
                <h1 className="text-xl font-bold uppercase tracking-widest">Socorro Artes</h1>
                <p className="text-xs text-fuchsia-300">Painel Gerencial</p>
              </div>
              
             <nav className="flex-1 py-6 space-y-1">
  <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 px-8 py-3 hover:bg-fuchsia-800 transition-colors border-l-4 border-transparent hover:border-white">
    <LayoutDashboard size={20} /> Geral
  </Link>
  
  <Link href="/produtos" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 px-8 py-3 hover:bg-fuchsia-800 transition-colors border-l-4 border-transparent hover:border-white">
    <Package size={20} /> Produtos
  </Link>

  <Link href="/materiais" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 px-8 py-3 hover:bg-fuchsia-800 transition-colors border-l-4 border-transparent hover:border-white">
    <Scissors size={20} /> Materiais
  </Link>

  <Link href="/notas" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 px-8 py-3 hover:bg-fuchsia-800 transition-colors border-l-4 border-transparent hover:border-white">
    <BookOpen size={20} /> Caderno
  </Link>
  
  <Link href="/relatorios" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-4 px-8 py-3 hover:bg-fuchsia-800 transition-colors border-l-4 border-transparent hover:border-white">
    <PieChart size={20} /> Relatórios
  </Link>
</nav>

              <div className="p-6 space-y-4">
                <Link href="/novo-pedido" onClick={() => setIsMobileOpen(false)} className="flex items-center justify-center gap-2 bg-white text-fuchsia-900 w-full py-3 rounded-lg font-bold shadow-lg hover:bg-fuchsia-100 transition-colors">
                   <PlusCircle size={20} /> Novo Pedido
                </Link>
                <button 
                  onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} 
                  className="flex items-center gap-2 text-sm text-fuchsia-300 hover:text-white pl-2 mt-4"
                >
                   <LogOut size={16} /> Sair
                </button>
              </div>
            </aside>

            {/* Conteúdo Interno */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen bg-gray-50">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  )
}