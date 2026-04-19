export const PLATFORMS = ['facebook', 'instagram', 'discord', 'reddit'] as const
export type Platform = (typeof PLATFORMS)[number]
