import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseAdapterOptions = {
  supabase: SupabaseClient;
  schema?: string;
};

function formatDateFields<T extends Record<string, unknown>>(obj: T): T {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      delete obj[key as keyof T];
      continue;
    }

    if (
      key === "emailVerified" ||
      key === "expires" ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    ) {
      const dateInput = typeof value === "string" || value instanceof Date ? value : null;
      if (!dateInput) {
        continue;
      }

      const dateValue = new Date(dateInput);
      if (!Number.isNaN(dateValue.getTime())) {
        (obj as Record<string, unknown>)[key] = dateValue;
      }
    }
  }

  return obj;
}

export function SupabaseAdapter({
  supabase,
  schema = "public",
}: SupabaseAdapterOptions): Adapter {
  const db = supabase.schema(schema);

  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const { data, error } = await db
        .from("users")
        .insert({
          ...user,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return formatDateFields(data) as unknown as AdapterUser;
    },

    async getUser(id: string) {
      const { data, error } = await db.from("users").select().eq("id", id).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return formatDateFields(data) as unknown as AdapterUser;
    },

    async getUserByEmail(email: string) {
      const { data, error } = await db.from("users").select().eq("email", email).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return formatDateFields(data) as unknown as AdapterUser;
    },

    async getUserByAccount({
      provider,
      providerAccountId,
    }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      const { data, error } = await db
        .from("accounts")
        .select("users (*)")
        .match({ provider, providerAccountId })
        .maybeSingle();

      if (error) {
        throw error;
      }

      const accountData = data as unknown as { users?: AdapterUser };
      if (!accountData?.users) {
        return null;
      }

      return formatDateFields(
        accountData.users as unknown as Record<string, unknown>,
      ) as unknown as AdapterUser;
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const { data, error } = await db
        .from("users")
        .update({
          ...user,
          emailVerified: user.emailVerified?.toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return formatDateFields(data) as unknown as AdapterUser;
    },

    async deleteUser(userId: string) {
      const { error } = await db.from("users").delete().eq("id", userId);

      if (error) {
        throw error;
      }
    },

    async linkAccount(account: AdapterAccount) {
      const { error } = await db.from("accounts").insert(account);

      if (error) {
        throw error;
      }

      return account;
    },

    async unlinkAccount({
      provider,
      providerAccountId,
    }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      const { error } = await db
        .from("accounts")
        .delete()
        .match({ provider, providerAccountId });

      if (error) {
        throw error;
      }
    },

    async createSession({
      sessionToken,
      userId,
      expires,
    }: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      const { data, error } = await db
        .from("sessions")
        .insert({ sessionToken, userId, expires: expires.toISOString() })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return formatDateFields(data) as unknown as AdapterSession;
    },

    async getSessionAndUser(sessionToken: string) {
      const { data, error } = await db
        .from("sessions")
        .select("*, users(*)")
        .eq("sessionToken", sessionToken)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const { users: user, ...session } = data as { users: AdapterUser } & AdapterSession;

      return {
        user: formatDateFields(
          user as unknown as Record<string, unknown>,
        ) as unknown as AdapterUser,
        session: formatDateFields(
          session as unknown as Record<string, unknown>,
        ) as unknown as AdapterSession,
      };
    },

    async updateSession(
      session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
    ) {
      const { data, error } = await db
        .from("sessions")
        .update({
          ...session,
          expires: session.expires?.toISOString(),
        })
        .eq("sessionToken", session.sessionToken)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return formatDateFields(data) as unknown as AdapterSession;
    },

    async deleteSession(sessionToken: string) {
      const { error } = await db.from("sessions").delete().eq("sessionToken", sessionToken);

      if (error) {
        throw error;
      }
    },

    async createVerificationToken(token: VerificationToken) {
      const { data, error } = await db
        .from("verification_tokens")
        .insert({
          ...token,
          expires: token.expires.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return formatDateFields(
        data as unknown as Record<string, unknown>,
      ) as unknown as VerificationToken;
    },

    async useVerificationToken({
      identifier,
      token,
    }: Pick<VerificationToken, "identifier" | "token">) {
      const { data, error } = await db
        .from("verification_tokens")
        .delete()
        .match({ identifier, token })
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return formatDateFields(
        data as unknown as Record<string, unknown>,
      ) as unknown as VerificationToken;
    },
  };
}
