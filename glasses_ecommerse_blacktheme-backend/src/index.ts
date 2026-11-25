import dotenv from 'dotenv'
dotenv.config()

import { startServer } from './app'
import { connectMongo } from './utils/mongo'

const PORT = process.env.PORT || 4000

// One failing request must not stop the API for everyone (an uncaught async error used to crash
// the process, and every page then showed "Failed to fetch" until it restarted).
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})

async function main() {
  const server = startServer()
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`)
  })

  try {
    console.log('Connecting to MongoDB...')
    await connectMongo(process.env.MONGO_URI || '')
  } catch (err) {
    console.error('MongoDB connection failed:', err)
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err)
  process.exit(1)
})
