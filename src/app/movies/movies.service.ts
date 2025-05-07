import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Movie } from './movies.service.interface';

const WEIGHTS = {
  genres: 0.2,
  language: 0.1,
  runtime: 0.1,
  popularity: 0.1,
  release_year: 0.1,
  vote_average: 0.2,
  keywords: 0.2,
};

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  readonly movies = httpResource.text(`${document.baseURI}tmdb_5000_movies.csv`, {
    parse: this.parse,
    defaultValue: [],
  });

  private parse(csv: string): Movie[] {
    const lines = csv.trim().split("\n");

    const headers = lines[0].split(",").map(h => h.trim());
  
    function parseJSONField<T>(value: string): T {
      try {
        return JSON.parse(value.replace(/""/g, '"'));
      } catch {
        return [] as unknown as T;
      }
    }
  
    return lines.slice(1).map(line => {
      const values = line.match(/("(?:[^"]|"")*"|[^,]+)/g)!.map(v =>
        v.trim().replace(/^"|"$/g, "")
      );
  
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
  
      const movie: Movie = {
        budget: parseFloat(obj["budget"]),
        genres: parseJSONField<{ id: number; name: string }[]>(obj["genres"]),
        homepage: obj["homepage"],
        id: parseInt(obj["id"]),
        keywords: parseJSONField<{ id: number; name: string }[]>(obj["keywords"]),
        original_language: obj["original_language"],
        original_title: obj["original_title"],
        overview: obj["overview"],
        popularity: parseFloat(obj["popularity"]),
        production_companies: parseJSONField<{ id: number; name: string }[]>(obj["production_companies"]),
        production_countries: parseJSONField<{ iso_3166_1: string; name: string }[]>(obj["production_countries"]),
        release_date: obj["release_date"],
        revenue: parseFloat(obj["revenue"]),
        runtime: parseFloat(obj["runtime"]),
        spoken_languages: parseJSONField<{ iso_639_1: string; name: string }[]>(obj["spoken_languages"]),
        status: obj["status"],
        tagline: obj["tagline"],
        title: obj["title"],
        vote_average: parseFloat(obj["vote_average"]),
        vote_count: parseInt(obj["vote_count"]),
      };
  
      return movie;
    });
  }
  
  calculateSimilarity(a: Movie, b: Movie): number { // get every similarity then calc the weighted average
    const genreSim = this.jaccard(a.genres.map(value => value.name), b.genres.map(value => value.name));
    const langSim = a.original_language === b.original_language ? 1 : 0;
    const keywordSim = this.jaccard(a.keywords.map(value => value.name), b.keywords.map(value => value.name));
    const runtimeSim = this.normalizeDifference(a.runtime, b.runtime, 300);
    const popSim = this.normalizeDifference(a.popularity, b.popularity, 1000);
    const yearA = new Date(a.release_date).getFullYear();
    const yearB = new Date(b.release_date).getFullYear();
    const yearSim = this.normalizeDifference(yearA, yearB, 100);
    const voteSim = this.normalizeDifference(a.vote_average, b.vote_average, 10);
  
    return (
      (genreSim * WEIGHTS.genres) +
      (langSim * WEIGHTS.language) +
      (runtimeSim * WEIGHTS.runtime) +
      (popSim * WEIGHTS.popularity) +
      (yearSim * WEIGHTS.release_year) +
      (voteSim * WEIGHTS.vote_average) +
      (keywordSim * WEIGHTS.keywords) 
    );
  }
  
  recommend(movie: Movie, topN = 20): { movie: Movie, similarity: number }[] {
    return this.movies.value()
      .filter(m => m.id !== movie.id) // remove the movie being compared
      .map(m => ({ movie: m, similarity: this.calculateSimilarity(movie, m) })) // calc the similarity of every movie
      .sort((a, b) => b.similarity - a.similarity) // sort based on similarity
      .slice(0, topN) // get only the most fit
  }

  // calc the similarity of two lists
  private jaccard(a: string[], b: string[]): number {
    const setA = new Set(a); // turn into Set for a faster search 
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(x => setB.has(x))); // get the elements that appear on both sets
    const union = new Set([...setA, ...setB]); // create a new set with all the elements

    return intersection.size / union.size; // calc similarity
  }
  
  private normalizeDifference(a: number, b: number, maxRange: number): number {
    return 1 - Math.abs(a - b) / maxRange; // calc similarity within a base number
  }
}
