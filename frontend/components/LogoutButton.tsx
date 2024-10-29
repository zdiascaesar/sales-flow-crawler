import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { supabase } from '../lib/supabase'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
