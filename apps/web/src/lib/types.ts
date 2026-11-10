export interface TelemetryData {
  timestamp: number;
  board_type: string;
  is_jetson: boolean;
  cpu_percent: number;
  memory: {
    total_mb: number;
    used_mb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  gpu: {
    device: string;
    load_percent: number;
    temperature_c: number;
    power_watts: number;
  };
  status: string;
}

export interface BudgetStatus {
  max_budget_usd: number;
  warning_budget_usd: number;
  total_spent_usd: number;
  remaining_budget_usd: number;
  percent_used: number;
  total_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  hard_limit_reached: boolean;
  warning_reached: boolean;
}

export interface NearAccountStatus {
  exists: boolean;
  account_id: string;
  balance_near: number;
  balance_yocto?: string;
  network: string;
  funding_help?: string;
}

export interface BoardPairingStatus {
  paired: boolean;
  board_id: string;
  hardware_type: string;
  ip_address: string;
  connection_type: string;
  near_owner: string;
  paired_at: number;
  status: string;
}

export interface DiscoveredNode {
  label: string;
  url: string;
  type: string;
  reachable: boolean;
  detected_hardware?: string;
  status: string;
}

export interface DerivedAddress {
  chain: string;
  chain_family: string;
  near_account: string;
  derivation_path: string;
  derived_address: string;
  mpc_contract: string;
  supported_assets: string[];
}

export interface IntentQuote {
  ok: boolean;
  asset_in: string;
  asset_out: string;
  amount_in: string;
  amount_out: string;
  min_amount_out: string;
  expiration: number;
  quote_id?: string;
  solvers?: string[];
}

export interface ApprovalRequest {
  id: string;
  action_type: string;
  title: string;
  description: string;
  payload: Record<string, any>;
  risk_level: string;
  created_at: number;
  status: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tier?: string;
  tools?: Array<{
    tool: string;
    arguments?: Record<string, any>;
    output: any;
  }>;
  timestamp: number;
}

export interface KeyFencingStatus {
  account_id: string;
  security_mode: string;
  master_key_protected: boolean;
  can_delete_account: boolean;
  can_transfer_all_funds: boolean;
  allowed_contracts: string[];
  allowed_methods: string[];
  gas_allowance_near: number;
  spent_allowance_near: number;
  remaining_allowance_near: number;
  allowance_used_pct: number;
  primary_key: string;
}

export interface AuditEntry {
  id: string;
  action_type: string;
  title: string;
  operator: string;
  payload_hash: string;
  tx_hash: string;
  block_height: number;
  explorer_url: string;
  timestamp: number;
  verified_on_chain: boolean;
}

export interface AgentProfile {
  did: string;
  name: string;
  version: string;
  owner: string;
  hardware_node: string;
  registry_status: string;
  near_ai_hub_url: string;
  capabilities: Array<{
    name: string;
    chains?: string[];
    contract?: string;
    description: string;
  }>;
  security_specs: {
    fencing: string;
    approval_gates: string;
    max_cloud_budget_usd: number;
  };
  last_active: number;
}

export interface AgentEconomyMetrics {
  total_earned_near: number;
  total_tasks_fulfilled: number;
  active_services: Array<{
    name: string;
    fee_near: number;
  }>;
  recent_tasks: Array<{
    task_id: string;
    client_agent: string;
    service_type: string;
    payment_near: number;
    payment_tx_hash: string;
    timestamp: number;
    status: string;
  }>;
}

export interface W3CDIDDocument {
  "@context": string[];
  id: string;
  alsoKnownAs?: string[];
  controller: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    publicKeyNear?: string;
    blockchainAccountId?: string;
  }>;
  authentication: string[];
  assertionMethod: string[];
  capabilityInvocation: string[];
  service: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
}

export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface FileEntry {
  name: string;
  type: "dir" | "file";
  size: number;
  extension?: string | null;
}

export interface FileListing {
  ok: boolean;
  path: string;
  relative_path: string;
  entries: FileEntry[];
  error?: string;
}

export interface FileContent {
  ok: boolean;
  path: string;
  name: string;
  size: number;
  content: string;
  truncated: boolean;
  error?: string;
}

export interface BoardInfoDetail {
  ok: boolean;
  hostname: string;
  platform: string;
  architecture: string;
  python: string;
  is_jetson: boolean;
  hardware_model: string;
  jetpack_version: string;
  power_mode: string;
  uptime_seconds: number;
}

export interface BoardHealthDetail {
  ok: boolean;
  cpu: {
    percent: number;
    cores: number;
    per_core: number[];
  };
  ram: {
    total_mb: number;
    used_mb: number;
    percent: number;
    swap_used_mb: number;
    swap_total_mb: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  thermals: {
    cpu_temp_c: number;
    gpu_temp_c: number;
    thermal_status: string;
  };
  power: {
    watts: number;
    mode: string;
  };
  gpu: {
    device: string;
    load_percent: number;
    temperature_c: number;
    power_watts: number;
  };
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  status: string;
}

export interface BrowserStatus {
  ok: boolean;
  status: string;
  url: string;
  title: string;
  has_screenshot: boolean;
  engine: string;
  sandboxed: boolean;
}

export interface JobItem {
  id: string;
  name: string;
  kind: string;
  status: string;
  cpu_usage: number;
  created_at: number;
  started_at: number;
  details: string;
}

export interface MemoryDoc {
  ok: boolean;
  content: string;
  path?: string;
  error?: string;
}


export interface VaultSecret {
  name: string;
  masked_preview: string;
  created_at: string;
  updated_at: string;
}

export interface BrainItem {
  name: string;
  angle: string;
  method: string;
  created_at: string;
  updated_at: string;
}
