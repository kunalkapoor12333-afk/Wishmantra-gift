import serverless from 'serverless-http';
import { createApiApp } from '../../server/app.ts';

const { app } = createApiApp();
const serverlessHandler = serverless(app);

export const handler = async (
  event: Parameters<typeof serverlessHandler>[0],
  context: Parameters<typeof serverlessHandler>[1]
) => {
  return serverlessHandler(event, context);
};
