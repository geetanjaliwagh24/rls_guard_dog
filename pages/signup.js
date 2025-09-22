import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Signup() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const queryToken = router.query.token
    if (!queryToken) return

    setToken(queryToken)

    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('invite_links')
        .select('role, used')
        .eq('token', queryToken)
        .single()

      if (error || !data) {
        setError('Invalid or expired invite token.')
        return
      }

      if (data.used) {
        setError('This invite link has already been used.')
        return
      }

      setRole(data.role)
    }

    fetchInvite()
  }, [router.query.token])

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!role || !token) {
      setError('Missing or invalid invite.')
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      return
    }

    const user = data?.user
    if (!user) {
      setError('Signup succeeded but no user returned.')
      return
    }
    const sessionCheck = await supabase.auth.getSession();
console.log('Session UID:', sessionCheck?.data?.session?.user?.id);
console.log('New user ID:', user.id);

    const { error: roleInsertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role })

    if (roleInsertError) {
      setError('Signup succeeded but role insert failed: ' + roleInsertError.message)
      return
    }

    await supabase
      .from('invite_links')
      .update({ used: true })
      .eq('token', token)

    setSuccess('Signup successful! Please check your email to confirm.')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">
          Sign Up as {role || '...'}
        </h1>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {success && <p className="text-green-600 mt-4">{success}</p>}
      </div>
    </main>
  )
}
