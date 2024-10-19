'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
export default function DashboardPage() {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Welcome to the Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total Crawled Pages" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-4xl font-bold", children: "1,234" }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Emails Found" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-4xl font-bold", children: "567" }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Last Crawl Date" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-xl", children: "2023-05-15" }) })] })] })] }));
}
//# sourceMappingURL=page.js.map