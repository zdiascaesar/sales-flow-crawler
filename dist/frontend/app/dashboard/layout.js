'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LogoutButton } from '../../components/LogoutButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
export default function DashboardLayout({ children, }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClientComponentClient();
    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            // For now, we'll assume all authenticated users are admins
            setIsAdmin(!!user);
        };
        checkAdminStatus();
    }, [supabase.auth]);
    return (_jsxs("div", { className: "min-h-screen bg-gray-100", children: [_jsx("nav", { className: "bg-white shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsxs("div", { className: "flex space-x-8", children: [_jsx(Link, { href: "/dashboard", className: "flex items-center text-gray-700 hover:text-gray-900", children: "Dashboard" }), _jsx(Link, { href: "/dashboard/crawler", className: "flex items-center text-gray-700 hover:text-gray-900", children: "Crawler" }), _jsx(Link, { href: "/dashboard/crawled-data", className: "flex items-center text-gray-700 hover:text-gray-900", children: "Crawled Data" }), _jsx(Link, { href: "/dashboard/send-emails", className: "flex items-center text-gray-700 hover:text-gray-900", children: "Send Emails" }), isAdmin && (_jsx(Link, { href: "/admin/users", className: "flex items-center text-gray-700 hover:text-gray-900", children: "Admin" }))] }), _jsx("div", { className: "flex items-center", children: _jsx(LogoutButton, {}) })] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8", children: children })] }));
}
//# sourceMappingURL=layout.js.map