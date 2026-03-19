import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getCustomerAuthSchema, hasGoogleAuthProvider } from "@/lib/customer-auth-config";
import { SupabaseAdapter } from "@/lib/auth/supabase-adapter";
import { verifyPassword } from "@/lib/security/password";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const authSchema = getCustomerAuthSchema();
const hasAuthAdapterConfig = hasSupabaseDatabaseEnv();
const supabaseAdminClient = hasAuthAdapterConfig ? createSupabaseServiceRoleClient() : null;

export const authOptions: NextAuthOptions = {
  adapter: hasAuthAdapterConfig
    ? SupabaseAdapter({
        supabase: supabaseAdminClient!,
        schema: authSchema,
      })
    : undefined,
  providers: [
    ...(hasGoogleAuthProvider()
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password || !supabaseAdminClient) {
          return null;
        }

        const identifier = credentials.username.trim().toLowerCase();
        const fields = "id,name,email,image,password_hash";

        const byEmail = await supabaseAdminClient
          .schema(authSchema)
          .from("users")
          .select(fields)
          .ilike("email", identifier)
          .maybeSingle();

        const userRecord =
          byEmail.data ??
          (
            await supabaseAdminClient
              .schema(authSchema)
              .from("users")
              .select(fields)
              .ilike("username", identifier)
              .maybeSingle()
          ).data;

        if (!userRecord?.password_hash) {
          return null;
        }

        const passwordMatches = await verifyPassword(
          credentials.password,
          userRecord.password_hash,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          image: userRecord.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const auth = () => getServerSession(authOptions);
