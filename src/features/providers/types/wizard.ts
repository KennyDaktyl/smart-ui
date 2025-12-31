export interface WizardResponse {
  vendor: string;
  step: string;
  schema: Record<string, any>;
  options?: Record<string, any>;
  context?: Record<string, any>;
  is_complete: boolean;
  final_config?: Record<string, any> | null;
  credentials?: Record<string, string> | null;
}