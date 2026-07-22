import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { Playlst } from './pages/playlist/playlst.component';
import { AuthGuard } from './guards/auth.guard';
import { CantanteGuard } from './guards/cantante.guard';
import { ProfileComponent } from './pages/profile/profile.component';
import { VerificarEmailComponent } from './pages/verificar-email/verificar-email.component';
import { SubirCancionComponent } from './pages/subir-cancion/subir-cancion.component';
import { VerificarComponent } from './pages/verificar/verificar.component';
import { PrivatePlaylistComponent } from './pages/private-playlist/private-playlist.component';
import { VerificacionExitosaComponent } from './pages/verificacion-exitosa/verificacion-exitosa.component';
import { ArtistInfoComponent } from './pages/artist-info/artist-info.component';
import { GenreComponent } from './pages/genre/genre.component';
import { AdminSolicitudesComponent } from './pages/admin-solicitudes/admin-solicitudes.component';
import { AdminGuard } from './guards/admin.guard';
import { SpotifySearchComponent } from './pages/spotify-search/spotify-search.component';
import { SpotifyImportComponent } from './pages/spotify-import/spotify-import.component';
import { SpotifyCallbackComponent } from './pages/spotify-callback/spotify-callback.component';
export const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'playlist', component: Playlst, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'playlist/:id', component: PrivatePlaylistComponent, canActivate: [AuthGuard] },
  { path: 'artist/:id', component: ArtistInfoComponent, canActivate: [AuthGuard] },
  { path: 'genre/:name', component: GenreComponent, canActivate: [AuthGuard] },
  { path: 'subir', component: SubirCancionComponent, canActivate: [CantanteGuard] },
  { path: 'admin/solicitudes', component: AdminSolicitudesComponent, canActivate: [AdminGuard] },
  { path: 'verificar-email', component: VerificarEmailComponent },
  { path: 'verificar/:token', component: VerificarComponent },
  { path: 'verificacion-exitosa', component: VerificacionExitosaComponent },
  { path: 'spotify/search', component: SpotifySearchComponent, canActivate: [AuthGuard] },
  { path: 'spotify/import', component: SpotifyImportComponent, canActivate: [AuthGuard] },
  { path: 'spotify/callback', component: SpotifyCallbackComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' },
];


