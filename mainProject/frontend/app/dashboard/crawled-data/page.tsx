'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CrawledDataItem {
  id: string
  url: string
  page_title: string
  page_description: string
  emails: string[]
  crawl_date: string
}

export default function CrawledDataPage() {
  const [crawledData, setCrawledData] = useState<CrawledDataItem[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    async function fetchData() {
      try {
        const pageSize = 50 // Number of items per page
        const { data, error, count } = await supabase
          .from('crawled_data')
          .select('*', { count: 'exact' })
          .order('crawl_date', { ascending: false })
          .range(0, pageSize - 1)

        if (error) {
          throw error
        }

        setCrawledData(data as CrawledDataItem[])
        setCount(count)
      } catch (error) {
        console.error('Error fetching crawled data:', error)
        setError(error instanceof Error ? error : new Error('An unknown error occurred'))
      }
    }

    fetchData()
  }, [supabase])

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading crawled data: {error.message}
        <br />
        Error details: {JSON.stringify(error)}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Crawled Data</h2>
      {crawledData && crawledData.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Page Title</TableHead>
                <TableHead>Page Description</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Crawl Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawledData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.url}</TableCell>
                  <TableCell>{item.page_title}</TableCell>
                  <TableCell>{item.page_description}</TableCell>
                  <TableCell>{item.emails.join(', ')}</TableCell>
                  <TableCell>{new Date(item.crawl_date).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            Showing {crawledData.length} of {count ?? 'unknown'} results
          </div>
        </>
      ) : (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          No crawled data available.
        </div>
      )}
    </div>
  )
}
