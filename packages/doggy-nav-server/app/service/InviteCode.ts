import { Service } from 'egg';
import { randomBytes } from 'crypto';

export default class InviteCodeService extends Service {

  generateCode(length?: number) {
    const size = Math.max(length || this.app.config?.invite?.codeLength || 12, 6);
    return randomBytes(Math.ceil(size / 2)).toString('hex').slice(0, size).toUpperCase();
  }

  async claim(code: string, email: string) {
    const now = new Date();
    const claimed = await this.ctx.model.InviteCode.findOneAndUpdate(
      {
        code,
        active: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
        $expr: { $lt: [ '$usedCount', '$usageLimit' ] },
      },
      {
        $inc: { usedCount: 1 },
        $set: { lastUsedAt: now },
      },
      {
        new: true,
      },
    );

    if (!claimed) {
      return null;
    }

    if (claimed.allowedEmailDomain) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain || domain !== claimed.allowedEmailDomain) {
        await this.ctx.model.InviteCode.updateOne(
          { _id: claimed._id },
          {
            $inc: { usedCount: -1 },
            $set: { lastUsedAt: claimed.lastUsedAt },
          },
        );
        return 'domain';
      }
    }

    return claimed;
  }
}
