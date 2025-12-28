export default function MinimalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Minimal Test Page</h1>
        <p>If you can see this, routing is working at a basic level.</p>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="font-mono text-sm">/src/app/minimal/page.tsx</p>
        </div>
      </div>
    </div>
  );
}
