const VERIFICATION_TEMPLATES = {
  ko: {
    subject: 'Miriel - @@CODE@@ 인증 코드',
    heading: 'Miriel 이메일 인증',
    greeting: '안녕하세요! 아래 인증 코드를 입력해주세요.',
    codeLabel: '인증 코드',
    expiry: '이 코드는 10분간 유효합니다.',
    footer: '본인이 요청하지 않으셨다면 이 메일을 무시해주세요.',
  },
  en: {
    subject: 'Miriel - @@CODE@@ Verification Code',
    heading: 'Miriel Email Verification',
    greeting: 'Hello! Please enter the verification code below.',
    codeLabel: 'Verification Code',
    expiry: 'This code is valid for 10 minutes.',
    footer: 'If you did not request this, please ignore this email.',
  },
} as const;

const FIND_ID_TEMPLATES = {
  ko: {
    subject: 'Miriel — 아이디 안내',
    heading: 'Miriel — 아이디 안내',
    greeting: '안녕하세요, 요청하신 아이디 정보입니다.',
    label: '회원님의 아이디',
    footer: '본인이 요청하지 않으셨다면, 계정이 노출되었을 수 있습니다. 즉시 비밀번호를 변경하시고, 문제가 지속되면 support@miriel.app으로 문의해주세요.',
  },
  en: {
    subject: 'Miriel — Your Username',
    heading: 'Miriel — Your Username',
    greeting: 'Hello, here is the username you requested.',
    label: 'Your Username',
    footer: 'If you did not request this, your account may be compromised. Please change your password immediately and contact support@miriel.app if the issue persists.',
  },
} as const;

const RESET_PASSWORD_TEMPLATES = {
  ko: {
    subject: 'Miriel — 비밀번호 재설정',
    heading: 'Miriel — 비밀번호 재설정',
    greeting: '아래 링크를 클릭하여 비밀번호를 재설정해주세요.',
    buttonText: '비밀번호 재설정',
    expiry: '이 링크는 30분간 유효합니다.',
    footer: '본인이 요청하지 않으셨다면 이 메일을 무시해주세요.',
  },
  en: {
    subject: 'Miriel — Reset Password',
    heading: 'Miriel — Reset Password',
    greeting: 'Click the link below to reset your password.',
    buttonText: 'Reset Password',
    expiry: 'This link is valid for 30 minutes.',
    footer: 'If you did not request this, please ignore this email.',
  },
} as const;

function wrapHtml(lang: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
    ${content}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">Miriel by Arkenstone Labs &mdash; miriel.app</p>
  </div>
</body>
</html>`;
}

export function buildVerificationEmailHtml(lang: 'ko' | 'en', code: string): string {
  const t = VERIFICATION_TEMPLATES[lang];
  return wrapHtml(lang, `
    <h2 style="color:#0891b2;margin-bottom:24px;">${t.heading}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${t.greeting}</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${t.codeLabel}</p>
      <p style="color:#0891b2;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;">${code}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.5;">${t.expiry}</p>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin-top:16px;">${t.footer}</p>
  `);
}

export function buildFindIdEmailHtml(lang: 'ko' | 'en', username: string): string {
  const t = FIND_ID_TEMPLATES[lang];
  return wrapHtml(lang, `
    <h2 style="color:#0891b2;margin-bottom:24px;">${t.heading}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${t.greeting}</p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">${t.label}</p>
      <p style="color:#0891b2;font-size:24px;font-weight:700;margin:0;">${username}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.5;">${t.footer}</p>
  `);
}

export function buildResetPasswordEmailHtml(lang: 'ko' | 'en', resetLink: string): string {
  const t = RESET_PASSWORD_TEMPLATES[lang];
  return wrapHtml(lang, `
    <h2 style="color:#0891b2;margin-bottom:24px;">${t.heading}</h2>
    <p style="color:#374151;font-size:16px;line-height:1.6;">${t.greeting}</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${resetLink}" style="display:inline-block;background:#0891b2;color:#fff;font-size:16px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">${t.buttonText}</a>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:1.5;">${t.expiry}</p>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin-top:16px;">${t.footer}</p>
  `);
}

export function getVerificationSubject(lang: 'ko' | 'en', code: string): string {
  return VERIFICATION_TEMPLATES[lang].subject.replace('@@CODE@@', code);
}

export function getFindIdSubject(lang: 'ko' | 'en'): string {
  return FIND_ID_TEMPLATES[lang].subject;
}

export function getResetPasswordSubject(lang: 'ko' | 'en'): string {
  return RESET_PASSWORD_TEMPLATES[lang].subject;
}

export async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Miriel <noreply@miriel.app>',
      reply_to: 'support@miriel.app',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    console.error('Resend error:', await response.text());
    return false;
  }
  return true;
}
