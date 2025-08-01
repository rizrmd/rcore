import nodemailer from "nodemailer";

export interface EmailCredential {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  headers?: Record<string, string>;
}

export interface SendEmailOptions {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  credentialName?: string; // Optional: specify which credential to use
}

class EmailSystem {
  private credentials: Map<string, EmailCredential> = new Map();
  private defaultCredential: string = 'default';

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    // Load default credential
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.credentials.set('default', {
        name: 'default',
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: process.env.SMTP_FROM || "noreply@example.com",
        headers: process.env.SMTP_HEADERS ? JSON.parse(process.env.SMTP_HEADERS) : undefined
      });
    }

    // Load additional credentials (SMTP_HOST_2, SMTP_HOST_3, etc.)
    for (let i = 2; i <= 10; i++) {
      const hostKey = `SMTP_HOST_${i}`;
      const userKey = `SMTP_USER_${i}`;
      const passKey = `SMTP_PASS_${i}`;
      
      if (process.env[hostKey] && process.env[userKey] && process.env[passKey]) {
        this.credentials.set(`smtp${i}`, {
          name: `smtp${i}`,
          host: process.env[hostKey] as string,
          port: parseInt(process.env[`SMTP_PORT_${i}`] || "587"),
          secure: process.env[`SMTP_SECURE_${i}`] === "true",
          auth: {
            user: process.env[userKey] as string,
            pass: process.env[passKey] as string,
          },
          from: process.env[`SMTP_FROM_${i}`] || `noreply@example.com`,
          headers: process.env[`SMTP_HEADERS_${i}`] ? JSON.parse(process.env[`SMTP_HEADERS_${i}`] as string) : undefined
        });
      }
    }

    // Set default credential
    if (this.credentials.size > 0) {
      this.defaultCredential = Array.from(this.credentials.keys())[0] || 'default';
    }
  }

  getCredentials(): string[] {
    return Array.from(this.credentials.keys());
  }

  getCredential(name: string): EmailCredential | undefined {
    return this.credentials.get(name);
  }

  setDefaultCredential(name: string): boolean {
    if (this.credentials.has(name)) {
      this.defaultCredential = name;
      return true;
    }
    return false;
  }

  getDefaultCredential(): string {
    return this.defaultCredential;
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const credentialName = options.credentialName || this.defaultCredential;
    const credential = this.credentials.get(credentialName);

    if (!credential) {
      // If no email credentials are configured, just log and return success
      console.log('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        preview: options.text?.substring(0, 100)
      });
      return {
        success: true,
        messageId: 'demo-' + Date.now()
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: credential.host,
        port: credential.port,
        secure: credential.secure,
        auth: credential.auth,
      });

      const mail = {
        from: credential.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: credential.headers
      };

      const result = await transporter.sendMail(mail);
      
      console.log(`Email sent successfully using '${credentialName}' to ${options.to}`);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error(`Failed to send email using '${credentialName}':`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Export singleton instance
export const emailSystem = new EmailSystem();

// Legacy function for backward compatibility
export const sendEmail = async (options: SendEmailOptions) => {
  const result = await emailSystem.sendEmail(options);
  if (!result.success && result.error) {
    throw new Error(result.error);
  }
  return result;
};