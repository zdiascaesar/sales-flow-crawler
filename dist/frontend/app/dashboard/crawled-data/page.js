'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
export default function CrawledDataPage() {
    const [crawledData, setCrawledData] = useState([]);
    const [count, setCount] = useState(null);
    const [error, setError] = useState(null);
    const supabase = createClientComponentClient();
    useEffect(() => {
        async function fetchData() {
            try {
                const pageSize = 50; // Number of items per page
                const { data, error, count } = await supabase
                    .from('crawled_data')
                    .select('*', { count: 'exact' })
                    .order('crawl_date', { ascending: false })
                    .range(0, pageSize - 1);
                if (error) {
                    throw error;
                }
                setCrawledData(data);
                setCount(count);
            }
            catch (error) {
                console.error('Error fetching crawled data:', error);
                setError(error instanceof Error ? error : new Error('An unknown error occurred'));
            }
        }
        fetchData();
    }, [supabase]);
    if (error) {
        return (_jsxs("div", { className: "p-4 bg-red-100 border border-red-400 text-red-700 rounded", children: ["Error loading crawled data: ", error.message, _jsx("br", {}), "Error details: ", JSON.stringify(error)] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Crawled Data" }), crawledData && crawledData.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "URL" }), _jsx(TableHead, { children: "Page Title" }), _jsx(TableHead, { children: "Page Description" }), _jsx(TableHead, { children: "Emails" }), _jsx(TableHead, { children: "Crawl Date" })] }) }), _jsx(TableBody, { children: crawledData.map((item) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: item.url }), _jsx(TableCell, { children: item.page_title }), _jsx(TableCell, { children: item.page_description }), _jsx(TableCell, { children: item.emails.join(', ') }), _jsx(TableCell, { children: new Date(item.crawl_date).toLocaleString() })] }, item.id))) })] }), _jsxs("div", { className: "mt-4", children: ["Showing ", crawledData.length, " of ", count ?? 'unknown', " results"] })] })) : (_jsx("div", { className: "p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded", children: "No crawled data available." }))] }));
}
//# sourceMappingURL=page.js.map