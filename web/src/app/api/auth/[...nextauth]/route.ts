import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            // Pass provider info to frontend
            if (account) {
                token.provider = account.provider
                token.providerAccountId = account.providerAccountId
            }
            return token
        },
        async session({ session, token }) {
            // Expose provider info in session
            if (session.user) {
                (session.user as any).provider = token.provider
                    (session.user as any).providerAccountId = token.providerAccountId
            }
            return session
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
