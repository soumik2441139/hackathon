/**
 * Swagger API Documentation Generator
 * Run: npx ts-node swagger.ts (generates swagger-output.json)
 */
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'OpusHire API',
    version: '2.0.0',
    description: `
**OpusHire** - Enterprise-Grade Autonomous Career Protocol API.

Endpoints are grouped by domain:
- 🔐 **Auth** — Registration, Login, JWT token management
- 💼 **Jobs** — Job listings, search, AI tag pipeline management  
- 📄 **Resume** — Upload, parse, and AI-match candidate resumes
- 🤝 **Applications** — Apply for jobs, track application status
- 🧠 **AI Matching** — Semantic Qdrant vector search
- 🎓 **Career Advisor** — LLM-powered skill gap analysis
- 🤖 **Bots** — Background AI micro-agent status & monitoring
    `,
    contact: { name: 'Soumik', url: 'https://github.com/soumik2441139/OpusHire' },
  },
  host: process.env.NODE_ENV === 'production'
    ? 'opushire-backend-app-hbarc3h7ckashzhb.centralindia-01.azurewebsites.net'
    : 'localhost:5000',
  basePath: '/',
  schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
  securityDefinitions: {
    BearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT token. Format: **Bearer &lt;token&gt;**',
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Health', description: 'API status & diagnostics' },
    { name: 'Auth', description: 'Authentication & user management' },
    { name: 'Jobs', description: 'Job listing management & AI pipeline' },
    { name: 'Resume', description: 'Resume upload & AI parsing pipeline' },
    { name: 'Applications', description: 'Application tracking' },
    { name: 'AI Matching', description: 'Semantic vector search endpoints' },
    { name: 'Career Advisor', description: 'AI-powered career insights' },
    { name: 'Bots', description: 'AI micro-agent monitoring' },
  ],
};

const outputFile = './swagger-output.json';
const routes = [
  './src/server.ts',
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);
