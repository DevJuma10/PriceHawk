import Link from 'next/link'
import Image from 'next/image'

const STORE_LABELS = {
  amazon: 'Amazon',
  jumia: 'Jumia',
  takealot: 'Takealot',
}

export default function MultiStoreCard({ group }) {
  const primary = group[0]

  // Only compare prices if all products share the same currency
  const uniqueCurrencies = [...new Set(group.map((p) => p.currency))]
  const sameCurrency = uniqueCurrencies.length === 1

  let lowestProductId = null
  if (sameCurrency && group.length > 1) {
    const sorted = [...group].sort((a, b) => a.currentPrice - b.currentPrice)
    lowestProductId = sorted[0]._id.toString()
  }

  return (
    <div className="product-card">
      <Link href={`/products/${primary._id}`} className="product-card_img-container">
        <Image
          src={primary.image}
          alt={primary.title}
          width={200}
          height={200}
          className="product-card_img"
        />
      </Link>

      <div className="flex flex-col gap-3">
        <h3 className="product-title line-clamp-2">{primary.title}</h3>

        <div className="flex flex-col gap-1">
          {group.map((product) => {
            const isBest = lowestProductId && product._id.toString() === lowestProductId
            return (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                className={`flex justify-between items-center text-sm px-2 py-1 rounded transition-colors hover:bg-gray-50 ${isBest ? 'bg-green-50' : ''}`}
              >
                <span className="text-gray-500">
                  {STORE_LABELS[product.store] ?? product.store}
                </span>
                <span className="flex items-center gap-1.5">
                  {isBest && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">
                      Best
                    </span>
                  )}
                  <span className="font-semibold text-black">
                    {product.currency} {product.currentPrice.toLocaleString()}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>

        {!sameCurrency && group.length > 1 && (
          <p className="text-xs text-gray-400 px-2">Multiple currencies — prices not comparable</p>
        )}
      </div>
    </div>
  )
}
