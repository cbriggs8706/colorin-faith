import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { SiteHeader } from '@/components/site-header'

const displayFont = Baloo_2({
	variable: '--font-display',
	subsets: ['latin'],
})

const bodyFont = Nunito({
	variable: '--font-body',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	metadataBase: new URL('https://colorinfaithprintables.com'),
	title: {
		default: 'Color in Faith Printables',
		template: '%s | Color in Faith Printables',
	},
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: 'any' },
			{ url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
			{ url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
		],
		apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
		shortcut: ['/favicon.ico'],
	},
	manifest: '/site.webmanifest',
	description:
		'Playful, faith-filled printable coloring pages for kids, families, and classrooms.',
	openGraph: {
		title: 'Color in Faith Printables',
		description:
			'Bright, joy-filled printable coloring pages made for families and ministry moments.',
		url: 'https://colorinfaithprintables.com',
		siteName: 'Color in Faith Printables',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Color in Faith Printables',
		description:
			'Faith-based printable coloring pages for screen-free fun, Sunday school, and family connection.',
	},
	appleWebApp: {
		title: 'Color in Faith',
		capable: true,
		statusBarStyle: 'default',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang="en"
			data-scroll-behavior="smooth"
			className={`${displayFont.variable} ${bodyFont.variable} scroll-smooth`}
		>
			<body>
				<CartProvider>
					<div className="page-shell">
						<SiteHeader />
						<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 sm:px-6 lg:px-8">
							{children}
						</main>
					</div>
				</CartProvider>
			</body>
		</html>
	)
}
