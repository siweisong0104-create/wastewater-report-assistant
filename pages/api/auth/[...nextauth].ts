import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// 硬编码配置
const GITHUB_CLIENT_ID = "Ov23ligvp4DqbuzCURAD";
const GITHUB_CLIENT_SECRET = "b9f95767fd0881923cf44ec0be9a6961be9f6d42";
const NEXTAUTH_SECRET = "kX9mP2vQ7wL4nR8jY5tB1cF6hD3sA0eG";

console.log("=== Auth Debug ===");
console.log("Client ID:", GITHUB_CLIENT_ID.substring(0, 10) + "...");

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
  ],
  secret: NEXTAUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
};

export default NextAuth(authOptions);
