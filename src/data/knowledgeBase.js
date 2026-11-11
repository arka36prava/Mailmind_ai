/**
 * Small, curated communication knowledge base.
 * Each document is embedded and retrieved at runtime; these are not output templates.
 */
export const knowledgeBase = [
  {
    id: 'tone-professional',
    title: 'Professional and formal communication',
    category: 'Tone guidance',
    content: 'For professional or formal emails, use a clear subject, a respectful greeting, concise paragraphs, neutral language, and a courteous closing. Avoid slang, excessive enthusiasm, and unsupported promises. State the request or next step clearly.'
  },
  {
    id: 'tone-friendly',
    title: 'Friendly and warm communication',
    category: 'Tone guidance',
    content: 'For friendly emails, sound approachable and human while remaining respectful. Use simple language, a warm greeting, positive phrasing, and a natural closing. Do not become overly casual in customer or workplace communication.'
  },
  {
    id: 'tone-apologetic',
    title: 'Apology and service recovery',
    category: 'Customer communication',
    content: 'When apologizing, acknowledge the inconvenience directly, express sincere regret, avoid blaming the customer or another team, and explain only confirmed next steps. Never invent compensation, deadlines, refunds, or guarantees.'
  },
  {
    id: 'tone-persuasive',
    title: 'Persuasive but ethical communication',
    category: 'Customer communication',
    content: 'Persuasive business emails should connect the offer or request to the recipient benefit, use specific information supplied by the sender, and end with a clear low-pressure call to action. Avoid false urgency, exaggerated claims, or fabricated evidence.'
  },
  {
    id: 'structure-followup',
    title: 'Follow-up email structure',
    category: 'Email structure',
    content: 'A useful follow-up email includes a descriptive subject, a brief greeting, a reminder of the earlier context, one clear question or request, appreciation for the recipient time, and a polite sign-off. Keep it brief and avoid sounding demanding.'
  },
  {
    id: 'structure-request',
    title: 'Request email structure',
    category: 'Email structure',
    content: 'A request email should explain the purpose early, provide only necessary context, make the requested action explicit, mention a deadline only when the user provides one, and thank the recipient. Use a subject that describes the requested action.'
  },
  {
    id: 'structure-announcement',
    title: 'Announcement and update email structure',
    category: 'Email structure',
    content: 'An update email should put the main announcement first, distinguish confirmed facts from pending information, explain the impact on the recipient, and identify any action required. Do not invent dates, policy changes, or operational details.'
  },
  {
    id: 'safety-truthfulness',
    title: 'Accuracy and trust guidelines',
    category: 'Quality guidelines',
    content: 'Generated business communication must not fabricate names, dates, prices, policies, attachments, completed actions, commitments, or legal claims. If key details are missing, use neutral wording rather than guessing. The user should review generated text before sending.'
  }
];
