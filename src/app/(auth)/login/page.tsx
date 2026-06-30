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
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Email ou senha incorretos");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <span className="text-2xl">⚽</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Entrar na conta</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Bem-vindo de volta
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
        <Button type="submit" loading={loading} className="w-full mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
        Não tem conta?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
