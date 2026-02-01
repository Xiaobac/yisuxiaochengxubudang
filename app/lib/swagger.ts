import { createSwaggerSpec } from 'next-swagger-doc';
import 'server-only';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // 你的API路由目录
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API文档',
        version: '1.0',
      },
    },
  });
  return spec;
};