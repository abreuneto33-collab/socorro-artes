'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Ao entrar nessa página pelo link do email, o Supabase já loga o usuário automaticamente.
  // Só precisamos atualizar a senha.

  const handleUpdate = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      alert('Erro ao atualizar senha: ' + error.message)
    } else {
      alert('Senha atualizada com sucesso!')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Nova Senha</h2>
        <p className="text-gray-500 mb-6 text-sm text-center">Digite sua nova senha abaixo.</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <input 
            type="password" placeholder="Nova senha" required 
            className="w-full p-3 border rounded-lg"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}