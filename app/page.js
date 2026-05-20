import HeroCarousel from "@/components/HeroCarousel"
import SearchBar from "@/components/SearchBar"
import Image from "next/image"
import { getAllProductGroups } from "@/lib/actions"
import MultiStoreCard from "@/components/MultiStoreCard"

export default async function Home() {
  const productGroups = await getAllProductGroups()

  return (
    <>
      <section className="px-6 md:px-20 py-24">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Smart Shopping Starts Here
              <Image
                src='/assets/icons/arrow-right.svg'
                alt="arrow-right"
                width={16}
                height={16}
              />
            </p>

            <h1 className="head-text">
              Unleash the power of
              <span className="text-primary"> PriceHawk</span>
            </h1>

            <p className="mt-6">
              Track prices across Amazon, Jumia, and Takealot. Get alerted the moment a deal drops.
            </p>

            <SearchBar />
          </div>

          <HeroCarousel />
        </div>
      </section>

      <section className="trending-section">
        <h2 className="section-text">Trending</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-16">
          {productGroups.map((group) => (
            <MultiStoreCard key={group[0]._id} group={group} />
          ))}
        </div>
      </section>
    </>
  )
}
