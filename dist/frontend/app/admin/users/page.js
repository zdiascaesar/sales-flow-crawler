'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [logs, setLogs] = useState([]);
    const supabase = createClientComponentClient();
    const addLog = useCallback((message) => {
        setLogs(prevLogs => [...prevLogs, message]);
        console.log(message);
    }, []);
    const fetchUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.admin.listUsers();
            if (error)
                throw error;
            setUsers(data.users);
            addLog(`Fetched ${data.users.length} users`);
        }
        catch (error) {
            addLog(`Error fetching users: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [supabase.auth.admin, addLog]);
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    const createUser = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: newUserEmail,
                password: newUserPassword,
                email_confirm: true
            });
            if (error)
                throw error;
            addLog(`Created user: ${data.user.email}`);
            fetchUsers();
            setNewUserEmail('');
            setNewUserPassword('');
        }
        catch (error) {
            addLog(`Error creating user: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    const resetPassword = async (userId) => {
        try {
            const { error } = await supabase.auth.admin.updateUserById(userId, { password: 'newpassword' });
            if (error)
                throw error;
            addLog(`Reset password for user ID: ${userId}`);
        }
        catch (error) {
            addLog(`Error resetting password: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "User Management" }), _jsxs(Card, { className: "mb-8", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create New User" }), _jsx(CardDescription, { children: "Add a new user to the system" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: createUser, className: "space-y-4", children: [_jsx(Input, { type: "email", placeholder: "Email", value: newUserEmail, onChange: (e) => setNewUserEmail(e.target.value), required: true }), _jsx(Input, { type: "password", placeholder: "Password", value: newUserPassword, onChange: (e) => setNewUserPassword(e.target.value), required: true }), _jsx(Button, { type: "submit", children: "Create User" })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "User List" }), _jsx(CardDescription, { children: "Manage existing users" })] }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: users.map(user => (_jsxs("li", { className: "flex justify-between items-center", children: [_jsx("span", { children: user.email }), _jsx(Button, { onClick: () => resetPassword(user.id), children: "Reset Password" })] }, user.id))) }) })] }), logs.length > 0 && (_jsxs(Card, { className: "mt-8", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Logs" }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-1", children: logs.map((log, index) => (_jsx("li", { className: "text-sm", children: log }, index))) }) })] }))] }));
}
//# sourceMappingURL=page.js.map