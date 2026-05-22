import type { Movie } from './types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export const IMG = {
  poster: (path: string | null, size = 'w500') => path ? `${IMG_BASE}/${size}${path}` : null,
  backdrop: (path: string | null, size = 'w1280') => path ? `${IMG_BASE}/${size}${path}` : null,
  profile: (path: string | null, size = 'w185') => path ? `${IMG_BASE}/${size}${path}` : null,
};

async function fetchTMDB(endpoint: string, apiKey: string, params: Record<string, string> = {}) {
  const queryParams = new URLSearchParams({ api_key: apiKey, ...params });
  const res = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

export const tmdbApi = {
  // Search
  async search(query: string, apiKey: string) {
    const data = await fetchTMDB('/search/multi', apiKey, { query, include_adult: 'false' });
    const results: any[] = [];
    const seenIds = new Set<number>();

    for (const item of (data.results || [])) {
      if (item.media_type === 'movie' || item.media_type === 'tv') {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      } else if (item.media_type === 'person' && item.known_for) {
        for (const kf of item.known_for) {
          if ((kf.media_type === 'movie' || kf.media_type === 'tv') && !seenIds.has(kf.id)) {
            seenIds.add(kf.id);
            results.push({ ...kf, media_type: kf.media_type });
          }
        }
      }
    }
    return results.slice(0, 20);
  },

  // Trending
  async getTrending(mediaType: 'movie' | 'tv' | 'all', timeWindow: 'day' | 'week', apiKey: string) {
    const data = await fetchTMDB(`/trending/${mediaType}/${timeWindow}`, apiKey);
    return data.results;
  },

  // Popular
  async getPopular(mediaType: 'movie' | 'tv', apiKey: string, page = '1') {
    const data = await fetchTMDB(`/${mediaType}/popular`, apiKey, { page });
    return data.results;
  },

  // Top Rated
  async getTopRated(mediaType: 'movie' | 'tv', apiKey: string) {
    const data = await fetchTMDB(`/${mediaType}/top_rated`, apiKey);
    return data.results;
  },

  // Now Playing / On Air
  async getNowPlaying(apiKey: string) {
    const data = await fetchTMDB('/movie/now_playing', apiKey);
    return data.results;
  },

  async getOnTheAir(apiKey: string) {
    const data = await fetchTMDB('/tv/on_the_air', apiKey);
    return data.results;
  },

  // Upcoming
  async getUpcoming(apiKey: string) {
    const data = await fetchTMDB('/movie/upcoming', apiKey);
    return data.results;
  },

  // Genre Lists
  async getGenres(mediaType: 'movie' | 'tv', apiKey: string) {
    const data = await fetchTMDB(`/genre/${mediaType}/list`, apiKey);
    return data.genres;
  },

  // Discover by genre
  async discoverByGenre(mediaType: 'movie' | 'tv', genreId: string, apiKey: string) {
    const data = await fetchTMDB(`/discover/${mediaType}`, apiKey, {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    });
    return data.results;
  },

  // Details (movie or TV)
  async getDetails(id: number, mediaType: 'movie' | 'tv', apiKey: string): Promise<Movie> {
    const appendResponse = mediaType === 'tv' 
      ? 'credits,aggregate_credits,videos,similar,recommendations,external_ids' 
      : 'credits,videos,similar,recommendations,external_ids';
    const data = await fetchTMDB(`/${mediaType}/${id}`, apiKey, { append_to_response: appendResponse });

    let directors: string[] = [];
    let directors_list: { id: number; name: string; profile_path: string | null }[] = [];
    if (mediaType === 'movie') {
      const dirCrew = data.credits?.crew?.filter((c: any) => c.job === 'Director') || [];
      directors = dirCrew.map((c: any) => c.name);
      directors_list = dirCrew.map((c: any) => ({
        id: c.id,
        name: c.name,
        profile_path: c.profile_path || null,
      }));
    } else {
      const creators = data.created_by || [];
      directors = creators.map((c: any) => c.name);
      directors_list = creators.map((c: any) => ({
        id: c.id,
        name: c.name,
        profile_path: c.profile_path || null,
      }));

      // Fallback: If creators list is empty, pull Directors/Executive Producers/Creators from credits/aggregate_credits
      if (directors_list.length === 0) {
        const tvCrew = data.aggregate_credits?.crew || data.credits?.crew || [];
        const dirCrew = tvCrew.filter((c: any) => 
          c.jobs?.some((j: any) => ['Director', 'Executive Producer', 'Creator'].includes(j.job)) || 
          ['Director', 'Executive Producer', 'Creator'].includes(c.job)
        );
        const uniqueCrew: any[] = [];
        const seenIds = new Set();
        for (const c of dirCrew) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            uniqueCrew.push(c);
          }
        }
        directors = uniqueCrew.map((c: any) => c.name);
        directors_list = uniqueCrew.map((c: any) => ({
          id: c.id,
          name: c.name,
          profile_path: c.profile_path || null,
        }));
      }
    }

    const castSource = (mediaType === 'tv' ? (data.aggregate_credits?.cast || data.credits?.cast) : data.credits?.cast) || [];
    const cast = castSource.slice(0, 15).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character || (c.roles && c.roles[0]?.character) || '',
      profile_path: c.profile_path,
    })) || [];

    return {
      id: data.id,
      title: data.title || data.name,
      original_title: data.original_title || data.original_name,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date,
      overview: data.overview,
      runtime: mediaType === 'movie' ? data.runtime : (data.episode_run_time?.[0] || data.last_episode_to_air?.runtime || null),
      genres: data.genres?.map((g: any) => g.name) || [],
      directors,
      directors_list,
      cast,
      origin_country: data.origin_country || data.production_countries?.map((c: any) => c.iso_3166_1) || [],
      spoken_languages: data.spoken_languages?.map((l: any) => l.english_name) || [],
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      status: 'none',
      media_type: mediaType,
      similar: data.similar?.results?.slice(0, 6) || [],
      recommendations: data.recommendations?.results?.slice(0, 6) || [],
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      tagline: data.tagline,
      date_added: undefined,
      date_watched: undefined,
      imdb_id: data.external_ids?.imdb_id,
    };
  },

  // Recommendations based on genre
  async getRecommendations(genreIds: string, apiKey: string) {
    const data = await fetchTMDB('/discover/movie', apiKey, {
      with_genres: genreIds,
      sort_by: 'popularity.desc',
    });
    return data.results.slice(0, 8);
  },

  // Search Person (Actors/Directors)
  async searchPerson(query: string, apiKey: string) {
    const data = await fetchTMDB('/search/person', apiKey, { query, include_adult: 'false' });
    return data.results || [];
  },

  // Get Person Details
  async getPersonDetails(id: number, apiKey: string) {
    return fetchTMDB(`/person/${id}`, apiKey);
  },

  // Get Person Credits
  async getPersonCredits(id: number, apiKey: string) {
    return fetchTMDB(`/person/${id}/combined_credits`, apiKey);
  },

  // Discover with Advanced Parameters
  async discoverAdvanced(mediaType: 'movie' | 'tv', params: Record<string, string>, apiKey: string) {
    const data = await fetchTMDB(`/discover/${mediaType}`, apiKey, {
      sort_by: 'popularity.desc',
      ...params
    });
    return data.results || [];
  },
};
