import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ArtistInfoComponent } from './artist-info.component';
import { ArtistService } from '../../services/artist.service';
import { SongService } from '../../services/song.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { UIStateService } from '../../services/ui-state.service';

const mockArtist = {
  _id: 'a1',
  cantante: 'Feid',
  avatar: 'avatar.jpg',
  canciones: [
    { _id: 's1', titulo: 'CRUZ', genero: 'regueton', plays: 500 },
    { _id: 's2', titulo: 'Yandel 150', genero: 'regueton', plays: 300 },
  ],
};

describe('ArtistInfoComponent (page)', () => {
  let component: ArtistInfoComponent;
  let fixture: ComponentFixture<ArtistInfoComponent>;
  let artistServiceSpy: jasmine.SpyObj<ArtistService>;
  let songServiceSpy: jasmine.SpyObj<SongService>;

  beforeEach(async () => {
    artistServiceSpy = jasmine.createSpyObj('ArtistService', ['getArtist']);
    songServiceSpy = jasmine.createSpyObj('SongService', ['setCurrentSong', 'setIsPlaying', 'getCanciones'], {
      currentSong$: of(null),
      isPlaying$: of(false),
    });
    artistServiceSpy.getArtist.and.returnValue(of(mockArtist));
    songServiceSpy.getCanciones.and.returnValue(of([]));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLogged', 'getToken'], { isLogged$: of(false) });
    const uiStateSpy = jasmine.createSpyObj('UIStateService', ['toggle'], { sidebarOpen$: of(false) });

    await TestBed.configureTestingModule({
      imports: [ArtistInfoComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: ArtistService, useValue: artistServiceSpy },
        { provide: SongService, useValue: songServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UIStateService, useValue: uiStateSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: (key: string) => (key === 'id' ? 'a1' : null) }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load artist data on init', () => {
    expect(artistServiceSpy.getArtist).toHaveBeenCalledWith('a1');
    expect(component.artist).toEqual(mockArtist);
    expect(component.dbSongs.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should calculate totalPlays correctly', () => {
    expect(component.totalPlays).toBe(800);
  });

  it('should return unique genres', () => {
    expect(component.generos).toContain('regueton');
    expect(component.generos.length).toBe(1);
  });

  it('should format plays in K notation', () => {
    expect(component.formatPlays(1500)).toBe('2K');
    expect(component.formatPlays(500)).toBe('500');
  });

  it('should format plays in M notation', () => {
    expect(component.formatPlays(1_500_000)).toBe('1.5M');
  });

  it('should identify current song correctly', () => {
    component.currentSong = { _id: 's1' } as any;
    expect(component.isCurrentSong({ _id: 's1' } as any)).toBeTrue();
    expect(component.isCurrentSong({ _id: 's2' } as any)).toBeFalse();
  });

  it('should call setCurrentSong and setIsPlaying on playSong', () => {
    const song = component.dbSongs[0];
    component.playSong(song as any);
    expect(songServiceSpy.setCurrentSong).toHaveBeenCalledWith(song as any);
    expect(songServiceSpy.setIsPlaying).toHaveBeenCalledWith(true);
  });

  it('should play a random song when songs list is not empty', () => {
    spyOn(component, 'playSong');
    component.playRandom();
    expect(component.playSong).toHaveBeenCalled();
  });

  it('should not play if songs list is empty', () => {
    component.dbSongs = [];
    spyOn(component, 'playSong');
    component.playRandom();
    expect(component.playSong).not.toHaveBeenCalled();
  });
});
