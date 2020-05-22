const {colors} = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      colors: {
        orange: {
          ...colors.orange,
          '500': 'hsl(30, 100%, 50%)',
        },
        gray: {
          100: 'hsl(204 45% 98%)',
          200: 'hsl(210 38% 95%)',
          300: 'hsl(214, 32%, 91%)',
          400: 'hsl(211, 25%, 84%)',
          500: 'hsl(214, 20%, 69%)',
          600: 'hsl(216, 15%, 52%)',
          700: 'hsl(218, 17%, 35%)',
          800: 'hsl(218, 23%, 23%)',
          900: 'hsl(220, 26%, 14%)',
        },
      },
    },
    fontFamily: {
      sans: [
        '"Fira Sans Condensed"',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      poppins: [
        'Poppins',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      mono: [
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ],
    },

    listStyleType: {
      none: 'none',
      decimal: 'decimal',
      square: 'square',
    },

    boxShadow: {
      orange: '0 0 0 6px hsl(30, 100%, 50%, 20%)',
      gray: '0 0 0 6px hsl(218, 23%, 23%, 20%)',
    },

    screens: {
      xs: '500px',
    },
  },

  variants: {},
  plugins: [],
};
