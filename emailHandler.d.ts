export function processEmailQueue(subject: string, message: string, uniqueEmails: string[]): Promise<{
  sentCount: number;
  failedCount: number;
  failedRecipients: string[];
}>;
