import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@v1_peluqueria/backend/convex/_generated/api";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Hello World
        </h1>
        <p className="max-w-[400px] text-muted-foreground">
          {user ? (
            <span>Welcome back, <span className="font-medium text-foreground">{user.name}</span>! Ready for your next appointment?</span>
          ) : (
            "Book your next haircut with ease. Sign in to get started."
          )}
        </p>
      </div>
    </main>
  );
}
