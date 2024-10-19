'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
export default function CrawlerPage() {
    const [startUrl, setStartUrl] = useState('');
    const [maxPages, setMaxPages] = useState('10000');
    const [concurrency, setConcurrency] = useState('5');
    const [crawling, setCrawling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
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
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(Boolean);
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'progress') {
                            setProgress(data.progress);
                        }
                        else if (data.type === 'result') {
                            setResults(prev => [...prev, data.result]);
                        }
                        else if (data.type === 'log') {
                            setLogs(prev => [...prev, data.message]);
                        }
                        else if (data.type === 'error') {
                            setError(data.message);
                            setCrawling(false);
                        }
                        else if (data.type === 'complete') {
                            setCrawling(false);
                        }
                    }
                }
            }
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
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
        }
        catch (err) {
            console.error('Error stopping crawler:', err);
            setError('Failed to stop the crawler');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Crawler" }), _jsxs(Card, { className: "p-6 bg-blue-100", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Crawler Status" }), _jsx("p", { className: `text-lg ${crawling ? 'text-green-600' : 'text-red-600'}`, children: crawling ? 'A crawl job is currently running' : 'No crawl jobs are currently running' })] }), _jsx(Card, { className: "p-6", children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); startCrawl(); }, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "startUrl", className: "block text-sm font-medium text-gray-700", children: "Start URL" }), _jsx(Input, { id: "startUrl", type: "url", value: startUrl, onChange: (e) => setStartUrl(e.target.value), required: true, placeholder: "https://example.com" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "maxPages", className: "block text-sm font-medium text-gray-700", children: "Max Pages" }), _jsx(Input, { id: "maxPages", type: "number", value: maxPages, onChange: (e) => setMaxPages(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "concurrency", className: "block text-sm font-medium text-gray-700", children: "Concurrency" }), _jsx(Input, { id: "concurrency", type: "number", value: concurrency, onChange: (e) => setConcurrency(e.target.value), required: true })] }), _jsx(Button, { type: "submit", disabled: crawling, children: crawling ? 'Crawling...' : 'Start Crawl' }), crawling && (_jsx(Button, { type: "button", onClick: stopCrawl, className: "ml-4", children: "Stop Crawl" }))] }) }), crawling && (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Crawl Progress" }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700", children: _jsx("div", { className: "bg-blue-600 h-2.5 rounded-full", style: { width: `${progress}%` } }) }), _jsxs("p", { className: "mt-2", children: [progress, "% complete"] })] })), error && (_jsxs(Card, { className: "p-6 bg-red-100", children: [_jsx("h2", { className: "text-xl font-semibold mb-4 text-red-800", children: "Error" }), _jsx("p", { className: "text-red-700", children: error })] })), logs.length > 0 && (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Crawl Logs" }), _jsx("div", { className: "max-h-60 overflow-y-auto", children: logs.map((log, index) => (_jsx("p", { className: "text-sm", children: log }, index))) })] })), results.length > 0 && (_jsxs(Card, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Crawl Results" }), _jsx("ul", { className: "space-y-2", children: results.map((result, index) => (_jsxs("li", { children: [_jsx("strong", { children: result.url }), ": ", result.emails.join(', ')] }, index))) })] }))] }));
}
//# sourceMappingURL=page.js.map