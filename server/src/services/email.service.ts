import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { EmailTemplate, EmailTemplateKey } from '../models/EmailTemplate.model';
import { renderTemplateString } from './whiteLabel.service';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend. When `RESEND_API_KEY` is unset (typical in local
 * dev), it logs the subject and HTML instead of failing — so flows that depend
 * on email (verification, reset) remain testable without a provider.
 */
async function send({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    logger.info({ to, subject }, '[email:dev] RESEND_API_KEY not set — not sending. HTML below:');
    logger.info(html);
    return;
  }

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) {
    logger.error({ err: error, to, subject }, 'Failed to send email');
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

/** Minimal branded HTML shell shared by all transactional emails. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:Inter,Arial,sans-serif;color:#1a1a2e">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ececf0">
      <div style="background:#6366f1;padding:24px 32px;color:#fff;font-size:20px;font-weight:700">NextLearn</div>
      <div style="padding:32px">
        <h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;color:#8a8aa3;font-size:12px;border-top:1px solid #ececf0">
        You received this email from NextLearn. If you didn't expect it, you can safely ignore it.
      </div>
    </div>
  </body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">${label}</a>`;
}

/**
 * Returns a tenant's enabled custom override for a template key, rendered with
 * `vars`, or null to fall back to the platform default. Best-effort: a lookup
 * failure must never block a transactional email.
 */
async function customOverride(
  tenantId: string | undefined,
  key: EmailTemplateKey,
  vars: Record<string, string>,
  actionUrl?: string,
  actionLabel?: string,
): Promise<{ subject: string; html: string } | null> {
  if (!tenantId) return null;
  try {
    const t = await EmailTemplate.findOne({ tenantId, key, enabled: true }).lean();
    if (!t) return null;
    const bodyHtml = `<p>${renderTemplateString(t.body, vars)}</p>${
      actionUrl && actionLabel ? `<p style="margin:24px 0">${button(actionUrl, actionLabel)}</p>` : ''
    }`;
    return {
      subject: renderTemplateString(t.subject, vars),
      html: layout(renderTemplateString(t.heading, vars), bodyHtml),
    };
  } catch (err) {
    logger.warn({ err, key }, 'Custom email template lookup failed; using default');
    return null;
  }
}

/**
 * Transactional email API. (HTML templates here are intentionally minimal;
 * they are slated to be replaced by React Email components in a later phase.)
 */
export const EmailService = {
  async sendVerificationEmail(
    to: string,
    name: string,
    verifyUrl: string,
    tenantId?: string,
    platformName = 'NextLearn',
  ): Promise<void> {
    const override = await customOverride(
      tenantId,
      'verification',
      { name, platformName, actionUrl: verifyUrl },
      verifyUrl,
      'Verify email',
    );
    if (override) {
      await send({ to, subject: override.subject, html: override.html });
      return;
    }
    await send({
      to,
      subject: 'Verify your NextLearn account',
      html: layout(
        `Welcome, ${name} 👋`,
        `<p>Confirm your email address to activate your account.</p>
         <p style="margin:24px 0">${button(verifyUrl, 'Verify email')}</p>
         <p style="color:#8a8aa3;font-size:13px">This link expires in 24 hours.</p>`,
      ),
    });
  },

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    await send({
      to,
      subject: 'Reset your NextLearn password',
      html: layout(
        `Password reset`,
        `<p>Hi ${name}, we received a request to reset your password.</p>
         <p style="margin:24px 0">${button(resetUrl, 'Reset password')}</p>
         <p style="color:#8a8aa3;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
      ),
    });
  },

  async sendTenantWelcomeEmail(
    to: string,
    name: string,
    orgName: string,
    temporaryPassword: string,
    loginUrl: string,
  ): Promise<void> {
    await send({
      to,
      subject: `Your ${orgName} platform is ready 🎉`,
      html: layout(
        `Welcome, ${name}!`,
        `<p>Your white-label learning platform <strong>${orgName}</strong> has been created.</p>
         <p>Sign in as the administrator with these credentials:</p>
         <p style="background:#f4f4f7;border-radius:8px;padding:16px;font-family:monospace">
           Email: ${to}<br/>Temporary password: <strong>${temporaryPassword}</strong>
         </p>
         <p style="color:#c0392b;font-size:13px">Change this password right after your first login.</p>
         <p style="margin:24px 0">${button(loginUrl, 'Sign in')}</p>`,
      ),
    });
  },

  async sendWeeklyDigest(to: string, name: string, activeCourses: number): Promise<void> {
    await send({
      to,
      subject: 'Your weekly learning update',
      html: layout(
        `Keep the momentum, ${name}! 📚`,
        `<p>You have <strong>${activeCourses} course${activeCourses > 1 ? 's' : ''}</strong> in progress.
         Spend just 20 minutes today and keep your streak alive.</p>
         <p style="margin:24px 0">${button(`${env.CLIENT_URL}/dashboard`, 'Continue learning')}</p>`,
      ),
    });
  },

  async sendWelcomeEmail(
    to: string,
    name: string,
    tenantId?: string,
    platformName = 'NextLearn',
  ): Promise<void> {
    const override = await customOverride(
      tenantId,
      'welcome',
      { name, platformName },
      env.CLIENT_URL,
      `Go to ${platformName}`,
    );
    if (override) {
      await send({ to, subject: override.subject, html: override.html });
      return;
    }
    await send({
      to,
      subject: 'Welcome to NextLearn 🎉',
      html: layout(
        `You're all set, ${name}!`,
        `<p>Your email is verified and your account is ready. Start exploring courses and learning today.</p>
         <p style="margin:24px 0">${button(env.CLIENT_URL, 'Go to NextLearn')}</p>`,
      ),
    });
  },
};
