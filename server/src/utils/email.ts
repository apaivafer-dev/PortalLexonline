import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendConfirmationEmail(email: string, name: string, token: string) {
    const confirmLink = `${frontendUrl}/confirm-email?token=${token}`;

    try {
        await resend.emails.send({
            from: 'LexOnline <onboarding@resend.dev>',
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
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
        await resend.emails.send({
            from: 'LexOnline <onboarding@resend.dev>',
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
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
}

export async function sendWelcomeInviteEmail(email: string, name: string, token: string) {
    const inviteLink = `${frontendUrl}/setup-password?token=${token}`;

    try {
        await resend.emails.send({
            from: 'LexOnline <onboarding@resend.dev>',
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
