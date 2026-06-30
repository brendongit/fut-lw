"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTournament } from "@/services/tournaments";
import { Controller } from "react-hook-form";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  date: z.string().min(1, "Data obrigatória"),
  players_per_team: z.number().min(2).max(11),
  price: z.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

interface TournamentDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TournamentDialog({ open, onClose }: TournamentDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { players_per_team: 5 },
  });

  const mutation = useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Torneio criado");
      reset();
      onClose();
    },
    onError: () => toast.error("Erro ao criar torneio"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo torneio</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-col gap-4"
        >
          <Input
            label="Nome do torneio"
            placeholder="Ex: Pelada Quinta-feira"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Data"
            type="date"
            error={errors.date?.message}
            {...register("date")}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Jogadores por time
            </label>
            <Controller
              control={control}
              name="players_per_team"
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} jogadores
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Input
            label="Valor por jogador (opcional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 20.00"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            error={errors.price?.message}
            {...register("price", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              Criar torneio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
