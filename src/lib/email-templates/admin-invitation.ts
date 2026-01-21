import { getMailTranslations } from "@/lib/mail-translations";

export interface AdminInvitationEmailParams {
    link: string;
    role: "user" | "admin";
    subscriptionPlan: "individual" | "family" | null;
    subscriptionMonths: number | null;
    locale: string;
}

export async function buildAdminInvitationEmailHtml(
    params: AdminInvitationEmailParams,
): Promise<{ subject: string; html: string }> {
    const { link, role, subscriptionPlan, subscriptionMonths, locale } = params;

    const t = await getMailTranslations(locale);

    const hasSubscription = subscriptionPlan && subscriptionMonths;

    // ICU select format expects string "true" or "false", not boolean
    const invited = t("emails.admin-invitation.invited", {
        isAdmin: role === "admin" ? "true" : "false",
    });

    const subscriptionSection = hasSubscription
        ? `<p style="background: #e8f5e9; padding: 12px; border-radius: 5px; margin: 15px 0;">
        ${t("emails.admin-invitation.subscription", {
            plan: t(`common.plans.${subscriptionPlan}`),
            months: subscriptionMonths,
        })}
      </p>`
        : "";

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #235FE3;">${t("emails.admin-invitation.title")}</h2>
      <p>${t("emails.admin-invitation.hello")}</p>
      <p>${invited}</p>
      ${subscriptionSection}
      <p style="margin: 20px 0;">
        <a href="${link}" style="
          display: inline-block;
          background-color: #235FE3;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
        ">
          ${t("emails.admin-invitation.button")}
        </a>
      </p>
      <p>${t("emails.admin-invitation.copy-link")} <br/>
         <span style="word-break: break-all; color: #666;">${link}</span>
      </p>
      <p style="color: #999; font-size: 12px;">${t("emails.admin-invitation.expires")}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">${t("emails.admin-invitation.ignore")}</p>
    </div>
  `;

    return {
        subject: t("emails.admin-invitation.subject"),
        html,
    };
}
