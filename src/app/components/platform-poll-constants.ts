export const PLATFORMS = ['facebook', 'instagram', 'discord', 'reddit', 'other'] as const
export type Platform = (typeof PLATFORMS)[number]
