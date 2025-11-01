export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const EmailNotificationSettingsSchema = new Schema({
    // SMTP Configuration
    smtpHost: { type: String, required: true },
    smtpPort: { type: Number, required: true, default: 587 },
    smtpSecure: { type: Boolean, required: true, default: false },
    smtpUser: { type: String, required: true },
    smtpPass: { type: String, required: true },

    // Sender Configuration
    fromName: { type: String, required: true, default: 'Doggy Nav' },
    fromAddress: { type: String, required: true },
    replyTo: { type: String, required: true },

    // Notification Settings
    enableNotifications: { type: Boolean, required: true, default: true },
    adminEmails: [{ type: String }], // Admin emails for submission notifications

    // Created and updated timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  return mongoose.model('EmailNotificationSettings', EmailNotificationSettingsSchema);
}