"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

const schema = z.object({
  identifier: z.string().min(1, "Email or Employee ID required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>("admin");
  const [showPass, setShowPass] = useState(false);
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    login({ ...values, role });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-3">
            <Building2 size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            SalesCRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
          {(["admin", "employee"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                role === r
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={role === "admin" ? "Email address" : "Employee ID"}
            placeholder={role === "admin" ? "admin@company.com" : "EMP001"}
            autoComplete="username"
            error={errors.identifier?.message}
            {...register("identifier")}
          />
          <Input
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            {...register("password")}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            isLoading={isLoggingIn}
          >
            Sign in
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Contact your administrator to reset your password.
        </p>
      </div>
    </div>
  );
}
