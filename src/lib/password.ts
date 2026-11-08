// Password rules shared by the sign-up form, the security page and the server.

export function passwordRules(value: string, email?: string | null) {
  const local = email?.split("@")[0]?.toLowerCase();
  return [
    { label: "At least 10 characters", ok: value.length >= 10 },
    { label: "Letters and numbers", ok: /[a-z]/i.test(value) && /\d/.test(value) },
    { label: "Not your email", ok: value.length > 0 && !(local && local.length >= 3 && value.toLowerCase().includes(local)) },
  ];
}

/** The first rule a new password breaks, as a sentence, or null when it passes. */
export function passwordProblem(value: string, email?: string | null): string | null {
  const broken = passwordRules(value, email).find((r) => !r.ok);
  if (!broken) return null;
  if (broken.label.startsWith("At least")) return "Use at least 10 characters.";
  if (broken.label.startsWith("Letters")) return "Mix letters and numbers.";
  return "Don't use your email in the password.";
}
