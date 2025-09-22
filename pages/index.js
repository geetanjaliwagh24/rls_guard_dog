import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">Welcome to RLS Guard Dog 🐾</h1>
        <p className="text-gray-600 mb-6">
          A secure, role-based classroom dashboard built with Next.js and Supabase.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/login">
            <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="w-full border border-indigo-600 text-indigo-600 py-2 rounded hover:bg-indigo-50 transition">
              Sign Up
            </button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-400 italic">
          Role-based access powered by Supabase RLS
        </p>
      </div>
    </main>
  )
}
