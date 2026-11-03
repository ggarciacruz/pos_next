import frappeUIPreset from "frappe-ui/tailwind";
import colors from "tailwindcss/colors";

export default {
	presets: [frappeUIPreset],
	content: [
		"./index.html",
		"./src/**/*.{vue,js,ts,jsx,tsx}",
		"./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
		"../../../../packages/mdx_ui/components/**/*.{vue,js,ts,jsx,tsx}",
		"../../../../packages/mdx_ui/composables/**/*.{vue,js,ts,jsx,tsx}",
		"../../../../packages/mdx_ui/index.ts",
	],
	theme: {
		extend: {
			colors: {
				emerald: colors.emerald,
				slate: colors.slate,
				indigo: colors.indigo,
				rose: colors.rose,
				amber: colors.amber,
				purple: colors.purple,
				blue: colors.blue,
				teal: colors.teal,
				red: colors.red,
			},
		},
	},
	plugins: [],
};
