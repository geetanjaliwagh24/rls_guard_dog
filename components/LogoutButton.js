import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      setLoading(false);
      return;
    }

    // ✅ Wait until session is cleared
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        clearInterval(interval);
        router.replace('/'); // ✅ Redirect to homepage
      }
    }, 300);
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      disabled={loading}
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
