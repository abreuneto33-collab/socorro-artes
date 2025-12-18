'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleReset = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    // Envia email de redefinição
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) {
      setMsg('Erro: ' + error.message)
    } else {
      setMsg('Link de recuperação enviado para o seu email! Verifique a caixa de entrada.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recuperar Senha</h2>
        <p className="text-gray-500 mb-6 text-sm">Digite seu email para receber o link de redefinição.</p>
        
        {msg && <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" placeholder="Seu email" required 
            className="w-full p-3 border rounded-lg"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <button disabled={loading} className="w-full bg-fuchsia-700 text-white py-3 rounded-lg font-bold hover:bg-fuchsia-800">
            {loading ? 'Enviando...' : 'Enviar Link'}
          </button>
        </form>

        <div className="mt-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-black">Voltar para Login</Link>
        </div>
      </div>
    </div>
  )
}