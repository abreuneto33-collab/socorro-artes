'use client' // Importante para usar useState
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Tenta criar o usuário no Supabase
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // Redireciona para o login após confirmar (se email confirm for necessário)
        emailRedirectTo: `${window.location.origin}/login`
      }
    })

    if (error) {
      setMsg('Erro: ' + error.message)
    } else {
      setMsg('Conta criada com sucesso! Verifique seu email ou tente fazer login.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fuchsia-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-fuchsia-900">Criar Conta</h1>
        
        {/* Mensagem de Erro ou Sucesso */}
        {msg && (
          <div className={`p-3 rounded mb-4 text-sm ${msg.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              placeholder="seu@email.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none"
              value={email} 
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required 
              placeholder="Sua senha secreta"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600 outline-none"
              value={password} 
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-fuchsia-700 text-white py-3 rounded-lg font-bold hover:bg-fuchsia-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Já tem uma conta?</p>
          <Link href="/login" className="text-fuchsia-700 font-bold hover:underline">
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  )
}