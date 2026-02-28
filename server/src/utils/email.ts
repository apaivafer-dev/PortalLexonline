import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// IMPORTANTE: Não cacheamos o cliente. Criamos um novo a cada chamada
// para garantir que RESEND_API_KEY seja lida DEPOIS do middleware que a injeta.
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('[EMAIL] RESEND_API_KEY não definida. Verifique os segredos do Firebase.');
  }
  return new Resend(apiKey);
}

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

export async function sendConfirmationEmail(email: string, name: string, token: string) {
  const confirmLink = `${getFrontendUrl()}/confirm-email?token=${token}`;

  await getResend().emails.send({
    from: 'LexOnline <no-reply@lexonline.com.br>',
    to: email,
    subject: 'Confirme seu email - LexOnline',
    html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Bem-vindo ao LexOnline, ${name}!</h2>
                    <p>Ficamos felizes em ter você conosco. Para começar a usar todas as funcionalidades, por favor confirme seu endereço de email clicando no botão abaixo:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar Email</a>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">Este link é válido por 24 horas.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94a3b8;">Se você não criou esta conta, por favor ignore este email.</p>
                </div>
            `
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${getFrontendUrl()}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: 'LexOnline <no-reply@lexonline.com.br>',
    to: email,
    subject: 'Redefinição de Senha - LexOnline',
    html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Olá, ${name}</h2>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta LexOnline.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">Este link é válido por 24 horas.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94a3b8;">Se você não solicitou a redefinição, pode ignorar este email com segurança.</p>
                </div>
            `
  });
}

export async function sendWelcomeInviteEmail(email: string, name: string, token: string) {
  const inviteLink = `${getFrontendUrl()}/setup-password?token=${token}`;

  try {
    await getResend().emails.send({
      from: 'LexOnline <no-reply@lexonline.com.br>',
      to: email,
      subject: 'Você foi convidado para o LexOnline',
      html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Parabéns, ${name}!</h2>
                    <p>Você foi convidado para acessar a plataforma LexOnline.</p>
                    <p>Para concluir seu cadastro e definir sua senha de acesso, clique no botão abaixo:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Definir Senha e Acessar</a>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">Este link é válido por 24 horas.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #94a3b8;">Seja bem-vindo!</p>
                </div>
            `
    });
  } catch (error) {
    console.error('Error sending invite email:', error);
  }
}

export interface CompanyInfo {
  firmName: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  whatsapp?: string;
}

export async function sendCalculationResultEmail(
  to: string,
  recipientName: string,
  company: CompanyInfo,
  calculationHtml: string | null,
  bcc?: string
) {
  const cleanPhone = company.phone.replace(/\D/g, '');
  const cleanWhatsapp = (company.whatsapp || company.phone).replace(/\D/g, '');
  const finalWhatsapp = cleanWhatsapp.startsWith('55') ? cleanWhatsapp : `55${cleanWhatsapp}`;
  const whatsappUrl = `https://wa.me/${finalWhatsapp}?text=${encodeURIComponent('Olá, quero falar com um especialista sobre meu cálculo de rescisão.')}`;

  const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#0f172a;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Seu Cálculo de Rescisão</h1>
                  <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${company.firmName}</p>
                </td>
              </tr>

              <!-- Congrats -->
              <tr>
                <td style="padding:40px 40px 24px;">
                  <div style="text-align:center;margin-bottom:32px;">
                    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800;">${recipientName}, seu cálculo está pronto!</h2>
                    <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
                      Abaixo você confere o demonstrativo detalhado da sua rescisão trabalhista.
                    </p>
                  </div>

                  <!-- Disclaimer -->
                  <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:32px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      <strong>&#9888; Estimativa Educativa:</strong> O valor exato depende da sua convenção coletiva e detalhes do contrato. Consulte um advogado para uma análise jurídica precisa.
                    </p>
                  </div>

                  ${calculationHtml ? `
                  <!-- Calculation Summary -->
                  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:32px;">
                    <h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Detalhamento do Cálculo</h3>
                    <div style="color: #334155; font-size: 14px; line-height: 1.6;">
                      ${calculationHtml}
                    </div>
                  </div>` : ''}

                  <!-- Company Card -->
                  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
                    <h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Fale com o Especialista</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#475569;font-size:14px;">
                          <strong style="color:#0f172a;">${company.firmName}</strong>
                        </td>
                      </tr>
                      ${company.city ? `<tr><td style="padding:4px 0;color:#475569;font-size:14px;">&#128205; ${company.city}${company.state ? ` - ${company.state}` : ''}</td></tr>` : ''}
                      ${company.phone ? `<tr><td style="padding:4px 0;font-size:14px;">&#128222; <a href="tel:${cleanPhone}" style="color:#0f172a;text-decoration:none;">${company.phone}</a></td></tr>` : ''}
                      ${company.whatsapp ? `<tr><td style="padding:4px 0;font-size:14px;">&#128172; <a href="https://wa.me/${finalWhatsapp}" style="color:#25d366;text-decoration:none;">WhatsApp: ${company.whatsapp}</a></td></tr>` : ''}
                      ${company.email ? `<tr><td style="padding:4px 0;font-size:14px;">&#9993; <a href="mailto:${company.email}" style="color:#4f46e5;text-decoration:none;">${company.email}</a></td></tr>` : ''}
                      ${company.website ? `<tr><td style="padding:4px 0;font-size:14px;">&#127758; <a href="${company.website}" style="color:#4f46e5;text-decoration:none;">${company.website}</a></td></tr>` : ''}
                    </table>
                  </div>

                  <!-- WhatsApp CTA -->
                  ${cleanPhone ? `
                  <div style="text-align:center;margin-bottom:32px;">
                    <a href="${whatsappUrl}" 
                       style="display:inline-block;background:#25d366;color:#ffffff;font-weight:800;font-size:15px;padding:16px 36px;border-radius:50px;text-decoration:none;">
                      &#128172; Falar com Advogado no WhatsApp
                    </a>
                    <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;">Atendimento personalizado para o seu caso</p>
                  </div>` : ''}

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                    Este e-mail foi enviado automaticamente após a sua solicitação de cálculo.<br/>
                    A LexOnline não retém dados sensíveis de conta bancária ou senhas.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
        </body>
        </html>
    `;

  await getResend().emails.send({
    from: 'LexOnline <no-reply@lexonline.com.br>',
    to,
    bcc,
    subject: `Resultado do seu Cálculo de Rescisão - ${company.firmName}`,
    html,
  });
}
