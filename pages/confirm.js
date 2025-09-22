import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

function Confirm() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      const role = data?.role
      if (role === 'teacher') router.replace('/teacher')
      else if (role === 'student') router.replace('/student')
      else if (role === 'head_teacher') router.replace('/headteacher')
    }

    checkSession()
  }, [router])

  return <p className="p-6">🔄 Confirming and redirecting…</p>
}

export default Confirm
