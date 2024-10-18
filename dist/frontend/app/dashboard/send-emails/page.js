'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
export default function SendEmailsPage() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFeedback("");
        try {
            const response = await fetch('/api/send-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            if (response.status === 404 && data.noRecipientsFound) {
                setFeedback('No recipients found in the emails table. Please run the crawler to populate the table with email addresses.');
            }
            else if (!response.ok) {
                throw new Error(data.error || 'Failed to send emails');
            }
            else {
                setFeedback(`Email sending process completed. AI generated and sent ${data.sentCount} emails. Failed ${data.failedCount} emails.${data.failedCount > 0 ? ' Some emails failed to send.' : ''}`);
            }
        }
        catch (error) {
            console.error('Error sending emails:', error);
            setFeedback('Failed to send emails. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Send AI-Generated Emails" }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Compose Email Prompt" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "prompt", className: "block text-sm font-medium text-gray-700", children: "AI Prompt" }), _jsx(Textarea, { id: "prompt", value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: "Enter AI prompt for email generation (subject and body)", rows: 5, required: true })] }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Generating and Sending...' : 'Generate and Send Emails' }), feedback && (_jsx("div", { className: `mt-4 p-2 ${feedback.includes('Failed') || feedback.includes('No recipients found') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} rounded`, children: feedback }))] }) })] })] }));
}
//# sourceMappingURL=page.js.map