import React, { useEffect,useEffectEvent,useState } from 'react'
import Search from './Components/Search'
import Spinner from './Components/Spinner';
import MovieCard from './Components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL='https://api.themoviedb.org/3';

const API_KEY=import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS={
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

function App() {
  const [searchTerm,setSearchTerm]=useState("");
  const [errorMessage,setErrorMessage]=useState("");
  const [movieList,setMovieList]=useState([]);
  const [isLoading,setIsLoading]=useState(false);
  const [hasMovie,setHasMovie]=useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deBouncedSearchTerm,setDeBounceSearchTerm] = useState('');
  const [trendingMovies,setTrendingMovies] = useState([]);

  useDebounce(()=>setDeBounceSearchTerm(searchTerm),500,[searchTerm]);

  const fetchMovies = async (query='', pageNum=1) => {
    setIsLoading(true);

    try{
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${pageNum}`: `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${pageNum}`;
      const response=await fetch(endpoint,API_OPTIONS);

      if(!response.ok){
        throw new Error("Failed to Fetch Movies");
      }
      
      const data=await response.json();
      
      if(!data.results){
        setErrorMessage(data.error || "Failed to fetch movies");
        return;
      }

      if (pageNum === 1 && data.results.length === 0) {
        setHasMore(false);
      }

      setMovieList((prev)=>
        pageNum===1 ? data.results : [...prev,...data.results]
      );

      if(pageNum>=data.total_pages){
        setHasMore(false);
      }
      if(query && data.results.length>0){
        await updateSearchCount(query, data.results[0]);
      }
    } catch(error){
      console.log(`Error Fetching Movies: ${error}`);

      setErrorMessage("Error Fetching Movies. Please try again later...");

    } finally{
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try{
      const movies=await getTrendingMovies();
      setTrendingMovies(movies);
    }catch(error){
      console.log("Error fetcing trending movies...");
    }
  }

  useEffect(()=>{
    setPage(1);
    setHasMore(true);
    fetchMovies(deBouncedSearchTerm,1);
  },[deBouncedSearchTerm]);

  useEffect(()=>{
    loadTrendingMovies();
  },[]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(deBouncedSearchTerm, nextPage);
  };

  return (
    <main>
      <div className='pattern'/>

      <div className='wrapper'>
        <header>
          <img src='./hero.png' alt='Hero Banner'/>
          <h1>Find <span className='text-gradient'>Movies</span> you'll Enjoy Without </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>
              Trending Movies
            </h2>
            <ul>
              {trendingMovies.map((movie,index)=>(
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title}/>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2 className='mt-[40px]'>All Movies</h2>
          {isLoading ? (
            <Spinner />
            ) : errorMessage ? (
              <p className='text-red-500'>{errorMessage}</p>
            ) : movieList.length===0 ? (
              <p className='text-gray-400 text-center mt-10'>
                {searchTerm 
                  ? `No movies found for "${searchTerm}"`
                  : "No movies available"}
              </p>
            ) : ( 
              <>
                <ul>
                  {movieList.map((movie)=>(
                    <MovieCard key={movie.id} movie={movie} hasMovie={hasMovie} setHasMovie={setHasMovie}/>
                  ))}
                </ul>
                {hasMore && !isLoading && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={loadMore}
                      className="px-6 py-3 bg-light-100 text-black rounded-lg font-semibold hover:bg-light-200 transition"
                      >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )
          }
        </section>
      </div>
    </main>
  )
}

export default App
