'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.js';
export function LoginForm() {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('testpassword');
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const router = useRouter();
    const supabase = createClientComponentClient();
    const addLog = useCallback((message) => {
        setLogs(prevLogs => [...prevLogs, message]);
        console.log(message); // Also log to console for easier debugging
    }, []);
    const handleLogin = useCallback(async (e) => {
        e?.preventDefault();
        setError(null);
        setLogs([]);
        try {
            addLog(`Attempting to sign in with email: ${email}`);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                addLog(`Login error: ${error.message}`);
                throw error;
            }
            addLog(`Sign in successful. User ID: ${data.user?.id}`);
            addLog(`User email: ${data.user?.email}`);
            addLog(`User role: ${data.user?.role}`);
            // Check if session is set
            const { data: sessionData } = await supabase.auth.getSession();
            addLog(`Session check: ${sessionData.session ? 'Session is set' : 'No session found'}`);
            if (sessionData.session) {
                addLog(`Session user ID: ${sessionData.session.user.id}`);
                addLog(`Session expires at: ${new Date(sessionData.session.expires_at * 1000).toLocaleString()}`);
            }
            else {
                throw new Error('No session created after login');
            }
            addLog('Redirecting to dashboard...');
            router.push('/dashboard');
        }
        catch (error) {
            if (error instanceof Error) {
                addLog(`Caught error: ${error.message}`);
                setError(error.message);
            }
            else {
                addLog('Caught unexpected error');
                setError('An unexpected error occurred');
            }
        }
    }, [email, password, addLog, supabase.auth, router]);
    useEffect(() => {
        // Attempt automatic login when component mounts
        handleLogin();
    }, [handleLogin]);
    return (_jsxs(Card, { className: "w-[350px]", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Login" }), _jsx(CardDescription, { children: "Enter your credentials to access the dashboard." })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleLogin, children: [_jsxs("div", { className: "grid w-full items-center gap-4", children: [_jsx("div", { className: "flex flex-col space-y-1.5", children: _jsx(Input, { id: "email", placeholder: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoComplete: "username" }) }), _jsx("div", { className: "flex flex-col space-y-1.5", children: _jsx(Input, { id: "password", placeholder: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, autoComplete: "current-password" }) })] }), error && _jsx("p", { className: "text-red-500 text-sm mt-2", children: error }), _jsx(Button, { className: "w-full mt-6", type: "submit", children: "Login" })] }), logs.length > 0 && (_jsxs("div", { className: "mt-4 p-2 bg-gray-100 rounded", children: [_jsx("h3", { className: "font-bold mb-2", children: "Logs:" }), logs.map((log, index) => (_jsx("p", { className: "text-sm", children: log }, index)))] }))] })] }));
}
//# sourceMappingURL=LoginForm.js.map