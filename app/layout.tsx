import {type ReactNode} from 'react';
import StoreProvider from './StoreProvider';
import {Inter} from 'next/font/google';
import '@microcharts/react/styles.css';
// import './globals.css';

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
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
