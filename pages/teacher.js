import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import LogoutButton from '../components/LogoutButton';

export default function TeacherPage() {
  const [progress, setProgress] = useState([]);
  const [editing, setEditing] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (sessionError || !user) {
        setError('No active session.');
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || roleData?.role !== 'teacher') {
        setError('Access denied. You are not a teacher.');
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          score,
          updated_at,
          student:student_id ( name ),
          classroom:classroom_id ( id, name, teacher_id )
        `);

      if (progressError) {
        setError('Failed to fetch progress. RLS may be blocking access.');
        console.error(progressError.message);
      } else {
        setProgress(progressData);
        const uniqueClassrooms = Array.from(
          new Set(progressData.map((r) => r.classroom?.name))
        ).filter(Boolean);
        setClassrooms(uniqueClassrooms);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredProgress = progress.filter((record) => {
    const matchesClassroom =
      selectedClassroom === 'all' || record.classroom?.name === selectedClassroom;
    const matchesSearch =
      !searchTerm ||
      record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClassroom && matchesSearch;
  });

  const handleEdit = (id, newScore) => {
    setEditing((prev) => ({ ...prev, [id]: newScore }));
  };

  const handleReset = (id) => {
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editing).map(([id, score]) => ({ id, score }));
    if (updates.some((u) => u.score < 0 || u.score > 100)) {
      alert('Scores must be between 0 and 100');
      return;
    }

    for (const update of updates) {
      const { error } = await supabase
        .from('progress')
        .update({ score: update.score })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Failed to update ${update.id}:`, error.message);
        alert(`Failed to update score for record ${update.id}`);
      } else {
        await fetch('/api/sync_progress_to_mongo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ record: update }),
        });
      }
    }

    const refreshed = await supabase
      .from('progress')
      .select(`
        id,
        score,
        updated_at,
        student:student_id ( name ),
        classroom:classroom_id ( id, name, teacher_id )
      `);

    if (refreshed.error) {
      console.error('❌ Failed to refresh progress:', refreshed.error.message);
      alert('Failed to refresh progress after save.');
    } else {
      setProgress(refreshed.data);
      setEditing({});
    }
  };

  const handleSyncAverages = async () => {
  try {
    const res = await fetch('/api/sync_class_averages', { method: 'POST' });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Sync failed');
    }

    console.log('✅ Sync result:', result);
    alert('Sync successful!');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    alert('Sync failed. Check logs for details.');
  }
};

  const handleExportCSV = () => {
    const rows = filteredProgress.map((r) => ({
      Student: r.student?.name,
      Score: r.score,
      Classroom: r.classroom?.name,
      Updated: r.updated_at,
    }));

    if (rows.length === 0) {
      alert('No data to export.');
      return;
    }

    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClassAverage = () => {
    const scores = filteredProgress.map((r) => r.score);
    if (scores.length === 0) return null;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return avg.toFixed(2);
  };

  if (loading) return <p className="p-6">🔄 Loading teacher dashboard…</p>;
  if (error) return <p className="p-6 text-red-600">⚠️ {error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">👩‍🏫 Teacher Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Classroom:</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All</option>
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

        <button
          onClick={handleBulkSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          💾 Save All
        </button>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          📤 Export CSV
        </button>

        <button
          onClick={handleSyncAverages}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🔁 Sync Class Averages
        </button>
      </div>

      <p className="mb-2 font-medium">
        📊 Class Average: {getClassAverage() ?? 'N/A'}
      </p>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Student</th>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">Classroom</th>
            <th className="p-2 border">Last Updated</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
                <tbody>
          {filteredProgress.map((record) => {
            const isEditable = record.classroom?.teacher_id === userId;
            const isEdited =
              editing[record.id] !== undefined &&
              editing[record.id] !== record.score;

            return (
              <tr key={record.id} className="text-center">
                <td className="p-2 border">{record.student?.name || 'Unknown'}</td>
                <td className="p-2 border">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!isEditable}
                    value={editing[record.id] ?? record.score}
                    onChange={(e) =>
                      handleEdit(record.id, parseInt(e.target.value))
                    }
                    className={`w-20 px-2 py-1 border rounded ${
                      isEdited ? 'border-yellow-500' : 'border-gray-300'
                    }`}
                  />
                </td>
                <td className="p-2 border">{record.classroom?.name || 'Unknown'}</td>
                <td className="p-2 border">
                  {record.updated_at
                    ? new Date(record.updated_at).toLocaleString()
                    : 'N/A'}
                </td>
                <td className="p-2 border">
                  {isEditable ? (
                    <button
                      onClick={() => handleReset(record.id)}
                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      ↩️ Reset
                    </button>
                  ) : (
                    <span className="text-gray-500 italic">Locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
