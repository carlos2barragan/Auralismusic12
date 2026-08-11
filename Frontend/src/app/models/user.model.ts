export interface User {
  _id: string;
  nombre: string;
  email: string;
  avatar?: string;
  rol: string;
  plan?: string;
  isVerified: boolean;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;        
  token: string;     
}

export interface LoginResponse {
  token: string;    
  user: User;        
}
