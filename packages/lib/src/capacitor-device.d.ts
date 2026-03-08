/**
 * Minimal types for optional @capacitor/device usage.
 * The package is an optional peer; this declaration allows type-checking without installing it in the lib.
 */
declare module "@capacitor/device" {
  export const Device: {
    getInfo(): Promise<{
      model?: string
      platform?: string
      operatingSystem?: string
      osVersion?: string
      manufacturer?: string
      isVirtual?: boolean
    }>
    getId(): Promise<{ identifier: string }>
  }
}
