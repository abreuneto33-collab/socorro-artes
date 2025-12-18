'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg('Email ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fuchsia-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fuchsia-900 uppercase tracking-widest">Socorro Artes</h1>
          <p className="text-gray-500 text-sm">Acesso ao Sistema</p>
        </div>

        {errorMsg && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
            <input type="password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none"
              value={password} onChange={e => setPassword(e.target.value)} />
            <div className="text-right mt-1">
              <Link href="/esqueci-senha" className="text-xs text-gray-500 hover:text-fuchsia-700">Esqueceu a senha?</Link>
            </div>
          </div>
          
          <button disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all flex justify-center gap-2">
            <Lock size={20} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-gray-600">Não tem acesso?</p>
          <Link href="/cadastro" className="text-fuchsia-700 font-bold hover:underline">Criar Conta</Link>
        </div>
      </div>
    </div>
  )
}