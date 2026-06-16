type AnalyticsPropertyValue = string | number | boolean | null | undefined;

type ArtifactKind = "cad" | "model" | "sketch" | "markdown";
type AuthGateAction = "sign-in" | "upgrade";
type DownloadKind = "artifact" | "source";
type ShareKind = "model" | "sketch" | "markdown" | "public";
export type UploadSource = "drag_drop" | "file_picker" | "mask_edit" | "local_model_share";

export interface AnalyticsEventProperties {
  cta_clicked: {
    cta: string;
    destination?: string;
    location: string;
  };
  sign_in_opened: {
    location: string;
    gate?: string;
  };
  upgrade_clicked: {
    location: string;
    gate?: string;
  };
  pricing_viewed: {
    access_state: "signed_out" | "subscriber" | "trial_or_vip" | "signed_in_no_access";
  };
  checkout_started: {
    access_state: "signed_out" | "subscriber" | "trial_or_vip" | "signed_in_no_access";
    location: string;
  };
  agent_profile_opened: {
    agent_name: string;
    agent_role: string;
    is_available: boolean;
  };
  agent_profile_cta_clicked: {
    agent_name: string;
    destination?: string;
    is_available: boolean;
  };
  agent_selected: {
    agent_id: string;
    previous_agent_id?: string;
    source: "empty_state" | "mode_picker" | "new_chat_confirmation";
    has_started_chat: boolean;
    requires_new_chat_confirmation: boolean;
  };
  auth_gate_clicked: {
    action: AuthGateAction;
    gate: string;
    agent_id?: string;
    reasoning_effort?: string;
    is_signed_in: boolean;
  };
  message_submitted: {
    agent_id: string;
    attachment_count: number;
    has_attachments: boolean;
    is_vip: boolean;
    message_length: number;
    model?: string;
    new_thread: boolean;
    reasoning_effort: string;
    submission_source: "composer" | "mask_editor" | "programmatic";
    thread_id_present: boolean;
  };
  model_selected: {
    agent_id: string;
    is_vip: boolean;
    model: string;
    previous_model?: string;
  };
  reasoning_effort_selected: {
    agent_id: string;
    has_advanced_reasoning: boolean;
    reasoning_effort: string;
    previous_reasoning_effort?: string;
  };
  generation_started: {
    agent_id: string;
    run_id?: string;
    thread_id: string;
  };
  generation_stopped: {
    agent_id: string;
    had_active_run_id: boolean;
    run_id?: string;
    stop_mode: "rollback" | "local";
    thread_id?: string;
  };
  generation_error: {
    agent_id: string;
    error_kind: string;
    thread_id_present: boolean;
    was_stop_requested: boolean;
  };
  artifact_revision_received: {
    agent_id: string;
    artifact_kind: ArtifactKind;
    design_id?: string;
    export_count: number;
    revision_number: number;
  };
  file_upload_rejected: {
    content_type: string;
    extension: string;
    size_bucket: string;
    source: UploadSource;
  };
  file_upload_succeeded: {
    content_type: string;
    extension: string;
    size_bucket: string;
    source: UploadSource;
  };
  file_upload_failed: {
    content_type: string;
    error_kind: string;
    extension: string;
    size_bucket: string;
    source: UploadSource;
  };
  model_load_started: {
    format: string;
    source_kind: string;
  };
  model_load_succeeded: {
    format: string;
    mesh_count: number;
    source_kind: string;
  };
  model_load_failed: {
    error_kind: string;
    format: string;
    source_kind: string;
  };
  viewer_mode_changed: {
    from_mode: string;
    has_model: boolean;
    has_sketch: boolean;
    to_mode: string;
  };
  viewer_control_changed: {
    control_type: string;
    control_value?: string | number | boolean;
  };
  artifact_download_started: {
    artifact_kind: ArtifactKind;
    download_kind: DownloadKind;
    format?: string;
    source_kind?: string;
  };
  artifact_download_succeeded: {
    artifact_kind: ArtifactKind;
    download_kind: DownloadKind;
    format?: string;
    source_kind?: string;
  };
  artifact_download_failed: {
    artifact_kind: ArtifactKind;
    download_kind: DownloadKind;
    error_kind: string;
    format?: string;
    source_kind?: string;
  };
  share_dialog_opened: {
    artifact_kind: ShareKind;
    has_existing_share?: boolean;
  };
  share_created: {
    already_shared?: boolean;
    artifact_kind: ShareKind;
  };
  share_existing_found: {
    artifact_kind: ShareKind;
  };
  share_failed: {
    artifact_kind: ShareKind;
    error_kind: string;
  };
  share_link_copied: {
    artifact_kind: ShareKind;
  };
  local_model_share_upload_started: {
    extension: string;
    size_bucket: string;
  };
  local_model_share_upload_succeeded: {
    extension: string;
    size_bucket: string;
  };
  local_model_share_upload_failed: {
    error_kind: string;
    extension: string;
    size_bucket: string;
  };
  api_blob_signed_read: ApiOutcomeProperties;
  api_blob_signed_upload: ApiOutcomeProperties;
  api_share_lookup: ApiOutcomeProperties & {
    artifact_kind?: string;
    found?: boolean;
  };
  api_share_create: ApiOutcomeProperties & {
    already_shared?: boolean;
    artifact_kind?: string;
  };
  api_local_model_share_create_upload: ApiOutcomeProperties;
  api_local_model_share_finalize: ApiOutcomeProperties;
  api_langgraph_proxy: ApiOutcomeProperties & {
    method: string;
    path_depth: number;
  };
}

interface ApiOutcomeProperties {
  duration_bucket: string;
  error_kind?: string;
  status: number;
  success: boolean;
}

export type AnalyticsEventName = keyof AnalyticsEventProperties;

function isAnalyticsPropertyValue(value: unknown): value is Exclude<AnalyticsPropertyValue, undefined> {
  return value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean";
}

export function cleanProperties(properties: object): Record<string, string | number | boolean | null> {
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isAnalyticsPropertyValue(value)) cleaned[key] = value;
  }
  return cleaned;
}

export function fileExtension(filename: string): string {
  const extension = filename.split(".").pop();
  return extension && extension !== filename ? extension.toLowerCase() : "none";
}

export function sizeBucket(bytes: number): string {
  if (bytes < 100_000) return "lt_100kb";
  if (bytes < 1_000_000) return "100kb_1mb";
  if (bytes < 10_000_000) return "1mb_10mb";
  if (bytes < 100_000_000) return "10mb_100mb";
  return "gte_100mb";
}

export function durationBucket(durationMs: number): string {
  if (durationMs < 100) return "lt_100ms";
  if (durationMs < 500) return "100ms_500ms";
  if (durationMs < 1_000) return "500ms_1s";
  if (durationMs < 5_000) return "1s_5s";
  if (durationMs < 30_000) return "5s_30s";
  return "gte_30s";
}

export function errorKind(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return typeof error;
}
