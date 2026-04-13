# Documentación del Sistema: Barber Studio

Este documento sirve como guía técnica para que cualquier desarrollador pueda entender la arquitectura, el backend y el estado actual del panel de barbero.

## Arquitectura General

El proyecto es un monorepo que utiliza:
- **Frontend:** TanStack Start, React, Tailwind CSS, shadcn/ui.
- **Backend:** Convex (Base de datos en tiempo real, funciones cloud).
- **Autenticación:** Better Auth (integrado con Convex).
- **Notificaciones:** Resend (Node.js action en Convex).

La estructura clave es:
- `apps/web/`: Contiene la aplicación web (rutas, componentes, hooks).
- `packages/backend/`: Contiene toda la lógica de servidor de Convex, los schemas y las integraciones.
- `packages/ui/`: Componentes UI compartidos (shadcn).

---

## Modelos de Base de Datos (Convex Schema)

El estado de la base de datos se maneja en `packages/backend/convex/schema.ts` y está migrado a las últimas especificaciones de las características implementadas.

### Tablas Principales
1. **users:** Administrada por Better Auth + Convex. Los perfiles se sincronizan automáticamente vía el componente `<SyncProfile />` (en `__root.tsx`). Al inicializarse, a cada usuario se le puede asignar el `role: "admin" | "barber" | "client"`.
2. **services (Global):** Catálogo maestro de servicios (`name`, `defaultDuration`, `defaultPrice`).
3. **barberServices:** Relación entre el Barbero y sus servicios. Un barbero puede sobreescribir el precio y la duración de un servicio maestro, y activarlo o pausarlo.
4. **barberSchedule:** Horario base por día de la semana (`dayOfWeek` de 0 a 6). Tiene la opción de definir descanso en medio del turno:
   - `startMinute`, `endMinute` (inicio y fin del día en minutos).
   - `breakStartMinute`, `breakEndMinute` (opcional, define la hora de almuerzo).
5. **blocks:** Bloqueos puntuales o de día completo para fechas específicas (ej. 2026-04-15).
6. **appointments:** Las citas generadas entre cliente y barbero. Mantienen un `startTime` (timestamp UNIX) y `totalDuration`. Estado: `scheduled | cancelled | closed`.

---

## "Liquid Timeline" - Algoritmo de Disponibilidad

Para calcular qué horas puede agendar un cliente, no dividimos el día en simples "bloques fijos". Usamos el algoritmo de _Liquid Timeline_ implementado en `packages/backend/convex/slots.ts`.

Flujo de la función `getAvailableSlots`:
1. Verifica el **horario del barbero** para el día (`barberSchedule`).
2. Recolecta **citas existentes** de ese día y **bloqueos puntuales** (`blocks`).
3. **Inyecta el receso de almuerzo** (si está configurado en `barberSchedule`) como si fuera un evento de bloqueo visual en el algoritmo.
4. Crea una línea de tiempo y busca "gaps" o huecos que sean **mayores o iguales** a la duración del servicio que el cliente quiere reservar.
5. Permite generar slots cada X minutos (configurado en `baseSlotInterval`, por defecto 30 min).

Esto permite máxima flexibilidad. Si un barbero atiende de 8 a 18, almuerza de 12 a 13, y el cliente pide algo de 60 min, el algoritmo solo arrojará slots donde este servicio quepa perfectamente sin chocar con el almuerzo u otra cita.

---

## UI del Barbero (`apps/web/src/routes/barber.tsx`)

El panel de administración del barbero ha sido rediseñado completamente con **shadcn Card components** y el sistema de notificaciones **Sonner**.

El dashboard está dividido en 4 secciones (Componentes):

1. **`BarberServicesTab`**: Listado de servicios del barbero. Usa Toggle para pausar/activar y permite agregar nuevos usando un `Sheet`.
2. **`BarberScheduleTab`**: Muestra los días de la semana (Switch para activar el día). El botón editar abre un `Sheet` para definir la **hora de inicio, fin y un receso de almuerzo**. También incluye un componente naranja para aplicar un almuerzo global a todos los días activos a la vez.
3. **`BarberBlocksTab`**: Formulario simple para crear recesos de días libres específicos (como vacaciones) o pausas por unas horas sin alterar el horario habitual semanal.
4. **`BarberAppointmentsTab`**: Permite ver todas las citas del día seleccionado. Permite "Finalizar" una cita o "Cancelar" (requiere motivo).

**Importante:** Se utiliza diseño sin emojis, tipografía `Inter` (importada localmente en el Root) y las validaciones lanzan un `toast` rojo al fallar, bloqueando inserciones inválidas en UI.

---

## Flujo de Notificaciones (Resend)

Cuando un barbero cancela una cita, llama a la mutación `cancelAppointment` de Convex (`appointments.ts`). 
Esa mutación:
1. Cambia el estado en la base de datos.
2. Invoca silenciosamente a un **Convex Action** interno (`notificationsNode:sendCancellationEmail`).
3. El action usa la SDK oficial de Resend en el entorno Node de Convex para mandar un correo transaccional en tiempo real.
*(Requiere que las variables `RESEND_API_KEY` y `RESEND_FROM_EMAIL` estén en el Dashboard de Convex).*

---

## Para Continuar el Desarrollo

Para el próximo desarrollador (Compañero) trabajando en este proyecto, estos son los siguientes flujos naturales:

1. **Flujo del Cliente (Booking Web):** Construir la UI donde el cliente escoja servicio, barbero y use la función api `slots.getAvailableSlots` para generar un picker de horario moderno y amigable. Una vez que escoge turno, llama a `api.appointments.createAppointment`.
2. **Dashboard de Admin (`dashboard.tsx`):** Un panel que lea todas las citas del local, pueda gestionar roles y ver métricas.
3. **Mejoras:** Podrías conectar pasarelas de pago, pero antes asegúrate en la vista del Front que se gestione correctamente la autenticación con roles.

¡Éxito con el desarrollo! Todo el core lógico y robusto está 100% operativo y probado en el panel barberos.
