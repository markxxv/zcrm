import type { ComponentProps } from 'react';

export default function AppLogoIcon(props: ComponentProps<'img'>) {
  return (
    <img
      src="/img/icon.svg"
      alt="App Logo"
      className="size-5"
      {...props} // still allows you to pass width/height/className/etc if needed
    />
  );
}