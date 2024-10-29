'use client'

import { useRouter } from 'next/navigation'

const LogoutButton = () => {
  const router = useRouter()

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      router.push('/login')
      router.refresh()
    } else {
      console.error('Logout failed')
    }
  }

  return (
    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
      Logout
    </button>
  )
}

export default LogoutButton
