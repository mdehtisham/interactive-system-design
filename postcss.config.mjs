// structuredClone polyfill — Turbopack evaluates PostCSS config in a sandboxed
// VM context that strips Node.js built-ins. @tailwindcss/postcss v4 uses
// structuredClone internally; without this polyfill it throws a CssSyntaxError
// at globals.css:1:1 even on Node.js 22+.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
