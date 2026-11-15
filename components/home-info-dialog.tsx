"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Info, X } from "lucide-react"

type HomeInfoDialogProps = {
  title: string
  description: string
  label?: string
}

export default function HomeInfoDialog({
  title,
  description,
  label = "Informasi " + title,
}: HomeInfoDialogProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label={label}
        className="home-info-trigger inline-grid size-8 shrink-0 place-items-center rounded-full border border-current/15 bg-background/55 text-current/75 transition hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Info className="size-4" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-[3px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-border/70 bg-card p-5 text-card-foreground shadow-2xl shadow-slate-950/30 transition duration-250 ease-out data-ending-style:scale-[.98] data-ending-style:opacity-0 data-starting-style:scale-[.98] data-starting-style:opacity-0 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Info className="size-5" />
            </span>
            <DialogPrimitive.Close
              aria-label="Tutup informasi"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="mt-4 text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-5 flex justify-end">
            <DialogPrimitive.Close className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90">
              Mengerti
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
