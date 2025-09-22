import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function InviteGenerator() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const role = data?.role;
      if (role === 'admin' || role === 'head_teacher') {
        setAuthorized(true);
      } else {
        router.replace('/');
      }

      setLoading(false);
    };

    checkRole();
  }, [router]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviteLink('');

    if (!email || !role) {
      setError('Email and role are required.');
      return;
    }

    const token = uuidv4();

    const { data: existing, error: checkError } = await supabase
      .from('invite_links')
      .select('*')
      .eq('email',email)
      .eq('used',false)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      setError('Error checking existing invite: ' + checkError.message);
      return;
    }

    if (existing) {
      setError('An invite already exists for this email.');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const createdBy = sessionData?.session?.user?.id;

    const { error: insertError } = await supabase
      .from('invite_links')
      .insert({
        email,
        role,
        token,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        used: false,
      });

    if (insertError) {
      setError('Failed to create invite: ' + insertError.message);
      return;
    }

    const link = `${window.location.origin}/signup?token=${token}`;
    setInviteLink(link);
    setSuccess('✅ Invite created successfully!');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      return;
    }
    router.replace('/login');
  };

  if (loading) return <p className="p-6">🔐 Checking access…</p>;
  if (!authorized) return null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-indigo-700 mb-4">🛠️ Generate Invite Link</h1>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 rounded"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border px-4 py-2 rounded"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="head_teacher">Head Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            Generate Invite
          </button>
        </form>

        {success && <p className="text-green-600 mt-4">{success}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
        {inviteLink && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Invite Link:</p>
            <code className="block bg-gray-100 p-2 rounded text-sm break-all">{inviteLink}</code>
          </div>
        )}
      </div>

      {/* ✅ Logout button below the box */}
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </main>
  );
}
