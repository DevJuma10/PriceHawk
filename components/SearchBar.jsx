"use client"
export default function SearchBar() {
    const handleSubmit = () => {
    //submit logic
    }

  return (
    <form 
        className='flex flex-wrap gap-4 mt-12'
        onSubmit={handleSubmit}>
            
        <input 
            type="text"
            placeholder="Enter product link"
            className="seachbar-input" />

        <button type="sumbit" className="searchbar-btn">
            Search
        </button>
    </form>
  )
}
