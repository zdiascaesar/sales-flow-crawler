'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../components/LoginForm.js';
import { supabase } from '../../lib/supabase.js';
export default function LoginPage() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('Login page - User already authenticated, redirecting to dashboard');
                router.push('/dashboard');
            }
            else {
                setLoading(false);
            }
        };
        checkSession();
    }, [router]);
    if (loading) {
        return _jsx("div", { children: "Loading..." });
    }
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gray-100", children: _jsx(LoginForm, {}) }));
}
//# sourceMappingURL=page.js.map