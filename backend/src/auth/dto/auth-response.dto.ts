export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    phone?: string;
    email?: string;
    username: string;
    avatarUrl?: string;
  };
}
