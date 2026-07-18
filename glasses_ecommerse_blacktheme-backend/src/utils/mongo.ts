import mongoose from 'mongoose'
import dns from 'dns'

// Fix for Windows DNS resolution issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1'])


export async function connectMongo(uri: string) {
  if (!uri) throw new Error('MONGO_URI is not set')
  await mongoose.connect(uri)
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB')
}
