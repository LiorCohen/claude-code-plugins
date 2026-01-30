/**
 * Type definitions for configuration files.
 */

export interface VersionInfo {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface PluginJson {
  readonly version: string;
  readonly name?: string;
  readonly description?: string;
}

export interface MarketplaceJson {
  readonly plugins: readonly MarketplacePlugin[];
}

export interface MarketplacePlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

export interface HookInput {
  readonly tool: string;
  readonly tool_input: HookToolInput;
}

export interface HookToolInput {
  readonly file_path?: string;
  readonly path?: string;
}

export interface PreToolUseHookOutput {
  readonly hookSpecificOutput: {
    readonly hookEventName: 'PreToolUse';
    readonly decision: {
      readonly behavior: 'allow' | 'block';
      readonly message?: string;
    };
  };
}

export interface PostToolUseHookOutput {
  readonly hookSpecificOutput: {
    readonly hookEventName: 'PostToolUse';
    readonly message: string;
  };
}
