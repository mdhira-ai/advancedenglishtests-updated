import { createAuthClient } from "better-auth/react";
export const { signIn, signUp, useSession, signOut,getSession,requestPasswordReset,resetPassword,forgetPassword } = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // Removed hardcoded baseURL to use current domain automatically
  

});

