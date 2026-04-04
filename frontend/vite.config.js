import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/start-game': 'http://127.0.0.1:5000',
            '/game-state': 'http://127.0.0.1:5000',
            '/submit-turn': 'http://127.0.0.1:5000',
        }
    }
})
