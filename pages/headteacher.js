import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function HeadTeacherPage() {
  const [progress, setProgress] = useState([]);
  const [filteredProgress, setFilteredProgress] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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

      if (roleError || roleData?.role !== 'head_teacher') {
        setError('Access denied. You are not a head teacher.');
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          score,
          student:student_id ( name ),
          classroom:classroom_id ( name )
        `);

      if (progressError) {
        setError('Failed to fetch progress. RLS may be blocking access.');
        console.error('❌ Progress fetch error:', progressError.message);
      } else {
        setProgress(progressData);
        setFilteredProgress(progressData);

        const uniqueClassrooms = Array.from(
          new Set(progressData.map((record) => record.classroom?.name))
        ).filter(Boolean);

        setClassrooms(uniqueClassrooms);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...progress];

    if (selectedClassroom !== 'all') {
      filtered = filtered.filter(
        (record) => record.classroom?.name === selectedClassroom
      );
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter((record) =>
        record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProgress(filtered);
  }, [selectedClassroom, searchTerm, progress]);

  if (loading) return <p className="p-6">🔄 Loading head teacher dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">⚠️ {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧑‍🏫 Head Teacher Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🔓 Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Filter by Classroom:</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-medium">Search Student:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter name"
            className="px-3 py-2 border rounded"
          />
        </div>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Student</th>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">Classroom</th>
          </tr>
        </thead>
        <tbody>
          {filteredProgress.map((record) => (
            <tr key={record.id} className="text-center">
              <td className="p-2 border">{record.student?.name || 'Unknown'}</td>
              <td className="p-2 border">{record.score}</td>
              <td className="p-2 border">{record.classroom?.name || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
