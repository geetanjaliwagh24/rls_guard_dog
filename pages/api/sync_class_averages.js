import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      MONGO_URI,
      MONGO_DB,
      MONGO_COLLECTION,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = process.env;

    if (!MONGO_URI || !MONGO_DB || !MONGO_COLLECTION || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    console.log('✅ Starting sync_class_averages');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client initialized');

    const { data, error } = await supabase
      .from('progress')
      .select('score, classroom_id');

    if (error || !data) {
      console.error('❌ Supabase fetch error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to fetch progress data' });
    }

    console.log('✅ Progress data fetched:', data.length);

    // Group scores by classroom_id
    const grouped = {};
    for (const record of data) {
      const id = record.classroom_id;
      if (!id) continue;
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(record.score ?? 0);
    }

    // Calculate averages
    const averages = Object.entries(grouped).map(([id, scores]) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return {
        classroom_id: id,
        average: parseFloat(avg.toFixed(2)),
        updated_at: new Date().toISOString(),
      };
    });

    console.log('✅ Averages calculated:', averages.length);

    // Connect to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ MongoDB connected');

    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLLECTION);

    await collection.deleteMany({});
    console.log('✅ Cleared old averages');

    await collection.insertMany(averages);
    console.log('✅ Inserted new averages:', averages.length);

    await client.close();
    console.log('✅ MongoDB connection closed');

    return res.status(200).json({ saved: averages });
  } catch (err) {
    console.error('❌ Function error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
