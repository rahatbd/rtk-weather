import type {ReactNode} from 'react';
import StoreProvider from './StoreProvider';
import {Inter} from 'next/font/google';
import './globals.css';
import '@microcharts/react/styles.css';

const inter = Inter({subsets: ['latin']});

export const metadata = {
    title: 'Weather',
};

export const viewport = {
    colorScheme: 'light dark',
};

export default function RootLayout({children}: {children: ReactNode}) {
    return (
        <html lang="en-CA">
            <body className={inter.className}>
                <h1 className="sr-only">Weather</h1>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
