const replaceLocation = (url: string) => {
  if (typeof window === 'undefined') return;
  window.location.replace(url);
};

const getCurrentOrigin = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

export const go = {
  local: {
    login: () => {
      replaceLocation(`${getCurrentOrigin()}/login`);
    },
    sso: () => {
      replaceLocation(`${getCurrentOrigin()}/login/sso`);
    },
  },
  salesAll: {
    login: () => replaceLocation(`${process.env.NEXT_PUBLIC_SALES_ALL_URL}/login`),
  },
};
