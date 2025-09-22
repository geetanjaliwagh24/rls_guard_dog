import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function StudentPage() {
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Logout error:', error.message);
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setError('No active session. Please log in.');
        setLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || roleData?.role !== 'student') {
        setError('Access denied. You are not a student.');
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('id, score, student_id, classroom_id, progress_classroom_id_fkey(name)')
        .eq('student_id', user.id);

      if (progressError) {
        setError('Failed to fetch your progress.');
        console.error('❌ Progress fetch error:', progressError.message);
      } else {
        setProgress(progressData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-6">🔄 Loading student dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">⚠️ {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🎓 Student Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🔓 Logout
        </button>
      </div>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">Classroom Name</th>
          </tr>
        </thead>
        <tbody>
          {progress.map((record) => (
            <tr key={record.id} className="text-center">
              <td className="p-2 border">{record.score}</td>
              <td className="p-2 border">
                {record.progress_classroom_id_fkey?.name || 'Unknown Classroom'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
