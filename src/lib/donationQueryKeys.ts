/** Shared keys so user + admin lists and the sidebar badge stay in sync after mutations. */
export const donationQueryKeys = {
  root: ['donations'] as const,
  userPickups: () => [...donationQueryKeys.root, 'userPickups'] as const,
  userBoxes: () => [...donationQueryKeys.root, 'userBoxes'] as const,
  adminPickups: () => [...donationQueryKeys.root, 'adminPickups'] as const,
  adminBoxes: () => [...donationQueryKeys.root, 'adminBoxes'] as const,
  /** Replaces adminPendingCount: pickups + empty-box PENDING rows */
  adminPendingSummary: () => [...donationQueryKeys.root, 'adminPendingSummary'] as const,
};
