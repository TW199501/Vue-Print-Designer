
export const isMac = (): boolean => {
  if (typeof window !== 'undefined' && window.navigator) {
    // Check for Mac in platform or user agent
    // @ts-ignore - navigator.userAgentData is experimental
    const platform = window.navigator.platform || window.navigator.userAgentData?.platform || 'unknown';
    return /Mac|iPod|iPhone|iPad/.test(platform) || /Mac/.test(window.navigator.userAgent);
  }
  return false;
};

export const getModifierKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

export const getAltKey = (): string => {
  return isMac() ? '⌥' : 'Alt';
};

export const getShiftKey = (): string => {
  return isMac() ? '⇧' : 'Shift';
};

export const formatShortcut = (keys: string[]): string => {
  const isMacOs = isMac();
  return keys.map(key => {
    switch (key.toLowerCase()) {
      case 'ctrl':
      case 'control':
        return isMacOs ? '⌘' : 'Ctrl';
      case 'alt':
        return isMacOs ? '⌥' : 'Alt';
      case 'shift':
        return isMacOs ? '⇧' : 'Shift';
      case 'enter':
        return isMacOs ? '⏎' : 'Enter';
      case 'backspace':
        return isMacOs ? '⌫' : 'Backspace';
      case 'delete':
        return isMacOs ? '⌦' : 'Del';
      case 'esc':
      case 'escape':
        return isMacOs ? '⎋' : 'Esc';
      default:
        return key.toUpperCase();
    }
  }).join(isMacOs ? '' : ' + ');
};
