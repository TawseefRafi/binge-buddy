export interface AwardWin {
  award: 'Oscar' | 'Palme d\'Or' | 'Golden Globe' | 'BAFTA' | 'Emmy' | 'Venice Golden Lion' | 'Berlin Golden Bear' | 'Sundance Grand Jury' | 'Anime Award';
  category: string;
  year: number;
}

// Map of TMDB ID (number) to AwardWin[] - covers both Movies and TV series/Anime
export const AWARDS_MOVIES: Record<number, AwardWin[]> = {
  // Oppenheimer
  872585: [
    { award: 'Oscar', category: 'Best Picture', year: 2024 },
    { award: 'Oscar', category: 'Best Director (Christopher Nolan)', year: 2024 },
    { award: 'Oscar', category: 'Best Actor (Cillian Murphy)', year: 2024 },
    { award: 'Oscar', category: 'Best Supporting Actor (Robert Downey Jr.)', year: 2024 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 2024 },
    { award: 'BAFTA', category: 'Best Film', year: 2024 },
  ],
  // Parasite
  496243: [
    { award: 'Oscar', category: 'Best Picture', year: 2020 },
    { award: 'Oscar', category: 'Best Director (Bong Joon Ho)', year: 2020 },
    { award: 'Oscar', category: 'Best Original Screenplay', year: 2020 },
    { award: 'Oscar', category: 'Best International Feature Film', year: 2020 },
    { award: 'Palme d\'Or', category: 'Palme d\'Or (Cannes Film Festival)', year: 2019 },
    { award: 'Golden Globe', category: 'Best Foreign Language Film', year: 2020 },
    { award: 'BAFTA', category: 'Best Film Not in English Language', year: 2020 },
  ],
  // Everything Everywhere All at Once
  868759: [
    { award: 'Oscar', category: 'Best Picture', year: 2023 },
    { award: 'Oscar', category: 'Best Director (Daniel Kwan, Daniel Scheinert)', year: 2023 },
    { award: 'Oscar', category: 'Best Actress (Michelle Yeoh)', year: 2023 },
    { award: 'Oscar', category: 'Best Supporting Actor (Ke Huy Quan)', year: 2023 },
    { award: 'Oscar', category: 'Best Supporting Actress (Jamie Lee Curtis)', year: 2023 },
    { award: 'Golden Globe', category: 'Best Actress - Comedy/Musical', year: 2023 },
  ],
  // The Godfather
  238: [
    { award: 'Oscar', category: 'Best Picture', year: 1973 },
    { award: 'Oscar', category: 'Best Actor (Marlon Brando)', year: 1973 },
    { award: 'Oscar', category: 'Best Adapted Screenplay', year: 1973 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 1973 },
  ],
  // The Dark Knight
  155: [
    { award: 'Oscar', category: 'Best Supporting Actor (Heath Ledger)', year: 2009 },
    { award: 'Oscar', category: 'Best Sound Editing', year: 2009 },
    { award: 'Golden Globe', category: 'Best Supporting Actor (Heath Ledger)', year: 2009 },
    { award: 'BAFTA', category: 'Best Supporting Actor (Heath Ledger)', year: 2009 },
  ],
  // Inception
  27205: [
    { award: 'Oscar', category: 'Best Cinematography', year: 2011 },
    { award: 'Oscar', category: 'Best Visual Effects', year: 2011 },
    { award: 'Oscar', category: 'Best Sound Editing', year: 2011 },
    { award: 'Oscar', category: 'Best Sound Mixing', year: 2011 },
    { award: 'BAFTA', category: 'Best Special Visual Effects', year: 2011 },
  ],
  // Interstellar
  157336: [
    { award: 'Oscar', category: 'Best Visual Effects', year: 2015 },
    { award: 'BAFTA', category: 'Best Special Visual Effects', year: 2015 },
  ],
  // Titanic
  597: [
    { award: 'Oscar', category: 'Best Picture', year: 1998 },
    { award: 'Oscar', category: 'Best Director (James Cameron)', year: 1998 },
    { award: 'Oscar', category: 'Best Cinematography', year: 1998 },
    { award: 'Oscar', category: 'Best Visual Effects', year: 1998 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 1998 },
  ],
  // Pulp Fiction
  680: [
    { award: 'Oscar', category: 'Best Original Screenplay', year: 1995 },
    { award: 'Palme d\'Or', category: 'Palme d\'Or (Cannes Film Festival)', year: 1994 },
    { award: 'Golden Globe', category: 'Best Screenplay', year: 1995 },
    { award: 'BAFTA', category: 'Best Original Screenplay', year: 1995 },
  ],
  // Spirited Away
  129: [
    { award: 'Oscar', category: 'Best Animated Feature', year: 2003 },
    { award: 'Berlin Golden Bear', category: 'Golden Bear (Best Film)', year: 2002 },
    { award: 'BAFTA', category: 'Best Animated Film Nominee', year: 2004 },
  ],
  // La La Land
  313369: [
    { award: 'Oscar', category: 'Best Director (Damien Chazelle)', year: 2017 },
    { award: 'Oscar', category: 'Best Actress (Emma Stone)', year: 2017 },
    { award: 'Oscar', category: 'Best Cinematography', year: 2017 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Comedy/Musical', year: 2017 },
    { award: 'BAFTA', category: 'Best Film', year: 2017 },
  ],
  // Gladiator
  98: [
    { award: 'Oscar', category: 'Best Picture', year: 2001 },
    { award: 'Oscar', category: 'Best Actor (Russell Crowe)', year: 2001 },
    { award: 'BAFTA', category: 'Best Film', year: 2001 },
  ],
  // The Lord of the Rings: The Return of the King
  122: [
    { award: 'Oscar', category: 'Best Picture', year: 2004 },
    { award: 'Oscar', category: 'Best Director (Peter Jackson)', year: 2004 },
    { award: 'Oscar', category: 'Best Visual Effects', year: 2004 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 2004 },
    { award: 'BAFTA', category: 'Best Film', year: 2004 },
  ],
  // Forrest Gump
  13: [
    { award: 'Oscar', category: 'Best Picture', year: 1995 },
    { award: 'Oscar', category: 'Best Director (Robert Zemeckis)', year: 1995 },
    { award: 'Oscar', category: 'Best Actor (Tom Hanks)', year: 1995 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 1995 },
  ],
  // Schindler's List
  424: [
    { award: 'Oscar', category: 'Best Picture', year: 1994 },
    { award: 'Oscar', category: 'Best Director (Steven Spielberg)', year: 1994 },
    { award: 'Golden Globe', category: 'Best Motion Picture – Drama', year: 1994 },
    { award: 'BAFTA', category: 'Best Film', year: 1994 },
  ],
  // Joker
  475554: [
    { award: 'Oscar', category: 'Best Actor (Joaquin Phoenix)', year: 2020 },
    { award: 'Oscar', category: 'Best Original Score', year: 2020 },
    { award: 'Venice Golden Lion', category: 'Golden Lion (Venice Film Festival)', year: 2019 },
    { award: 'Golden Globe', category: 'Best Actor – Drama', year: 2020 },
    { award: 'BAFTA', category: 'Best Actor', year: 2020 },
  ],
  // Whiplash
  244786: [
    { award: 'Oscar', category: 'Best Supporting Actor (J.K. Simmons)', year: 2015 },
    { award: 'Oscar', category: 'Best Film Editing', year: 2015 },
    { award: 'Sundance Grand Jury', category: 'U.S. Dramatic Grand Jury Prize', year: 2014 },
    { award: 'BAFTA', category: 'Best Supporting Actor (J.K. Simmons)', year: 2015 },
  ],
  // Anatomy of a Fall
  915935: [
    { award: 'Oscar', category: 'Best Original Screenplay', year: 2024 },
    { award: 'Palme d\'Or', category: 'Palme d\'Or (Cannes Film Festival)', year: 2023 },
    { award: 'Golden Globe', category: 'Best Screenplay', year: 2024 },
    { award: 'BAFTA', category: 'Best Original Screenplay', year: 2024 },
  ],
  // The Zone of Interest
  467244: [
    { award: 'Oscar', category: 'Best International Feature Film', year: 2024 },
    { award: 'Oscar', category: 'Best Sound', year: 2024 },
    { award: 'BAFTA', category: 'Best Film Not in English Language', year: 2024 },
  ],
  // Roma
  426426: [
    { award: 'Oscar', category: 'Best Director (Alfonso Cuarón)', year: 2019 },
    { award: 'Oscar', category: 'Best Foreign Language Film', year: 2019 },
    { award: 'Venice Golden Lion', category: 'Golden Lion (Venice Film Festival)', year: 2018 },
    { award: 'BAFTA', category: 'Best Film', year: 2019 },
  ],
  // Mad Max: Fury Road
  76341: [
    { award: 'Oscar', category: 'Best Film Editing', year: 2016 },
    { award: 'Oscar', category: 'Best Production Design', year: 2016 },
    { award: 'BAFTA', category: 'Best Editing', year: 2016 },
  ],
  // The Shape of Water
  399055: [
    { award: 'Oscar', category: 'Best Picture', year: 2018 },
    { award: 'Oscar', category: 'Best Director (Guillermo del Toro)', year: 2018 },
    { award: 'Venice Golden Lion', category: 'Golden Lion (Venice Film Festival)', year: 2017 },
    { award: 'Golden Globe', category: 'Best Director', year: 2018 },
  ],
  // CODA
  776503: [
    { award: 'Oscar', category: 'Best Picture', year: 2022 },
    { award: 'Oscar', category: 'Best Supporting Actor (Troy Kotsur)', year: 2022 },
    { award: 'Sundance Grand Jury', category: 'U.S. Dramatic Grand Jury Prize', year: 2021 },
  ],
  // Minari
  577922: [
    { award: 'Oscar', category: 'Best Supporting Actress (Yuh-jung Youn)', year: 2021 },
    { award: 'Sundance Grand Jury', category: 'U.S. Dramatic Grand Jury Prize', year: 2020 },
    { award: 'Golden Globe', category: 'Best Foreign Language Film', year: 2021 },
  ],

  // --- TV Series & Anime ---
  // Game of Thrones
  1399: [
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2019 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2018 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2016 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2015 },
    { award: 'Golden Globe', category: 'Best Supporting Actor (Peter Dinklage)', year: 2012 },
  ],
  // Breaking Bad
  1396: [
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2014 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2013 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2014 },
    { award: 'Golden Globe', category: 'Best Actor – Drama (Bryan Cranston)', year: 2014 },
  ],
  // Succession
  76479: [
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2024 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2022 },
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2020 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2024 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2022 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2020 },
  ],
  // Chernobyl
  87108: [
    { award: 'Emmy', category: 'Outstanding Limited Series', year: 2019 },
    { award: 'Golden Globe', category: 'Best Miniseries or Television Film', year: 2020 },
    { award: 'BAFTA', category: 'Best Mini-Series', year: 2020 },
  ],
  // The Crown
  65494: [
    { award: 'Emmy', category: 'Outstanding Drama Series', year: 2021 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2021 },
    { award: 'Golden Globe', category: 'Best Television Series – Drama', year: 2017 },
  ],
  // Arcane
  94605: [
    { award: 'Emmy', category: 'Outstanding Animated Program', year: 2022 },
    { award: 'Anime Award', category: 'Best Anime Series Winner', year: 2023 },
  ],
  // Attack on Titan
  1429: [
    { award: 'Anime Award', category: 'Anime of the Year', year: 2022 },
    { award: 'Anime Award', category: 'Best Drama / Animation', year: 2023 },
  ],
  // Demon Slayer: Kimetsu no Yaiba
  85937: [
    { award: 'Anime Award', category: 'Anime of the Year', year: 2020 },
    { award: 'Anime Award', category: 'Best Animation Winner', year: 2024 },
  ],
  // Jujutsu Kaisen
  95557: [
    { award: 'Anime Award', category: 'Anime of the Year', year: 2024 },
    { award: 'Anime Award', category: 'Anime of the Year', year: 2021 },
  ],
  // Frieren: Beyond Journey's End
  209867: [
    { award: 'Anime Award', category: 'Anime of the Year Winner', year: 2025 },
    { award: 'Anime Award', category: 'Best Fantasy Winner', year: 2025 },
  ]
};

