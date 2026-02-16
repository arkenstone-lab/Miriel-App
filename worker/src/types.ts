export interface Env {
  DB: D1Database;
  AVATARS: R2Bucket;
  CORS_ORIGINS: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  RESEND_API_KEY?: string;
  INVITE_CODES?: string; // comma-separated invite codes (empty = open registration)
  ENVIRONMENT?: string;  // 'production' on live — hides dev_code/dev_token from responses
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export type Variables = {
  userId: string;
  userEmail: string;
};
