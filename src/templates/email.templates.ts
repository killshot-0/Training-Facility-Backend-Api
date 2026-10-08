export interface SubscriptionEmailProps {
  memberName: string;
  plan: string;
  membership: string,
  amountToPay: string,
  startDate: string;
  endDate: string;
}

export function welcomeEmailTemplate(name: string): string {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0284c7;">Welcome to Training Facility, ${name}!</h2>
      <p>Thank you for registering your member account. You can now make subscriptions, payments and access session reports online.</p>
    </div>
  `;
}

export function subscriptionConfirmationTemplate(props: SubscriptionEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0284c7; padding: 24px; text-align: center; color: #ffffff; }
          .content { padding: 24px; color: #1e293b; line-height: 1.6; }
          .detail-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; margin: 18px 0; border-radius: 0 6px 6px 0; }
          .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">CarePoint Clinic</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Appointment Confirmed!</h2>
            <p>Hello <strong>${props.memberName}</strong>,</p>
            <p>Your subscription has been successfully completed.</p>
            <div class="detail-box">
              <p style="margin: 4px 0;"><strong>Plan:</strong> ${props.plan}</p>
              <p style="margin: 4px 0;"><strong>Membership:</strong> ${props.membership}</p>
              <p style="margin: 4px 0;"><strong>Start date:</strong> ${props.startDate}</p>
              <p style="margin: 4px 0;"><strong>End date:</strong> ${props.endDate}</p>
              <p style="margin: 4px 0;"><strong>Amount To Pay:</strong> <code>${props.amountToPay}</code></p>
            </div>
            <p>If you decide to cancel your subsctiption, please do so at least 48 hours in advance to your start date through the portal. Otherwise please upload payment confirmation 24 hours in advance to your start date through your patient portal.</p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Training Facility Network • 123 Training Center Bld</p>
          </div>
        </div>
      </body>
    </html>
  `;
}