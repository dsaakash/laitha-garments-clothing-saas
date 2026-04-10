'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-red-600 p-4 shadow-lg text-white">
        <h1 className="text-2xl font-bold">Lalitha Garments Internal Tool - API Docs</h1>
      </div>
      <div className="p-4">
        <SwaggerUI url="/openapi.json" />
      </div>
    </div>
  );
}
