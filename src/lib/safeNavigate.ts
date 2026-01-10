export const safeNavigate = (navigate: (url: string) => void, url: string) => {
  setTimeout(() => {
    navigate(url);
  }, 50);
};
