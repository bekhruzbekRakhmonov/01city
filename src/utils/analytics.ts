// Analytics utility functions

// Generate a unique visitor ID (stored in localStorage)
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  let visitorId = localStorage.getItem('01city_visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('01city_visitor_id', visitorId);
  }
  return visitorId;
}

// Generate a unique session ID (stored in sessionStorage)
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side';
  
  let sessionId = sessionStorage.getItem('01city_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('01city_session_id', sessionId);
  }
  return sessionId;
}

// Get user agent string
export function getUserAgent(): string {
  if (typeof window === 'undefined') return 'server-side';
  return navigator.userAgent;
}

// Get referrer URL
export function getReferrer(): string {
  if (typeof window === 'undefined') return '';
  return document.referrer;
}

// Track website visit when user clicks on company website link
export function trackWebsiteVisit(websiteUrl: string) {
  // This will be called when user clicks on website links
  // The actual tracking will be handled by the component that calls this
  return {
    websiteUrl,
    timestamp: Date.now(),
    userAgent: getUserAgent(),
    referrer: getReferrer()
  };
}