import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// 硬编码配置
const GITHUB_CLIENT_ID = "Ov23ligvp4DqbuzCURAD";
const GITHUB_CLIENT_SECRET = "4df3e46ffed82acbff53447105d61d891d2d0e7a";
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
};

export default NextAuth(authOptions);
