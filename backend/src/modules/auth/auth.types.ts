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
  dateOfBirth?: Date;
  gender?: string;
  nid?: string;
  drivingLicense?: string;
  occupation?: string;
  street?: string;
  city?: string;
  district?: string;
  zip?: string;
  country?: string;
  documentUrl?: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  password: string;
}

export interface RegisterResultDto {
  id: string;
  name: string;
  email: string;
  role: "owner";
  status: string;
}
