"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, LogIn, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    console.log("Login data:", data);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-surface">
      {/* Ambient Background Glow */}
      <div className="purple-glow absolute inset-0 z-0" />

      {/* Login Card */}
      <main className="relative z-10 w-full max-w-[440px] px-6">
        <section className="glass-card rounded-[32px] p-10 flex flex-col gap-6 shadow-2xl">
          {/* Header with Logo and Title */}
          <header className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shadow-lg shadow-primary/10">
                <CheckCircle className="w-6 h-6 text-on-primary-container" />
              </div>
              <h1 className="text-h3 font-h3 text-white">LOGI</h1>
            </div>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant">
                Email
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 backdrop-blur-md"
                />
              </div>
              {errors.email && (
                <p className="text-error text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-sm text-label-sm text-on-surface-variant">
                  Password
                </label>
                <a
                  href="#"
                  className="text-label-sm text-outline-variant hover:text-primary transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 backdrop-blur-md pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full py-4 rounded-full font-label-sm text-label-sm text-on-primary-container font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            </form>
        </section>
      </main>

      {/* Footer Copyright */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="font-caps-xs text-caps-xs text-outline-variant/50 uppercase tracking-[0.2em]">
          Focused Productivity © 2024
        </p>
      </footer>
    </div>
  );
}
