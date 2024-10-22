'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';

interface CrawlResult {
  url: string;
  emails: string[];
}

export default function CrawlerPage() {
  const [startUrl, setStartUrl] = useState('');
  const [maxPages, setMaxPages] = useState('10000');
  const [concurrency, setConcurrency] = useState('5');
  const [crawling, setCrawling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCrawlerStatus();
    const intervalId = setInterval(checkCrawlerStatus, 5000); // Check status every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  const checkCrawlerStatus = async () => {
    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status' }),
      });

      if (!response.ok) {
        throw new Error('Failed to check crawler status');
      }

      const data = await response.json();
      setCrawling(data.isRunning);
    } catch (err) {
      console.error('Error checking crawler status:', err);
    }
  };

  const startCrawl = async () => {
    setCrawling(true);
    setProgress(0);
    setResults([]);
    setLogs([]);
    setError(null);

    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          startUrl,
          maxPages: parseInt(maxPages),
          concurrency: parseInt(concurrency),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start the crawler');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { done: readerDone, value } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'progress') {
                setProgress(data.progress);
              } else if (data.type === 'result') {
                setResults(prev => [...prev, data.result]);
              } else if (data.type === 'log') {
                setLogs(prev => [...prev, data.message]);
              } else if (data.type === 'error') {
                setError(data.message);
                setCrawling(false);
              } else if (data.type === 'complete') {
                setCrawling(false);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setCrawling(false);
    }
  };

  const stopCrawl = async () => {
    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop the crawler');
      }

      const data = await response.json();
      setLogs(prev => [...prev, data.message]);
    } catch (err) {
      console.error('Error stopping crawler:', err);
      setError('Failed to stop the crawler');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Crawler</h1>
      
      <Card className="p-6 bg-blue-100">
        <h2 className="text-xl font-semibold mb-2">Crawler Status</h2>
        <p className={`text-lg ${crawling ? 'text-green-600' : 'text-red-600'}`}>
          {crawling ? 'A crawl job is currently running' : 'No crawl jobs are currently running'}
        </p>
      </Card>

      <Card className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); startCrawl(); }} className="space-y-4">
          <div>
            <label htmlFor="startUrl" className="block text-sm font-medium text-gray-700">Start URL</label>
            <Input
              id="startUrl"
              type="url"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              required
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700">Max Pages</label>
            <Input
              id="maxPages"
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="concurrency" className="block text-sm font-medium text-gray-700">Concurrency</label>
            <Input
              id="concurrency"
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={crawling}>
            {crawling ? 'Crawling...' : 'Start Crawl'}
          </Button>
          {crawling && (
            <Button type="button" onClick={stopCrawl} className="ml-4">
              Stop Crawl
            </Button>
          )}
        </form>
      </Card>

      {crawling && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Crawl Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-2">{progress}% complete</p>
        </Card>
      )}

      {error && (
        <Card className="p-6 bg-red-100">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Error</h2>
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {logs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Crawl Logs</h2>
          <div className="max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <p key={index} className="text-sm">{log}</p>
            ))}
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Crawl Results</h2>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index}>
                <strong>{result.url}</strong>: {result.emails.join(', ')}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
