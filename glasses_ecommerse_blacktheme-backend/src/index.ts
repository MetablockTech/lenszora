import dotenv from 'dotenv'
dotenv.config()

import { startServer } from './app'
import { connectMongo } from './utils/mongo'

const PORT = process.env.PORT || 4000

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
