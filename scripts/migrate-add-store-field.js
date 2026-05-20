/**
 * One-time migration: backfill store='amazon' and a unique productGroupId
 * on every existing Product document that was created before multi-store support.
 *
 * Run once before deploying the multi-store feature:
 *   node scripts/migrate-add-store-field.js
 *
 * Safe to run multiple times — only updates documents where store is unset.
 */

import mongoose from 'mongoose'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

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
        storeProductId: '$_id',
        productGroupId: { $toString: '$_id' },
        currency: { $ifNull: ['$currency', '$'] },
      },
    },
  ]
)

console.log(`Migration complete: ${result.modifiedCount} documents updated`)
await mongoose.disconnect()
