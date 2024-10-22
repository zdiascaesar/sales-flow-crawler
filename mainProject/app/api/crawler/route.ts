import { NextResponse } from 'next/server'
import { EmailInfoCrawler } from '../../../lib/emailInfoCrawler'
import { getTableInfo } from '../../../lib/supabase'
import { loadConfig } from '../../../lib/config'

let crawler: EmailInfoCrawler | null = null;

function log(message: string) {
  const timestamp = new Date().toISOString()
  console.log(`${timestamp}: ${message}`)
}

export async function GET() {
  try {
    // Log the crawled_data table schema
    const tableInfo = await getTableInfo('crawled_data')
    log('Fetched crawled_data table schema')

    return NextResponse.json({ message: 'GET request received', tableInfo })
  } catch (error) {
    log(`GET error: ${(error as Error).message}`)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, startUrl, maxPages, concurrency } = body

    const configPath = 'crawler-config.json'
    try {
      loadConfig(configPath)
    } catch (error) {
      log(`Error loading config: ${(error as Error).message}`)
      return NextResponse.json({ error: 'Failed to load crawler configuration' }, { status: 500 })
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
        crawler = new EmailInfoCrawler(configPath)
        crawler.on('log', (message) => {
          log(message)
        })
        crawler.on('result', (result) => {
          log(`Crawl result: ${JSON.stringify(result)}`)
        })
        // Start the crawl process in the background
        crawler.crawl(startUrl, maxPages, concurrency).then(() => {
          log('Crawl completed')
          crawler = null
        }).catch((error) => {
          log(`Crawl error: ${error.message}`)
          crawler = null
        })
        return NextResponse.json({ message: 'Crawler started in the background' })

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
    log(`POST error: ${(error as Error).message}`)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
