import { AWARDS_MOVIES, AWARDS_PEOPLE } from './awardsData';

const PEOPLE_NAMES_TO_IDS: Record<string, number> = {
  'christopher nolan': 525,
  'nolan': 525,
  'cillian murphy': 2037,
  'murphy': 2037,
  'robert downey jr': 3223,
  'downey': 3223,
  'leonardo dicaprio': 6193,
  'dicaprio': 6193,
  'joaquin phoenix': 73421,
  'phoenix': 73421,
  'emma stone': 54693,
  'stone': 54693,
  'martin scorsese': 1032,
  'scorsese': 1032,
  'quentin tarantino': 138,
  'tarantino': 138,
  'bong joon ho': 21684,
  'bong joon-ho': 21684,
  'tom hanks': 31,
  'hanks': 31,
  'meryl streep': 5064,
  'streep': 5064,
  'anthony hopkins': 4173,
  'hopkins': 4173,
  'frances mcdormand': 3913,
  'mcdormand': 3913,
  'steven spielberg': 488,
  'spielberg': 488,
  'hayao miyazaki': 608,
  'miyazaki': 608
};

const MOVIES_TITLES_TO_IDS: Record<string, number> = {
  'oppenheimer': 872585,
  'parasite': 496243,
  'everything everywhere all at once': 868759,
  'eeao': 868759,
  'the godfather': 238,
  'godfather': 238,
  'the dark knight': 155,
  'dark knight': 155,
  'inception': 27205,
  'interstellar': 157336,
  'titanic': 597,
  'pulp fiction': 680,
  'spirited away': 129,
  'la la land': 313369,
  'gladiator': 98,
  'roma': 426426,
  'mad max': 76341,
  'fury road': 76341,
  'shape of water': 399055,
  'coda': 776503,
  'minari': 577922,
  'game of thrones': 1399,
  'breaking bad': 1396,
  'succession': 76479,
  'chernobyl': 87108,
  'the crown': 65494,
  'arcane': 94605,
  'attack on titan': 1429,
  'demon slayer': 85937,
  'jujutsu kaisen': 95557,
  'frieren': 209867
};

function getGroundedAwardsContext(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  const matchedFacts: string[] = [];

  // Check people
  for (const [name, id] of Object.entries(PEOPLE_NAMES_TO_IDS)) {
    if (lowerPrompt.includes(name)) {
      const awards = AWARDS_PEOPLE[id];
      if (awards && awards.length > 0) {
        const awardsStr = awards
          .map((a) => `- ${a.year} ${a.award}: ${a.category}`)
          .join('\n');
        matchedFacts.push(`Awards record for "${name}" (ID ${id}):\n${awardsStr}`);
      }
    }
  }

  // Check movies
  for (const [title, id] of Object.entries(MOVIES_TITLES_TO_IDS)) {
    if (lowerPrompt.includes(title)) {
      const awards = AWARDS_MOVIES[id];
      if (awards && awards.length > 0) {
        const awardsStr = awards
          .map((a) => `- ${a.year} ${a.award}: ${a.category}`)
          .join('\n');
        matchedFacts.push(`Awards record for Movie/Show "${title}" (ID ${id}):\n${awardsStr}`);
      }
    }
  }

  if (matchedFacts.length === 0) {
    return 'No matching accolades found in local database for the current text.';
  }

  return matchedFacts.join('\n\n');
}

export interface ChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
}

export interface GeminiContext {
  activePage: string;
  mediaDetails?: any;
  userProfile?: {
    watchedMoviesCount: number;
    topGenre: string;
    topDirector: string;
    avgRating: string;
    topLanguage: string;
  };
}

export async function askGemini(
  prompt: string,
  apiKey: string,
  history: ChatHistoryItem[],
  context: GeminiContext
): Promise<string> {
  const groundedAwards = getGroundedAwardsContext(prompt);

  const systemInstructionText = `You are Binge Buddy AI, a helpful, highly knowledgeable cinephile chatbot assistant.
You help users explore movies, series, anime, actors, directors, awards, and their own watching metrics.
Be conversational, smart, and enthusiastic about cinema.

Current Page Context:
The user is currently browsing the page: "${context.activePage}"
${context.mediaDetails ? `Current media item detail:
- Title: ${context.mediaDetails.title}
- Release Date: ${context.mediaDetails.release_date}
- Genres: ${context.mediaDetails.genres ? context.mediaDetails.genres.join(', ') : ''}
- Directors: ${context.mediaDetails.directors ? context.mediaDetails.directors.join(', ') : ''}
- Top Cast: ${context.mediaDetails.cast ? context.mediaDetails.cast.slice(0, 5).map((c: any) => `${c.name} (${c.character})`).join(', ') : ''}
- Overview: ${context.mediaDetails.overview}` : ''}

${context.userProfile ? `User Profile Info:
- Watched Movies: ${context.userProfile.watchedMoviesCount}
- Top Genre: ${context.userProfile.topGenre}
- Top Director: ${context.userProfile.topDirector}
- Average Rating: ${context.userProfile.avgRating}★
- Top Language: ${context.userProfile.topLanguage}` : ''}

Local Accolades Database (Static Grounding of awards won):
${groundedAwards}

Instructions:
1. Ground your answers in the local accolades database whenever the user asks about awards, Oscars, Emmys, Palme d'Or, etc.
2. If the user asks about details of the current movie/show they are viewing, use the current media item details.
3. Be friendly, clean in formatting (use markdown, lists, bolding). Keep answers concise and informative. Do not use markdown features that aren't clean in simple text boxes.`;

  // Map history (only last 10 messages to avoid prompt limits)
  // Ensure the history starts with a user turn, as required by the Gemini API
  const firstUserIdx = history.findIndex((msg) => msg.sender === 'user');
  const validHistory = firstUserIdx !== -1 ? history.slice(firstUserIdx) : [];

  const conversationHistory = validHistory.slice(-10).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  // Append current prompt
  conversationHistory.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: conversationHistory,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API Error:', errText);
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!replyText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return replyText;
}
