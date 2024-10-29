import { NextResponse } from 'next/server'
import { EmailInfoCrawler } from 'lib/emailInfoCrawler'
import { getTableInfo } from 'lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

let crawler: EmailInfoCrawler | null = null;

export async function GET() {
  try {
    // Log the crawled_data table schema
    const tableInfo = await getTableInfo('crawled_data')
    console.log('crawled_data table schema:', tableInfo)

    return NextResponse.json({ message: 'GET request received', tableInfo })
  } catch (error) {
    console.error('GET error:', error)
    // Return more detailed error information
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, startUrl, maxPages, concurrency } = body

    const configPath = path.join(process.cwd(), 'crawler-config.json')
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`)
    }

    switch (action) {
      case 'status':
        return NextResponse.json({ isRunning: crawler !== null && crawler.isRunning() })

      case 'start':
        if (crawler && crawler.isRunning()) {
          return NextResponse.json({ error: 'Crawler is already running' }, { status: 400 })
        }
        if (!startUrl) {
          return NextResponse.json({ error: 'Start URL is required' }, { status: 400 })
        }
        try {
          crawler = new EmailInfoCrawler(configPath)
          crawler.on('log', (message) => {
            console.log(message)
          })
          crawler.on('result', (result) => {
            console.log('Crawl result:', result)
          })
          // Start the crawl process with the provided startUrl, maxPages, and concurrency
          crawler.crawl(startUrl, maxPages, concurrency).then(() => {
            console.log('Crawl completed')
            crawler = null
          }).catch((error) => {
            console.error('Crawl error:', error)
            crawler = null
          })
          return NextResponse.json({ message: 'Crawler started' })
        } catch (error) {
          console.error('Error initializing crawler:', error)
          return NextResponse.json({ 
            error: 'Failed to initialize crawler',
            details: (error as Error).message,
            stack: (error as Error).stack
          }, { status: 500 })
        }

      case 'stop':
        if (crawler && crawler.isRunning()) {
          crawler.stop()
          return NextResponse.json({ message: 'Crawler stopping' })
        } else {
          return NextResponse.json({ error: 'No crawler is currently running' }, { status: 400 })
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('POST error:', error)
    // Return more detailed error information
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    }, { status: 500 })
  }
}
