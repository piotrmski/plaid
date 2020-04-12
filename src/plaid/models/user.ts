export interface User {
  self?: string;
  key?: string;
  emailAddress?: string;
  avatarUrls?: {[key: string]: string};
  displayName?: string;
  active?: boolean;
  timeZone?: string;
}
