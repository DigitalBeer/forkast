import { getApiDocs } from '@/lib/swagger';
import React from 'react';
import ReactSwagger from './react-swagger';

export const dynamic = 'force-dynamic';

const ApiDocsPage = async () => {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec as Record<string, unknown>} />
    </section>
  );
};

export default ApiDocsPage;
