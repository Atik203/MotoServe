export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export interface RegisterBody {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterResultDto {
  id: string;
  name: string;
  email: string;
  role: "owner";
  status: string;
}
