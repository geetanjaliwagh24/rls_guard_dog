import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);

  const checkSessionAndRedirect = async (session) => {
    const user = session?.user;
    if (!user) {
      setSessionChecked(true);
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('❌ Role fetch error:', roleError.message);
      setSessionChecked(true);
      return;
    }

    const role = roleData?.role;
    console.log('🔐 Logged in as:', role);

    if (role === 'teacher') router.push('/teacher');
    else if (role === 'student') router.push('/student');
    else if (role === 'head_teacher') router.push('/headteacher');
    else if (role === 'admin') router.push('/admin/invite');
    else router.push('/');

    setSessionChecked(true);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await checkSessionAndRedirect(session);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        if (event === 'SIGNED_IN') {
          await checkSessionAndRedirect(session);
        }
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (!sessionChecked) return <p className="p-6">🔄 Checking session…</p>;

  return <Component {...pageProps} />;
}

export default MyApp;
