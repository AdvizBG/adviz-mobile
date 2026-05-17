/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink:           '#1B1B43',
        'ink-soft':    '#2D2D5C',
        'purple-deep': '#3E1D87',
        'purple-mid':  '#5254CF',
        'purple-100':  '#E0E0FF',
        'purple-200':  '#CBCBFF',
        'purple-300':  '#9192FF',
        peach:         '#FFBC96',
        coral:         '#FE5B52',
        teal:          '#2A9D8F',
        cream:         '#FAF7F2',
        line:          '#ECE9E2',
        'line-strong': '#DAD6CC',
      },
      fontFamily: {
        display: ['InriaSans_400Regular'],
        sans: ['Inter_400Regular'],
      },
    },
  },
  plugins: [],
};
