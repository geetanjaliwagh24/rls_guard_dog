import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import useRoleRedirect from '../hooks/useRoleRedirect'; // ✅ Import the hook

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useRoleRedirect(); // ✅ Automatically redirects if already logged in

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(`Login failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const session = data?.session;
      const userId = session?.user?.id;

      if (!userId) {
        setMessage('Login failed: Email not confirmed or session missing.');
        setLoading(false);
        return;
      }

      // ✅ Fetch role from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError || !roleData?.role) {
        setMessage('Login succeeded but role lookup failed.');
        setLoading(false);
        return;
      }

      const role = roleData.role;

      // ✅ Redirect based on actual page structure
      if (role === 'admin') router.replace('/admin/invite');
      else if (role === 'head_teacher') router.replace('/head_teacher');
      else if (role === 'teacher') router.replace('/teacher');
      else if (role === 'student') router.replace('/student');
      else router.replace('/');

    } catch (err) {
      setMessage('Something went wrong. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">🔐 Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          disabled={loading}
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}
