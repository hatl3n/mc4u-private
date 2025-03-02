# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Kjørt for å bygge dette første gang

apt-get update && apt-get install npm

npm create vite@latest mc4u --template react
cd mc4u
npm install
npm install @supabase/supabase-js react-router-dom tailwindcss

apt-get update && apt-get install nano

Senere fjernet tailwindcss og lastet inn:
npm install react-bootstrap bootstrap
