import { AfipSettings } from './afip-config';
import { ArcaClient } from './arca-client';
import { ArcaSimulator } from './arca-simulator';
import { AfipTokenStore, ArcaWsfeClient } from './arca-wsfe-client';

export function createArcaClient(
  settings: AfipSettings,
  tokens?: AfipTokenStore,
): ArcaClient {
  if (settings.simulate) {
    return new ArcaSimulator(settings.simulateResult);
  }
  if (!tokens) {
    throw new Error('El cliente de ARCA necesita el almacén de tokens.');
  }
  return new ArcaWsfeClient(settings, tokens);
}
