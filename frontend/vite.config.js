import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/create-room': 'http://127.0.0.1:5000',
            '/join-room': 'http://127.0.0.1:5000',
            '/room-state': 'http://127.0.0.1:5000',
            '/submit-choice': 'http://127.0.0.1:5000',
            '/add-bot': 'http://127.0.0.1:5000',
            '/remove-bot': 'http://127.0.0.1:5000',
            '/start-game': 'http://127.0.0.1:5000',
            '/next-round': 'http://127.0.0.1:5000',
            '/leave-room': 'http://127.0.0.1:5000',
            '/active-rooms': 'http://127.0.0.1:5000',
        }
    }
})
