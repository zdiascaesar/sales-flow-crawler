'use client'

import { useEffect, useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "../../../components/ui/button"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const pageSize = 10

  const fetchData = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      const { data, error, count } = await supabase
        .from('crawled_data')
        .select('*', { count: 'exact' })
        .order('crawl_date', { ascending: false })
        .range(start, end)

      if (error) {
        throw error
      }

      setCrawledData(data as CrawledDataItem[])
      setCount(count)
    } catch (error) {
      console.error('Error fetching crawled data:', error)
      setError(error instanceof Error ? error : new Error('An unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase, pageSize])

  useEffect(() => {
    fetchData(currentPage)
  }, [currentPage, fetchData])

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

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
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : crawledData && crawledData.length > 0 ? (
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
          <div className="mt-4 flex items-center justify-between">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, count ?? 0)} of {count ?? 'unknown'} results
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
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
