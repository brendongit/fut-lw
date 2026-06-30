"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Conta criada! Faça login para continuar.");
    router.push("/login");
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <span className="text-2xl">⚽</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Criar conta</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Comece a gerenciar suas peladas
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" loading={loading} className="w-full mt-2">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
        Já tem conta?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
