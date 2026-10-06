/**
 * One-time migration: backfill store='amazon' and a unique productGroupId
 * on every existing Product document that was created before multi-store support.
 *
 * Run once before deploying the multi-store feature:
 *   npm run migrate   (or: node scripts/migrate-add-store-field.mjs)
 *
 * Safe to run multiple times — only updates documents where store is unset.
 */

import mongoose from 'mongoose'

// Node's built-in .env loader (Node 20.12+) — no dotenv dependency needed
try {
  process.loadEnvFile('.env.local')
} catch {
  // no .env.local — fall back to variables already in the environment
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env.local')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
console.log('Connected to MongoDB')

const db = mongoose.connection.db
const collection = db.collection('products')

const result = await collection.updateMany(
  { store: { $exists: false } },
  [
    {
      $set: {
        store: 'amazon',
        storeProductId: { $toString: '$_id' },
        productGroupId: { $toString: '$_id' },
        currency: { $ifNull: ['$currency', '$'] },
      },
    },
  ]
)

console.log(`Migration complete: ${result.modifiedCount} documents updated`)
await mongoose.disconnect()
