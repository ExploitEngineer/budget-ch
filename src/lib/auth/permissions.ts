export function requireAdminRole(userRole: string) {
  if (userRole !== "admin")
    throw new Error("Access denied: Admin role required");
}
export function isAdmin(userRole: string) {
  return userRole === "admin";
}
export function isMember(userRole: string) {
  return userRole === "member";
}
