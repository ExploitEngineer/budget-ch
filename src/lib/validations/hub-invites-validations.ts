import { z } from "zod";

const accessRole = ["member", "admin"] as const;

export const hubInvitesSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(accessRole, { message: "Please select the role" }),
});

export type HubInvitesValues = z.infer<typeof hubInvitesSchema>;
