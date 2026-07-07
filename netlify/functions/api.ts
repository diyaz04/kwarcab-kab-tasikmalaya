import serverless from 'serverless-http';
import { app, db } from '../../server';

const expressHandler = serverless(app);

const normalizeApiEvent = (event: any) => {
  const currentPath = event.path || '/';
  const functionPrefix = '/.netlify/functions/api';
  let normalizedPath = currentPath;

  if (currentPath.startsWith(functionPrefix)) {
    normalizedPath = `/api${currentPath.slice(functionPrefix.length)}`;
  } else if (!currentPath.startsWith('/api')) {
    normalizedPath = `/api${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;
  }

  return {
    ...event,
    path: normalizedPath,
    rawUrl: `${normalizedPath}${event.rawQuery ? `?${event.rawQuery}` : ''}`
  };
};

export const handler = async (event: any, context: any) => {
  await db.ready;
  return expressHandler(normalizeApiEvent(event), context);
};
