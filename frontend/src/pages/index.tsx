import { useLocal } from "@/lib/hooks/use-local";

export default function HomePage() {
  const local = useLocal({
    loading: true,
    data: null as any
  }, async () => {
    // Example async initialization
    setTimeout(() => {
      local.loading = false;
      local.data = { message: "Welcome to RCore Template!" };
      local.render();
    }, 1000);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          RCore Template
        </h1>
        
        {local.loading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-center mb-8">{local.data?.message}</p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
                <p className="text-muted-foreground">
                  Edit this page in <code className="text-sm bg-muted px-1 py-0.5 rounded">frontend/src/pages/index.tsx</code>
                </p>
              </div>
              
              <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Features</h2>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React 19 + TypeScript</li>
                  <li>• Tailwind CSS + Shadcn UI</li>
                  <li>• Valtio State Management</li>
                  <li>• Prisma ORM</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
