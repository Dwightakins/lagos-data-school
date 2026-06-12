"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BASE_INPUT =
  "w-full px-3.5 py-2.5 rounded-lg border text-[14px] text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 transition-all";

function field(err: string) {
  return err
    ? `${BASE_INPUT} border-red-400 focus:ring-red-200 focus:border-red-400`
    : `${BASE_INPUT} border-border focus:ring-brand/20 focus:border-brand`;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const barColors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-500", "bg-green-500"];
  const textColors = ["", "text-red-600", "text-orange-500", "text-yellow-600", "text-green-600"];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? barColors[score] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[11px] font-medium mt-1 ${textColors[score]}`}>{labels[score]}</p>
      )}
    </div>
  );
}

interface Step1Props {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  onChange: (field: "fullName" | "email" | "password" | "confirmPassword", value: string) => void;
  onContinue: () => void;
  disabled?: boolean;
}

export default function Step1Personal({
  fullName,
  email,
  password,
  confirmPassword,
  onChange,
  onContinue,
  disabled = false,
}: Step1Props) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmPassword: false });

  function validate(values = { fullName, email, password, confirmPassword }) {
    const e = { fullName: "", email: "", password: "", confirmPassword: "" };
    if (!values.fullName.trim()) e.fullName = "Full name is required.";
    if (!values.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(values.email)) e.email = "Please enter a valid email address.";
    if (!values.password) e.password = "Password is required.";
    else if (values.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!values.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (values.password !== values.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  }

  function blur(f: keyof typeof touched) {
    setTouched((t) => ({ ...t, [f]: true }));
    const e = validate();
    setErrors(e);
  }

  function handleContinue() {
    const allTouched = { fullName: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    onContinue();
  }

  const err = (f: keyof typeof errors) => touched[f] ? errors[f] : "";

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-foreground mb-1">Create your account</h2>
      <p className="text-[13.5px] text-muted-foreground mb-6">Join thousands of students building in-demand skills.</p>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            onBlur={() => blur("fullName")}
            placeholder="Chukwuemeka Okonkwo"
            autoComplete="name"
            className={field(err("fullName"))}
          />
          {err("fullName") && <p className="mt-1 text-[12px] text-red-600">{err("fullName")}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">Email Address</label>
          <input
            type="text"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => blur("email")}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            className={field(err("email"))}
          />
          {err("email") && <p className="mt-1 text-[12px] text-red-600">{err("email")}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => onChange("password", e.target.value)}
              onBlur={() => blur("password")}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={`${field(err("password"))} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {err("password") && <p className="mt-1 text-[12px] text-red-600">{err("password")}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              onBlur={() => blur("confirmPassword")}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={`${field(err("confirmPassword"))} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err("confirmPassword") && (
            <p className="mt-1 text-[12px] text-red-600">{err("confirmPassword")}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={disabled}
        className="mt-6 w-full bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-brand-foreground font-semibold text-[14.5px] py-2.5 rounded-lg transition-opacity shadow-brand"
      >
        {disabled ? "Checking…" : "Continue →"}
      </button>

    </div>
  );
}
