// app/api/careers/route.ts
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "").slice(0, 120);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const area = String(form.get("area") || "").trim();
    const message = String(form.get("message") || "").trim();
    const cv = form.get("cv");

    // Validações básicas
    if (!name || !email || !area || !cv || !(cv instanceof File)) {
      return Response.json(
        { error: "Preencha nome, e-mail, área e anexe o currículo." },
        { status: 400 }
      );
    }

    // Tipos aceitos
    const allowedTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);

    if (!allowedTypes.has(cv.type)) {
      return Response.json(
        { error: "Formato inválido. Envie PDF, DOC ou DOCX." },
        { status: 400 }
      );
    }

    // Limite simples (8MB)
    const maxBytes = 8 * 1024 * 1024;
    if (cv.size > maxBytes) {
      return Response.json(
        { error: "Arquivo muito grande. Limite: 8MB." },
        { status: 400 }
      );
    }

    // Variáveis de ambiente (Gmail com senha de app)
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      return Response.json(
        { error: "Configuração de e-mail ausente no servidor." },
        { status: 500 }
      );
    }

    const subject = `Carreiras - Site - Currículo (${name})`;

    const buffer = Buffer.from(await cv.arrayBuffer());
    const filename = sanitizeFilename(cv.name || `curriculo-${name}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Trabalhe Conosco - Currículo recebido</h2>
        <p><b>Nome:</b> ${escapeHtml(name)}</p>
        <p><b>E-mail:</b> ${escapeHtml(email)}</p>
        <p><b>Telefone:</b> ${escapeHtml(phone || "-")}</p>
        <p><b>Área de interesse:</b> ${escapeHtml(area)}</p>
        <p><b>Mensagem:</b><br/>${escapeHtml(message || "-").replace(
          /\n/g,
          "<br/>"
        )}</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">
          Enviado pelo formulário “Trabalhe conosco” do site.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `Site - Carreiras <${gmailUser}>`,
      to: "adv.ghgomes@gmail.com",
      replyTo: email,
      subject,
      html,
      attachments: [
        {
          filename,
          content: buffer,
          contentType: cv.type,
        },
      ],
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: "Erro ao enviar. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}