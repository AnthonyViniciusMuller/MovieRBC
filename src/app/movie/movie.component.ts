import { Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MoviesService } from '../movies/movies.service';
import { Router, RouterLink } from '@angular/router';
import { SearchMovieComponent } from "../search-movie/search-movie.component";
import { Movie } from '../movies/movies.service.interface';

@Component({
  selector: 'app-movie',
  imports: [
    MatCardModule,
    MatToolbarModule,
    MatGridListModule,
    MatButtonModule,
    RouterLink,
    SearchMovieComponent
  ],
  templateUrl: './movie.component.html',
  styleUrl: './movie.component.scss'
})
export class MovieComponent {
  readonly moviesService = inject(MoviesService);
  readonly router = inject(Router);

  readonly id = input<number | undefined>();

  readonly movie = computed(() => this.getMovie());
  readonly movies = computed(() => this.movie() ? this.moviesService.recommend(this.movie()!) : []);

  redirectToMovie(movie: Movie) {
    this.router.navigate(["/", movie.id])
  }

  private getMovie() {
    const id = this.id();
    if (id) {
      const movie = this.moviesService.movies.value().find(movie => movie.id == id);
      if (movie) {
        return movie;
      }
    }

    return this.moviesService.movies.value().at(0);
  }
}