// Map of TMDB Person ID (number) to AwardWin[]
export const AWARDS_PEOPLE: Record<number, AwardWin[]> = {
  // Christopher Nolan
  525: [
    { award: 'Oscar', category: 'Best Director (Oppenheimer)', year: 2024 },
    { award: 'Oscar', category: 'Best Picture (Oppenheimer)', year: 2024 },
    { award: 'Golden Globe', category: 'Best Director (Oppenheimer)', year: 2024 },
    { award: 'BAFTA', category: 'Best Director (Oppenheimer)', year: 2024 },
  ],
  // Cillian Murphy
  2037: [
    { award: 'Oscar', category: 'Best Actor (Oppenheimer)', year: 2024 },
    { award: 'Golden Globe', category: 'Best Actor – Drama (Oppenheimer)', year: 2024 },
    { award: 'BAFTA', category: 'Best Actor (Oppenheimer)', year: 2024 },
  ],
  // Robert Downey Jr.
  3223: [
    { award: 'Oscar', category: 'Best Supporting Actor (Oppenheimer)', year: 2024 },
    { award: 'Golden Globe', category: 'Best Supporting Actor (Oppenheimer)', year: 2024 },
    { award: 'BAFTA', category: 'Best Supporting Actor (Oppenheimer)', year: 2024 },
  ],
  // Leonardo DiCaprio
  6193: [
    { award: 'Oscar', category: 'Best Actor (The Revenant)', year: 2016 },
    { award: 'Golden Globe', category: 'Best Actor – Drama (The Revenant)', year: 2016 },
    { award: 'Golden Globe', category: 'Best Actor – Comedy/Musical (The Wolf of Wall Street)', year: 2014 },
    { award: 'Golden Globe', category: 'Best Actor – Drama (The Aviator)', year: 2005 },
    { award: 'BAFTA', category: 'Best Actor (The Revenant)', year: 2016 },
  ],
  // Joaquin Phoenix
  73421: [
    { award: 'Oscar', category: 'Best Actor (Joker)', year: 2020 },
    { award: 'Golden Globe', category: 'Best Actor – Drama (Joker)', year: 2020 },
    { award: 'BAFTA', category: 'Best Actor (Joker)', year: 2020 },
  ],
  // Emma Stone
  54693: [
    { award: 'Oscar', category: 'Best Actress (La La Land)', year: 2017 },
    { award: 'Oscar', category: 'Best Actress (Poor Things)', year: 2024 },
    { award: 'Golden Globe', category: 'Best Actress (La La Land)', year: 2017 },
    { award: 'Golden Globe', category: 'Best Actress (Poor Things)', year: 2024 },
    { award: 'BAFTA', category: 'Best Actress (La La Land)', year: 2017 },
    { award: 'BAFTA', category: 'Best Actress (Poor Things)', year: 2024 },
  ],
  // Martin Scorsese
  1032: [
    { award: 'Oscar', category: 'Best Director (The Departed)', year: 2007 },
    { award: 'Golden Globe', category: 'Best Director (The Departed)', year: 2007 },
    { award: 'Golden Globe', category: 'Best Director (Hugo)', year: 2012 },
    { award: 'Golden Globe', category: 'Best Director (Gangs of New York)', year: 2003 },
  ],
  // Quentin Tarantino
  138: [
    { award: 'Oscar', category: 'Best Original Screenplay (Pulp Fiction)', year: 1995 },
    { award: 'Oscar', category: 'Best Original Screenplay (Django Unchained)', year: 2013 },
    { award: 'Palme d\'Or', category: 'Palme d\'Or (Pulp Fiction)', year: 1994 },
    { award: 'Golden Globe', category: 'Best Screenplay (Pulp Fiction)', year: 1995 },
  ],
  // Bong Joon Ho
  21684: [
    { award: 'Oscar', category: 'Best Director (Parasite)', year: 2020 },
    { award: 'Oscar', category: 'Best Picture (Parasite)', year: 2020 },
    { award: 'Oscar', category: 'Best Original Screenplay (Parasite)', year: 2020 },
    { award: 'Palme d\'Or', category: 'Palme d\'Or (Parasite)', year: 2019 },
    { award: 'BAFTA', category: 'Best Original Screenplay (Parasite)', year: 2020 },
  ],
  // Tom Hanks
  31: [
    { award: 'Oscar', category: 'Best Actor (Philadelphia)', year: 1994 },
    { award: 'Oscar', category: 'Best Actor (Forrest Gump)', year: 1995 },
    { award: 'Golden Globe', category: 'Best Actor (Forrest Gump)', year: 1995 },
  ],
  // Meryl Streep
  5064: [
    { award: 'Oscar', category: 'Best Actress (Sophie\'s Choice)', year: 1983 },
    { award: 'Oscar', category: 'Best Actress (The Iron Lady)', year: 2012 },
    { award: 'Oscar', category: 'Best Supporting Actress (Kramer vs. Kramer)', year: 1980 },
    { award: 'Golden Globe', category: 'Best Actress / Supporting Actress (8 Wins)', year: 2012 },
  ],
  // Anthony Hopkins
  4173: [
    { award: 'Oscar', category: 'Best Actor (The Silence of the Lambs)', year: 1992 },
    { award: 'Oscar', category: 'Best Actor (The Father)', year: 2021 },
    { award: 'BAFTA', category: 'Best Actor (The Silence of the Lambs)', year: 1992 },
    { award: 'BAFTA', category: 'Best Actor (The Father)', year: 2021 },
  ],
  // Frances McDormand
  3913: [
    { award: 'Oscar', category: 'Best Actress (Fargo)', year: 1997 },
    { award: 'Oscar', category: 'Best Actress (Three Billboards Outside Ebbing, Missouri)', year: 2018 },
    { award: 'Oscar', category: 'Best Actress (Nomadland)', year: 2021 },
  ],
  // Steven Spielberg
  488: [
    { award: 'Oscar', category: 'Best Director (Schindler\'s List)', year: 1994 },
    { award: 'Oscar', category: 'Best Director (Saving Private Ryan)', year: 1999 },
    { award: 'Oscar', category: 'Best Picture (Schindler\'s List)', year: 1994 },
  ],
  // Hayao Miyazaki
  608: [
    { award: 'Oscar', category: 'Best Animated Feature (Spirited Away)', year: 2003 },
    { award: 'Oscar', category: 'Best Animated Feature (The Boy and the Heron)', year: 2024 },
  ]
};

// Helper functions to fetch awards by ID
export function getMovieAwards(id: number): AwardWin[] {
  return AWARDS_MOVIES[id] || [];
}

export function getPersonAwards(id: number): AwardWin[] {
  return AWARDS_PEOPLE[id] || [];
}

// Get all movie/show IDs for a specific award
export function getMovieIdsByAward(awardName: AwardWin['award']): number[] {
  return Object.keys(AWARDS_MOVIES)
    .map(Number)
    .filter((id) => AWARDS_MOVIES[id].some((a) => a.award === awardName));
}

