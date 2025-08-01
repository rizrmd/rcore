import { defineAPI } from "rlib/server";
import { sendChapterEmail } from "../../lib/email-system";

export default defineAPI({
  name: "send-notification",
  url: "/api/chapter/send-notification",
  async handler(arg: { 
    to: string; 
    subject: string; 
    message: string; 
    type?: 'welcome' | 'chapter-update' | 'author-notification';
  }) {
    try {
      const result = await sendChapterEmail({
        to: arg.to,
        subject: arg.subject,
        text: arg.message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://esensichapter.com/logo.webp" alt="Esensi Chapter" style="height: 50px;">
            </div>
            <h2 style="color: #222831;">${arg.subject}</h2>
            <div style="margin: 20px 0; line-height: 1.6;">
              ${arg.message.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;">
            <div style="text-align: center; font-size: 12px; color: #666;">
              <p>
                <strong>Esensi Chapter</strong><br>
                Platform cerita dan buku digital Indonesia<br>
                PT. Meraih Ilmu Semesta
              </p>
              <p>
                Email ini dikirim dari notif@esensichapter.com
              </p>
            </div>
          </div>
        `
      });
      
      if (!result.success) {
        return {
          success: false,
          message: "Gagal mengirim notifikasi",
          error: result.error
        };
      }

      return {
        success: true,
        message: "Notifikasi berhasil dikirim",
        data: {
          messageId: result.messageId,
          to: arg.to,
          subject: arg.subject,
          type: arg.type || 'general',
          sentFrom: 'notif@esensichapter.com',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("Failed to send chapter notification:", error);
      return {
        success: false,
        message: "Gagal mengirim notifikasi",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
});