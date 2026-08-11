import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser = { _id: 'u1', nombre: 'Carlos', email: 'c@test.com', rol: 'usuario' };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['setToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        UserService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('register should make POST request and store userId', () => {
    const registerData = { nombre: 'Carlos', email: 'c@test.com', password: '123456' };
    const mockResponse = { user: { _id: 'u1', nombre: 'Carlos', email: 'c@test.com' }, token: 'jwt_tok' };

    service.register(registerData).subscribe(res => {
      expect(res.user._id).toBe('u1');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/registro'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(localStorage.getItem('userId')).toBe('u1');
    expect(authServiceSpy.setToken).toHaveBeenCalledWith('jwt_tok');
  });

  it('verifyEmail should make GET request and navigate to login on success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    const mockResponse = { success: true, token: 'tok', user: mockUser };

    service.verifyEmail('verify_token').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/verificar/verify_token'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('verifyEmail should navigate to register on failure', () => {
    const navigateSpy = spyOn(router, 'navigate');
    const mockResponse = { success: false };

    service.verifyEmail('bad_token').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/verificar/bad_token'));
    req.flush(mockResponse);

    expect(navigateSpy).toHaveBeenCalledWith(['/register']);
  });

  it('fetchUserProfile should make GET request', () => {
    service.fetchUserProfile('u1').subscribe(u => expect(u._id).toBe('u1'));
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('updateUserRole should make PATCH request', () => {
    service.updateUserRole('u1', 'cantante').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/usuario/u1/rol'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'cantante' });
    req.flush({ message: 'ok' });
  });

  it('updateProfile should make PUT request', () => {
    service.updateProfile('u1', { nombre: 'Carlos Updated' }).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1'));
    expect(req.request.method).toBe('PUT');
    req.flush(mockUser);
  });

  it('changePassword should make PATCH request', () => {
    service.changePassword('u1', 'old', 'new123').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1/password'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ passwordActual: 'old', passwordNueva: 'new123' });
    req.flush({ message: 'ok' });
  });

  it('getStats should make GET request', () => {
    service.getStats('u1').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1/stats'));
    expect(req.request.method).toBe('GET');
    req.flush({ total: 5 });
  });

  it('registerPlay should make POST request', () => {
    const playData = { cancionId: 's1', titulo: 'CRUZ', cantante: 'Feid', genero: 'regueton' };
    service.registerPlay('u1', playData).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1/play'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('updateConfig should make PATCH request', () => {
    const config = { perfilPublico: false, mostrarHistorial: true, notificaciones: false };
    service.updateConfig('u1', config).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/Usuario/u1/config'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ config });
    req.flush(mockUser);
  });

  it('registerPlay should return null on error without failing', (done) => {
    service.registerPlay('u1', { cancionId: 's1', titulo: 'X', cantante: 'Y', genero: 'Z' }).subscribe({
      next: (v) => { expect(v).toBeNull(); done(); },
    });
    const req = httpMock.expectOne((r) => r.url.includes('/play'));
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });
});
