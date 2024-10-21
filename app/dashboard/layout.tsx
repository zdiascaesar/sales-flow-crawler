'use client'

import { LogoutButton } from '../../components/LogoutButton'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      // For now, we'll assume all authenticated users are admins
      setIsAdmin(!!user)
    }
    checkAdminStatus()
  }, [supabase.auth])

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link href="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/crawler" className="flex items-center text-gray-700 hover:text-gray-900">
                Crawler
              </Link>
              <Link href="/dashboard/crawled-data" className="flex items-center text-gray-700 hover:text-gray-900">
                Crawled Data
              </Link>
              <Link href="/dashboard/send-emails" className="flex items-center text-gray-700 hover:text-gray-900">
                Send Emails
              </Link>
              {isAdmin && (
                <Link href="/admin/users" className="flex items-center text-gray-700 hover:text-gray-900">
                  Admin
                </Link>
              )}
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
