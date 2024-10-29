'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'

interface User {
  id: string
  email: string
}

interface SupabaseClient {
  auth: {
    admin: {
      listUsers: () => Promise<{ data: { users: User[] }, error: Error | null }>
      createUser: (options: { email: string, password: string, email_confirm: boolean }) => Promise<{ data: { user: User }, error: Error | null }>
      updateUserById: (id: string, attributes: { password: string }) => Promise<{ error: Error | null }>
    }
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClientComponentClient() as SupabaseClient

  const addLog = useCallback((message: string) => {
    setLogs(prevLogs => [...prevLogs, message])
    // console.log(message) // Removed to resolve ESLint warning
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      setUsers(data.users)
      addLog(`Fetched ${data.users.length} users`)
    } catch (error) {
      addLog(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [supabase.auth.admin, addLog])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      })
      if (error) throw error
      addLog(`Created user: ${data.user.email}`)
      fetchUsers()
      setNewUserEmail('')
      setNewUserPassword('')
    } catch (error) {
      addLog(`Error creating user: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const resetPassword = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: 'newpassword' }
      )
      if (error) throw error
      addLog(`Reset password for user ID: ${userId}`)
    } catch (error) {
      addLog(`Error resetting password: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
            <Button type="submit">Create User</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage existing users</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {users.map(user => (
              <li key={user.id} className="flex justify-between items-center">
                <span>{user.email}</span>
                <Button onClick={() => resetPassword(user.id)}>Reset Password</Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {logs.map((log, index) => (
                <li key={index} className="text-sm">{log}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
