'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Welcome to the Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Crawled Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">1,234</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emails Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">567</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last Crawl Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl">2023-05-15</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
