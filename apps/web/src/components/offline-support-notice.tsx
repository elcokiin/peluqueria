import { DatabaseZap, RotateCw, WifiOff } from "lucide-react";

type OfflineSupportNoticeProps = {
  savedAt?: number;
  variant: "appointments" | "schedule" | "barber";
};

const copy = {
  appointments: {
    title: "Soporte offline para la agenda",
    body: "El barbero puede consultar la lista de citas guardada aunque no tenga internet.",
    detail: "Las acciones de check-in, cancelar o finalizar se reactivan al recuperar conectividad.",
  },
  schedule: {
    title: "Soporte offline para el horario semanal",
    body: "El barbero puede ver su horario semanal guardado aunque no tenga internet.",
    detail: "La edicion del horario se sincroniza con Convex cuando vuelve la conexion.",
  },
  barber: {
    title: "Soporte offline para el barbero",
    body: "La agenda y el horario semanal se guardan en cache para consulta rapida sin conexion.",
    detail: "Los datos se actualizan automaticamente cuando la aplicacion recupera conectividad.",
  },
} satisfies Record<OfflineSupportNoticeProps["variant"], { title: string; body: string; detail: string }>;

export function OfflineSupportNotice({ savedAt, variant }: OfflineSupportNoticeProps) {
  const item = copy[variant];

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-[12px] text-muted-foreground">
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <div>
            <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">{item.title}</p>
            <p className="mt-0.5">{item.body}</p>
          </div>
          <div className="grid gap-1.5">
            <p className="flex items-start gap-2">
              <DatabaseZap className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Datos en cache local
                {savedAt ? ` desde ${new Date(savedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}` : ""}.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <RotateCw className="mt-0.5 size-3.5 shrink-0" />
              <span>{item.detail}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
