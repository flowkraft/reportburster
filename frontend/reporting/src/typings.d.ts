/* SystemJS module definition */
declare const nodeModule: NodeModule;

interface NodeModule {
  id: string;
}

interface Window {
  process: any;
  require: any;
  CustomElectronTitlebar: any;
}

declare module 'unique-filename';
declare module 'vanilla-rss';
declare module 'feedparser-promised';
declare module 'urling';
declare module 'chai-files';
declare module 'chai-wait-for';

//declare module 'tail';
//declare module 'squire-rte';
