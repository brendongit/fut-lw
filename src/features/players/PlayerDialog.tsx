"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  createPlayer,
  updatePlayer,
  uploadPlayerPhoto,
} from "@/services/players";
import type { Player } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PlayerDialogProps {
  open: boolean;
  player?: Player;
  onClose: () => void;
}

export function PlayerDialog({ open, player, onClose }: PlayerDialogProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: player?.name ?? "", phone: player?.phone ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: player?.name ?? "", phone: player?.phone ?? "" });
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [open, player, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      let photo_url = player?.photo_url ?? undefined;

      if (photoFile) {
        const tempId = player?.id ?? crypto.randomUUID();
        photo_url = await uploadPlayerPhoto(tempId, photoFile);
      }

      if (player) {
        return updatePlayer(player.id, { ...data, photo_url });
      }
      return createPlayer({ ...data, photo_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(player ? "Jogador atualizado" : "Jogador criado");
      onClose();
    },
    onError: () => toast.error("Erro ao salvar jogador"),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  const currentPhoto = photoPreview ?? player?.photo_url ?? null;
  const displayName = player?.name ?? "Novo Jogador";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{player ? "Editar jogador" : "Novo jogador"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar src={currentPhoto} name={displayName} size="xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-[var(--foreground-muted)]">
              Clique para alterar foto
            </p>
          </div>

          <Input
            label="Nome"
            placeholder="Nome do jogador"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Telefone (opcional)"
            placeholder="(11) 99999-9999"
            {...register("phone")}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              {player ? "Salvar" : "Criar jogador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
