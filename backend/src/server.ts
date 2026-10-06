import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 PG Flow Core Backend Server Running on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Healthcheck: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
