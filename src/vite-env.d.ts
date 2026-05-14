/// <reference types="vite/client" />

declare module 'react-helmet-async' {
  import * as React from 'react';

  interface HelmetProps {
    defaultTitle?: string;
    titleTemplate?: string;
    children?: React.ReactNode;
  }

  interface ProviderProps {
    children?: React.ReactNode;
  }

  export class Helmet extends React.Component<HelmetProps> {}
  export class HelmetProvider extends React.Component<ProviderProps> {}
}
