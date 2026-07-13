// Content moderation utility for chat safety

// Patterns to detect prohibited content
const PHONE_PATTERNS = [
  /\b\d{10,}\b/g, // 10+ digit numbers
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US format
  /\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, // International
  /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b/g, // India format
  /\b\d{5}[-.\s]?\d{5}\b/g, // 5-5 digit format
];

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

const SOCIAL_MEDIA_KEYWORDS = [
  'whatsapp', 'telegram', 'instagram', 'facebook', 'snapchat', 'tiktok',
  'twitter', 'discord', 'linkedin', 'youtube', 'twitch', 'signal',
  'wechat', 'line', 'viber', 'skype', 'zoom', 'teams', 'slack',
  'insta', 'fb', 'snap', 'tg', 'wa', 'ig'
];

const PROHIBITED_KEYWORDS = [
  'call me', 'text me', 'dm me', 'message me', 'ping me',
  'add me on', 'follow me on', 'find me on', 'contact me at',
  'my number is', 'my id is', 'my handle is', 'reach me at',
  'qr code', 'scan this', 'payment link', 'gpay', 'paytm', 'phonepe',
  'off platform', 'outside the app', 'private chat'
];

const LINK_PATTERN = /\b(https?:\/\/|www\.)[^\s]+\b/gi;
const HANDLE_PATTERN = /@[A-Za-z0-9_]+/g;

export type ViolationType = 
  | 'phone_number'
  | 'email_address'
  | 'social_media'
  | 'external_link'
  | 'prohibited_keyword';

export interface ModerationResult {
  isBlocked: boolean;
  violations: ViolationType[];
  blockedContent?: string;
  message?: string;
}

export function moderateContent(text: string): ModerationResult {
  const lowerText = text.toLowerCase();
  const violations: ViolationType[] = [];
  let blockedContent = '';

  // Check for phone numbers
  for (const pattern of PHONE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push('phone_number');
      blockedContent = match[0];
      break;
    }
  }

  // Check for email addresses
  const emailMatch = text.match(EMAIL_PATTERN);
  if (emailMatch) {
    violations.push('email_address');
    blockedContent = blockedContent || emailMatch[0];
  }

  // Check for social media mentions
  for (const keyword of SOCIAL_MEDIA_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      violations.push('social_media');
      blockedContent = blockedContent || keyword;
      break;
    }
  }

  // Check for external links
  const linkMatch = text.match(LINK_PATTERN);
  if (linkMatch) {
    violations.push('external_link');
    blockedContent = blockedContent || linkMatch[0];
  }

  // Check for handles
  const handleMatch = text.match(HANDLE_PATTERN);
  if (handleMatch) {
    violations.push('social_media');
    blockedContent = blockedContent || handleMatch[0];
  }

  // Check for prohibited keywords
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      violations.push('prohibited_keyword');
      blockedContent = blockedContent || keyword;
      break;
    }
  }

  const isBlocked = violations.length > 0;
  
  let message = '';
  if (isBlocked) {
    const violationMessages: Record<ViolationType, string> = {
      'phone_number': 'Phone numbers are not allowed in chat',
      'email_address': 'Email addresses are not allowed in chat',
      'social_media': 'Social media references are not allowed',
      'external_link': 'External links are not allowed in chat',
      'prohibited_keyword': 'This type of content is not allowed'
    };
    message = violationMessages[violations[0]] || 'This message contains prohibited content';
  }

  return {
    isBlocked,
    violations: [...new Set(violations)], // Remove duplicates
    blockedContent: isBlocked ? blockedContent : undefined,
    message
  };
}

// Function to get user-friendly penalty description
export function getPenaltyDescription(penaltyType: string, endsAt?: string): string {
  const endTime = endsAt ? new Date(endsAt) : null;
  const timeRemaining = endTime ? Math.ceil((endTime.getTime() - Date.now()) / 60000) : 0;

  switch (penaltyType) {
    case 'warning':
      return 'You have received a warning for sharing prohibited content. Please avoid sharing personal contact information.';
    case 'cooldown':
      return `You are in a cooldown period. You can send messages again in ${timeRemaining} minutes.`;
    case 'temporary_restriction':
      return `Your messaging is temporarily restricted for ${Math.ceil(timeRemaining / 60)} hours due to repeated violations.`;
    case 'account_review':
      return 'Your account is under review due to multiple policy violations. Messaging is disabled until review is complete.';
    case 'permanent_ban':
      return 'Your account has been permanently banned due to severe policy violations.';
    default:
      return 'You have a messaging restriction. Please contact support for more information.';
  }
}

// Safety tips to show users
export const SAFETY_TIPS = [
  {
    title: 'Keep conversations on-platform',
    description: 'All your communications and agreements are protected when you stay on Collabio.'
  },
  {
    title: 'Never share personal contact info',
    description: 'Phone numbers, emails, and social handles should not be shared in chat.'
  },
  {
    title: 'Use in-app payments only',
    description: 'Payments made through our platform are protected. Off-platform payments have no guarantee.'
  },
  {
    title: 'Report suspicious behavior',
    description: 'If someone asks you to go off-platform or seems suspicious, report them immediately.'
  },
  {
    title: 'Document everything in chat',
    description: 'Keep all agreements, scope changes, and discussions in the chat for your protection.'
  }
];
