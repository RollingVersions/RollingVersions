declare module '*.svg' {
  const SvgIcon: (props: React.SVGProps<SVGElement>) => React.ReactElement;
  export default SvgIcon;
}

declare module '!url-loader!*.svg' {
  const url: string;
  export default url;
}
