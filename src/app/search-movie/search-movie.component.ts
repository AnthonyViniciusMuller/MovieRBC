import { Component, computed, inject, model, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MoviesService } from '../movies/movies.service';
import { Movie } from '../movies/movies.service.interface';

@Component({
  selector: 'app-search-movie',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './search-movie.component.html',
  styleUrl: './search-movie.component.scss'
})
export class SearchMovieComponent {
  LIMIT = 5
  readonly moviesService = inject(MoviesService);

  readonly search = signal('');

  options = computed(() => this.filter());
  chooseMovie = output<Movie>();

  displayWith(movie?: Movie) {
    return movie?.title || "";
  }

  private filter() {
    const movies = this.moviesService.movies.value();
  
    if (typeof this.search() !== "string") {
      return [];
    }
    const searchTerm = this.search().toLowerCase();
    const results: Movie[] = [];
    
    for (const move of movies) {
      if (move?.title?.toLowerCase().includes(searchTerm)) {
        results.push(move);
        if (results.length === this.LIMIT) break;
      }
    }
  
    return results;
  }
}
