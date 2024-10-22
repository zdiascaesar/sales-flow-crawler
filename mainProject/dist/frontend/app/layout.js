import { jsx as _jsx } from "react/jsx-runtime";
import './globals.css';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
export const metadata = {
    title: 'Email Crawler Dashboard',
    description: 'Dashboard for managing and viewing crawled email data',
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { className: inter.className, children: children }) }));
}
//# sourceMappingURL=layout.js.map