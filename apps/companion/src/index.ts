import { createCompanion } from './server/server';
import { ClaudeAdapter } from './adapters/claude';
import { OpenCodeAdapter } from './adapters/opencode';
const { server, token } = createCompanion([new ClaudeAdapter(), new OpenCodeAdapter()]);
server.listen(43127, '127.0.0.1', () => {
  console.log('Kiko companion listening on 127.0.0.1:43127');
  console.log(`Pairing token (paste into Kiko settings): ${token}`);
  console.log('A new token is generated each time the companion starts.');
});
