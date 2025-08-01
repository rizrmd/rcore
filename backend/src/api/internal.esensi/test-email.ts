import { defineAPI } from "rlib/server";
import { emailSystem } from "../../lib/email-system";

export default defineAPI({
  name: "test-email",
  url: "/api/internal/test-email",
  async handler(arg: { 
    to: string; 
    subject?: string; 
    message?: string; 
    credentialName?: string; 
  }) {
    try {
      const result = await emailSystem.sendEmail({
        to: arg.to,
        subject: arg.subject || "Test Email dari Esensi Chapter",
        text: arg.message || "Ini adalah email test dari sistem Esensi Chapter.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #222831;">Test Email dari Esensi Chapter</h2>
            <p>${arg.message || "Ini adalah email test dari sistem Esensi Chapter."}</p>
            <p>Credential yang digunakan: <strong>${arg.credentialName || emailSystem.getDefaultCredential()}</strong></p>
            <p>Available credentials: ${emailSystem.getCredentials().join(", ")}</p>
            <hr />
            <p style="font-size: 12px; color: #666;">
              Esensi Chapter<br />
              PT. Meraih Ilmu Semesta
            </p>
          </div>
        `,
        credentialName: arg.credentialName
      });
      
      if (!result.success) {
        return {
          success: false,
          message: "Gagal mengirim email",
          error: result.error
        };
      }

      return {
        success: true,
        message: "Email berhasil dikirim",
        data: {
          messageId: result.messageId,
          to: arg.to,
          credentialUsed: arg.credentialName || emailSystem.getDefaultCredential(),
          availableCredentials: emailSystem.getCredentials(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("Failed to send test email:", error);
      return {
        success: false,
        message: "Gagal mengirim email",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});