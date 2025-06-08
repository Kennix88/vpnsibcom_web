import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-lg">
        Go Home
      </Link>
    </div>
  )
}
