export interface RadiusHealth {
  healthy: boolean;
  serviceActive: boolean;
  authProbePassed?: boolean;
  latencyMs?: number;
  detail?: string;
}

export interface RouterHealth {
  reachable: boolean;
  routerId: string;
  wireguardReachable?: boolean;
  apiReachable?: boolean;
  detail?: string;
}

/**
 * Network operations boundary. The production implementation can use a
 * restricted network service over WireGuard rather than exposing RouterOS
 * management directly to public-facing channel handlers.
 */
export interface NetworkGateway {
  checkRadius(): Promise<RadiusHealth>;
  checkRouter(routerId: string): Promise<RouterHealth>;
}
