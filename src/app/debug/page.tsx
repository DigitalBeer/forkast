'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [apiStatus, setApiStatus] = useState('checking...');
  const [pageStatus, setPageStatus] = useState('checking...');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});


  useEffect(() => {
    // Test API endpoint
    fetch('/api/debug')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`API is working (${data.timestamp})`);
      })
      .catch(err => {
        setApiStatus(`API Error: ${err.message}`);
      });

    // Test page loading
    setPageStatus('Page loaded successfully');

    // Check environment variables
    setEnvVars({
      'NODE_ENV': process.env.NODE_ENV || 'not set',
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Basic Checks</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Page Status:</span> {pageStatus}</p>
          <p><span className="font-medium">API Status:</span> {apiStatus}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2">
          {Object.entries(envVars).map(([key, value]) => (
            <p key={key}>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{key}</span>:{' '}
              <span className={value === 'not set' ? 'text-red-600' : 'text-green-600'}>
                {value}
              </span>
            </p>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Links</h2>
        <div className="space-y-2">
          <p>
            <a href="/" className="text-blue-600 hover:underline">Home Page</a>
          </p>
          <p>
            <a href="/plan" className="text-blue-600 hover:underline">Meal Plan Page</a>
          </p>
          <p>
            <a href="/api/debug" className="text-blue-600 hover:underline">Debug API</a>
          </p>
        </div>
      </div>
    </div>
  );
}
