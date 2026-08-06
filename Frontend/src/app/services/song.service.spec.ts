import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SongService } from './song.service';
import { Cancion } from '../models/cancion.model';

const mockSong: Cancion = { _id: 's1', titulo: 'CRUZ', cantante: { _id: 'c1', cantante: 'Feid', avatar: '' }, album: 'Ferxxo', genero: 'regueton', imagen: 'img.jpg', fileUrl: 'url.mp3', plays: 100 };
const mockSong2: Cancion = { _id: 's2', titulo: 'Tusa', cantante: { _id: 'c2', cantante: 'Karol G', avatar: '' }, album: 'KG', genero: 'pop', imagen: 'img2.jpg', fileUrl: 'url2.mp3', plays: 200 };

describe('SongService', () => {
  let service: SongService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SongService],
    });
    service = TestBed.inject(SongService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCanciones should make GET request', () => {
    service.getCanciones().subscribe(songs => expect(songs.length).toBe(2));
    const req = httpMock.expectOne((r) => r.url.includes('/canciones'));
    expect(req.request.method).toBe('GET');
    req.flush([mockSong, mockSong2]);
  });

  it('getCancionById should make GET request with id', () => {
    service.getCancionById('s1').subscribe(s => expect(s._id).toBe('s1'));
    const req = httpMock.expectOne((r) => r.url.includes('/canciones/s1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockSong);
  });

  it('getMostPlayedSongs should call correct endpoint', () => {
    service.getMostPlayedSongs().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('mas-escuchadas'));
    expect(req.request.method).toBe('GET');
    req.flush([mockSong]);
  });

  it('getRecentSongs should call correct endpoint', () => {
    service.getRecentSongs().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('recientes'));
    expect(req.request.method).toBe('GET');
    req.flush([mockSong]);
  });

  it('deleteSong should make DELETE request', () => {
    service.deleteSong('s1').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/canciones/s1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });

  it('setCurrentSong should emit on currentSong$', () => {
    let emitted: Cancion | null = null;
    service.currentSong$.subscribe(s => (emitted = s));
    service.setCurrentSong(mockSong);
    expect(emitted as unknown as Cancion).toEqual(mockSong);
  });

  it('setIsPlaying should emit on isPlaying$', () => {
    let emitted = false;
    service.isPlaying$.subscribe(v => (emitted = v));
    service.setIsPlaying(true);
    expect(emitted).toBeTrue();
  });

  it('removeFromPlaylist should remove song from internal playlist', () => {
    (service as any).playlist = [mockSong, mockSong2];
    (service as any).playlistSubject.next([mockSong, mockSong2]);

    service.removeFromPlaylist(mockSong);

    let result: Cancion[] = [];
    service.playlist$.subscribe(p => (result = p));
    expect(result.find(s => s._id === 's1')).toBeUndefined();
    expect(result.find(s => s._id === 's2')).toBeDefined();
  });

  it('removeFromPlaylist should do nothing if song has no _id', () => {
    (service as any).playlist = [mockSong];
    service.removeFromPlaylist({ ...mockSong, _id: '' } as any);
    expect((service as any).playlist.length).toBe(1);
  });

  it('prevSong should not change song if playlist is empty', () => {
    service.setCurrentSong(mockSong);
    service.prevSong();
    let current: Cancion | null = null;
    service.currentSong$.subscribe(s => (current = s));
    expect(current as unknown as Cancion).toEqual(mockSong);
  });

  it('playRandomSong should not play if playlist is empty', () => {
    (service as any).playlist = [];
    const spy = spyOn(service, 'setCurrentSong');
    service.playRandomSong();
    expect(spy).not.toHaveBeenCalled();
  });

  it('playRandomSong should set a random song from playlist', () => {
    (service as any).playlist = [mockSong, mockSong2];
    (service as any).playlistSubject.next([mockSong, mockSong2]);
    const spy = spyOn(service, 'setCurrentSong');
    service.playRandomSong();
    expect(spy).toHaveBeenCalled();
  });
});
