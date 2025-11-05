/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1600px',
			},
		},
		extend: {
			colors: {
				surface: {
					'pure-black': '#000000',
					'near-black': '#0a0a0a',
					'dark-gray': '#141414',
					'light-gray': '#1e1e1e',
					'border-gray': '#282828',
				},
				primary: {
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					DEFAULT: '#3b82f6',
				},
				success: {
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					DEFAULT: '#22c55e',
				},
				warning: '#f59e0b',
				error: '#ef4444',
				info: '#06b6d4',
				text: {
					primary: '#e4e4e7',
					secondary: '#a1a1aa',
					tertiary: '#71717a',
					placeholder: '#52525b',
				},
				border: 'rgba(255, 255, 255, 0.1)',
			},
			fontFamily: {
				sans: ['Inter', 'PingFang SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
			},
			fontSize: {
				hero: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
				'hero-mobile': ['32px', { lineHeight: '1.1', fontWeight: '700' }],
			},
			spacing: {
				1: '4px',
				2: '8px',
				3: '12px',
				4: '16px',
				6: '24px',
				8: '32px',
				10: '40px',
				12: '48px',
				16: '64px',
				20: '80px',
			},
			borderRadius: {
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '24px',
			},
			boxShadow: {
				card: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.5)',
				'card-hover': '0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 16px rgba(59, 130, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.6)',
				'button-glow-primary': '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)',
				'button-glow-success': '0 0 24px rgba(34, 197, 94, 0.7), 0 0 48px rgba(34, 197, 94, 0.4)',
				'input-focus': '0 0 8px rgba(59, 130, 246, 0.4)',
			},
			transitionDuration: {
				fast: '150ms',
				normal: '250ms',
				slow: '400ms',
				slower: '600ms',
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)' },
					'50%': { boxShadow: '0 0 24px rgba(34, 197, 94, 0.7), 0 0 48px rgba(34, 197, 94, 0.4)' },
				},
			},
			animation: {
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			},
		},
	},
	plugins: [],
}