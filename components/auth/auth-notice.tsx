const ERRORS: Record<string, string> = {
  credentials: "Email or password is incorrect. Check both and try again.",
  callback: "That sign-in link is invalid or has expired. Please try again.",
  details: "Enter your first name, last name and a valid email address.",
  password: "Use matching passwords between 15 and 128 characters.",
  terms: "You need to accept the Terms and Privacy Policy to create an account.",
  signup: "We couldn’t create the account. Try signing in if you have registered before.",
  expired: "The recovery link is invalid or expired. Request a new one.",
  update: "The password could not be updated. Request a new recovery link and try again.",
};

const MESSAGES: Record<string, string> = {
  "password-updated": "Password updated. Sign in with your new password.",
  "signed-out": "You’re signed out.",
  "signed-out-all": "You’re signed out on every device.",
};

export function AuthNotice({ error, message }: { error?: string; message?: string }) {
  const errorText = error ? ERRORS[error] ?? "Something went wrong. Please try again." : null;
  const messageText = message ? MESSAGES[message] ?? null : null;
  if (!errorText && !messageText) return null;
  return (
    <div role={errorText ? "alert" : "status"} className={errorText ? "rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive" : "rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success"}>
      {errorText ?? messageText}
    </div>
  );
}
