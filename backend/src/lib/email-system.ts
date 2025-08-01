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
  templateAlias?: string;
  templateModel?: object;
  credentialName?: string; // Optional: specify which credential to use
  context?: 'chapter.esensi' | 'main.esensi' | 'publish.esensi' | 'auth.esensi' | 'internal.esensi' | 'company.esensi'; // Optional: specify domain context
}

class EmailSystem {
  private credentials: Map<string, EmailCredential> = new Map();
  private defaultCredential: string = 'default';

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    // Load default credential (sistem lama)
    if (process.env.SMTP_SERVER && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.credentials.set('default', {
        name: 'default',
        host: process.env.SMTP_SERVER,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: process.env.SMTP_FROM || "info@esensi.online",
        headers: process.env.SMTP_MESSAGE_STREAM ? {
          "X-PM-Message-Stream": process.env.SMTP_MESSAGE_STREAM as string
        } : undefined
      });
    }

    // Load postmark credential (sistem baru)
    if (process.env.SMTP_SERVER_2 && process.env.SMTP_USER_2 && process.env.SMTP_PASS_2) {
      this.credentials.set('postmark', {
        name: 'postmark',
        host: process.env.SMTP_SERVER_2,
        port: parseInt(process.env.SMTP_PORT_2 || "587"),
        secure: process.env.SMTP_SECURE_2 === "true",
        auth: {
          user: process.env.SMTP_USER_2,
          pass: process.env.SMTP_PASS_2,
        },
        from: process.env.SMTP_FROM_2 || "notif@esensichapter.com",
        headers: process.env.SMTP_MESSAGE_STREAM_2 ? {
          "X-PM-Message-Stream": process.env.SMTP_MESSAGE_STREAM_2 as string
        } : undefined
      });
    }

    // Load additional credentials (SMTP_SERVER_3, SMTP_SERVER_4, etc.)
    for (let i = 3; i <= 10; i++) {
      const serverKey = `SMTP_SERVER_${i}`;
      const userKey = `SMTP_USER_${i}`;
      const passKey = `SMTP_PASS_${i}`;
      
      if (process.env[serverKey] && process.env[userKey] && process.env[passKey]) {
        this.credentials.set(`smtp${i}`, {
          name: `smtp${i}`,
          host: process.env[serverKey] as string,
          port: parseInt(process.env[`SMTP_PORT_${i}`] || "587"),
          secure: process.env[`SMTP_SECURE_${i}`] === "true",
          auth: {
            user: process.env[userKey] as string,
            pass: process.env[passKey] as string,
          },
          from: process.env[`SMTP_FROM_${i}`] || `noreply@domain${i}.com`,
          headers: process.env[`SMTP_MESSAGE_STREAM_${i}`] ? {
            "X-PM-Message-Stream": process.env[`SMTP_MESSAGE_STREAM_${i}`] as string
          } : undefined
        });
      }
    }

    // Set default credential priority
    if (this.credentials.has('postmark')) {
      this.defaultCredential = 'postmark';
    } else if (this.credentials.has('default')) {
      this.defaultCredential = 'default';
    } else {
      // Use first available credential
      const firstKey = Array.from(this.credentials.keys())[0];
      if (firstKey) {
        this.defaultCredential = firstKey;
      }
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

  // Smart credential selection based on context
  private selectCredentialByContext(options: SendEmailOptions): string {
    // If explicitly specified, use that
    if (options.credentialName) {
      return options.credentialName;
    }

    // Check if request is chapter.esensi related
    const isChapterRelated = this.isChapterContext(options);
    
    if (isChapterRelated && this.credentials.has('postmark')) {
      return 'postmark'; // Use notif@esensichapter.com for chapter.esensi
    }
    
    // Use default for everything else
    return this.credentials.has('default') ? 'default' : this.defaultCredential;
  }

  private isChapterContext(options: SendEmailOptions): boolean {
    // First check explicit context
    if (options.context === 'chapter.esensi') {
      return true;
    }
    
    // Then check content indicators
    const indicators = [
      options.subject?.toLowerCase().includes('chapter'),
      options.subject?.toLowerCase().includes('esensi chapter'),
      options.text?.toLowerCase().includes('esensichapter'),
      options.html?.toLowerCase().includes('esensichapter'),
      options.html?.toLowerCase().includes('chapter.esensi'),
      options.html?.toLowerCase().includes('penulis-pionir'),
      // Add more context checks as needed
    ];
    
    return indicators.some(Boolean);
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const credentialName = this.selectCredentialByContext(options);
    const credential = this.credentials.get(credentialName);

    if (!credential) {
      return {
        success: false,
        error: `Email credential '${credentialName}' not found. Available: ${this.getCredentials().join(', ')}`
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: credential.host,
        port: credential.port,
        secure: credential.secure,
        auth: credential.auth,
      });

      const mail = options.templateAlias && options.templateModel
        ? {
            from: credential.from,
            to: options.to,
            templateAlias: options.templateAlias,
            templateModel: options.templateModel,
            headers: credential.headers
          }
        : {
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
export const sendEmail = async (options: Omit<SendEmailOptions, 'credentialName'> & { credentialName?: string }) => {
  const result = await emailSystem.sendEmail(options);
  if (!result.success && result.error) {
    throw new Error(result.error);
  }
  return result;
};

// Helper functions for specific contexts
export const sendChapterEmail = async (options: Omit<SendEmailOptions, 'context'>) => {
  return emailSystem.sendEmail({ ...options, context: 'chapter.esensi' });
};

export const sendMainEmail = async (options: Omit<SendEmailOptions, 'context'>) => {
  return emailSystem.sendEmail({ ...options, context: 'main.esensi' });
};

export const sendPublishEmail = async (options: Omit<SendEmailOptions, 'context'>) => {
  return emailSystem.sendEmail({ ...options, context: 'publish.esensi' });
};

export const sendAuthEmail = async (options: Omit<SendEmailOptions, 'context'>) => {
  return emailSystem.sendEmail({ ...options, context: 'auth.esensi' });
};

export const sendInternalEmail = async (options: Omit<SendEmailOptions, 'context'>) => {
  return emailSystem.sendEmail({ ...options, context: 'internal.esensi' });
};