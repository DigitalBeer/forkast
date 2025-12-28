export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Test Page</h1>
        <p className="text-gray-600 text-center">
          If you can see this, the routing is working correctly.
        </p>
        <div className="mt-6">
          <a 
            href="/plan" 
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Plan Page
          </a>
        </div>
      </div>
    </div>
  );
}
