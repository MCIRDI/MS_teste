"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  score: number;
  t: {
    title: string;
    scoreLabel: string;
    message: string;
    confirm: string;
    confirming: string;
  };
};

export function VettingPassedModal({ score, t }: Props) {
  const [isPending, setIsPending] = useState(false);

  function handleConfirm() {
    setIsPending(true);
    window.location.href = "/api/auth/pending-logout";
  }

  return (
    <Modal open title={t.title} onClose={() => {}}>
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          {t.scoreLabel} : <strong className="text-emerald-700">{score}%</strong>
        </p>
        <p className="text-sm text-slate-700">{t.message}</p>
        <Button
          type="button"
          className="w-full"
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? t.confirming : t.confirm}
        </Button>
      </div>
    </Modal>
  );
}
