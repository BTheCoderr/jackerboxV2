import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

console.log('Setting up NextAuth handler with options:', {
  adapter: authOptions.adapter ? 'Custom adapter' : 'No adapter (development mode)',
  providers: authOptions.providers.map(provider => provider.id),
  debug: authOptions.debug
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 