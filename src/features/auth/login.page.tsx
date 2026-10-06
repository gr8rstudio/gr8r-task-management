"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

function AuthCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-top">
        <Link href="/login" className="row" style={{ fontWeight: 600, gap: 8 }}>
          <span className="ws-logo brand" style={{ width: 22, height: 22 }}>G</span>
          Gr8r Studio
        </Link>
      </div>
      <div className="auth-c">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("hello@gr8rstudio.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthCard title="Welcome back" sub="Sign in to Gr8r Studio.">
      <form
        className="col"
        style={{ gap: 14 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.includes("@") || password.length < 4) {
            setError("Use a work email and a password of at least 4 characters.");
            return;
          }
          login(email);
          router.replace("/");
        }}
      >
        <div className="field">
          <label className="label" htmlFor="l-email">Email</label>
          <input id="l-email" className={`input input-lg ${error ? "is-error" : ""}`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label className="label" htmlFor="l-pw">Password</label>
          <input id="l-pw" className="input input-lg" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          {error ? <span className="err">{error}</span> : null}
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit">Sign in</button>
      </form>
      <p className="auth-foot">New here? <Link href="/signup">Create an account</Link></p>
      <p className="auth-foot"><Link href="/forgot">Forgot password</Link></p>
    </AuthCard>
  );
}

export function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthCard title="Create your account" sub="Start a workspace for your team.">
      <form className="col" style={{ gap: 14 }} onSubmit={(event) => { event.preventDefault(); login(email, name); router.replace("/"); }}>
        <div className="field"><label className="label" htmlFor="s-name">Full name</label><input id="s-name" className="input input-lg" value={name} onChange={(event) => setName(event.target.value)} required /></div>
        <div className="field"><label className="label" htmlFor="s-email">Work email</label><input id="s-email" className="input input-lg" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="field"><label className="label" htmlFor="s-pw">Password</label><input id="s-pw" className="input input-lg" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={4} required /></div>
        <button className="btn btn-primary btn-lg btn-block" type="submit">Create account</button>
      </form>
      <p className="auth-foot">Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthCard>
  );
}

export function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <AuthCard title="Reset your password" sub="We'll email you a reset link.">
      {sent ? <p>Check {email} for a reset link. This demo continues on the reset screen.</p> : (
        <form className="col" style={{ gap: 14 }} onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
          <div className="field"><label className="label" htmlFor="f-email">Email</label><input id="f-email" className="input input-lg" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <button className="btn btn-primary btn-lg btn-block" type="submit">Send reset link</button>
        </form>
      )}
      <p className="auth-foot"><Link href="/reset">Continue to reset</Link> · <Link href="/login">Back to sign in</Link></p>
    </AuthCard>
  );
}

export function ResetPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [password, setPassword] = useState("");
  return (
    <AuthCard title="Choose a new password" sub="Then we'll sign you back in.">
      <form className="col" style={{ gap: 14 }} onSubmit={(event) => { event.preventDefault(); login("hello@gr8rstudio.com"); router.replace("/"); }}>
        <div className="field"><label className="label" htmlFor="r-pw">New password</label><input id="r-pw" className="input input-lg" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={4} required /></div>
        <button className="btn btn-primary btn-lg btn-block" type="submit">Reset password</button>
      </form>
    </AuthCard>
  );
}
