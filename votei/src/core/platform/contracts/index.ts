/**
 * Platform authorization — the operator axis.
 *
 * Deliberately separate from any per-account/tenant role the product adds on
 * top. A tenant role describes what a user may do inside their own account and
 * cannot answer a cross-tenant question: every customer owns their own account,
 * so "is account owner" is true for all of them.
 */
export interface IPlatformAdminRepository {
  /** True when `userId` is a platform operator. Fail-closed on any doubt. */
  isPlatformAdmin(userId: string): Promise<boolean>;
}
