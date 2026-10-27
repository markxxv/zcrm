import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
  return (
    <img
      src="/img/icon.svg"
      alt="App Logo"
      className="size-5"
      {...props} // still allows you to pass width/height/className/etc if needed
    />
  );
}