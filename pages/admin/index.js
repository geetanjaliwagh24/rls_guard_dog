import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/invite');
  }, [router]);

  return <p className="p-6">🔄 Redirecting to invite generator…</p>;
}
