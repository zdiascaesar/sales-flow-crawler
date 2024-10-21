'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function LoginForm() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpassword')
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  const addLog = useCallback((message: string) => {
    setLogs(prevLogs => [...prevLogs, message])
    // Console logging is used for development and debugging purposes
    console.log(message)
  }, [])

  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setLogs([])
    try {
      addLog(`Attempting to sign in with email: ${email}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        addLog(`Login error: ${error.message}`)
        throw error
      }

      addLog(`Sign in successful. User ID: ${data.user?.id}`)
      addLog(`User email: ${data.user?.email}`)
      addLog(`User role: ${data.user?.role}`)
      
      // Check if session is set
      const { data: sessionData } = await supabase.auth.getSession()
      addLog(`Session check: ${sessionData.session ? 'Session is set' : 'No session found'}`)
      
      if (sessionData.session) {
        addLog(`Session user ID: ${sessionData.session.user.id}`)
        const expiresAt = sessionData.session.expires_at
        if (expiresAt) {
          addLog(`Session expires at: ${new Date(expiresAt * 1000).toLocaleString()}`)
        }
      } else {
        throw new Error('No session created after login')
      }

      addLog('Redirecting to dashboard...')
      router.push('/dashboard')
      
    } catch (error) {
      if (error instanceof Error) {
        addLog(`Caught error: ${error.message}`)
        setError(error.message)
      } else {
        addLog('Caught unexpected error')
        setError('An unexpected error occurred')
      }
    }
  }, [email, password, addLog, supabase.auth, router])

  useEffect(() => {
    // Attempt automatic login when component mounts
    handleLogin();
  }, [handleLogin]);

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="email"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Input
                id="password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <Button className="w-full mt-6" type="submit">
            Login
          </Button>
        </form>
        {logs.length > 0 && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Logs:</h3>
            {logs.map((log, index) => (
              <p key={index} className="text-sm">{log}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
