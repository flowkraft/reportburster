import { Observable, Subscriber } from 'rxjs';

import { Stomp } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import Utilities from './utilities';
import UtilitiesElectron from './utilities-electron';

export class WebSocketEndpoint {
  BACKEND_URL = '';

  _options: SocketOptions;

  _socket: SocketEndpoint = new SocketEndpoint();

  observableStompConnection!: Observable<any>;
  subscribers: Array<any> = [];
  subscriberIndex: number = 0;

  _messageIds: Array<any> = [];

  reconnectionPromise: any;

  constructor() {}

  async makeWSConnection(options: SocketOptions) {
    this._options = options;
    this.createObservableSocket();
    return this.connect();
  }

  //TO BE OVERIDDEN
  getOptions = () => {
    return {};
  };

  private createObservableSocket = () => {
    this.observableStompConnection = new Observable((observer) => {
      const subscriberIndex = this.subscriberIndex++;
      this.addToSubscribers({ index: subscriberIndex, observer });
      return () => this.removeFromSubscribers(subscriberIndex);
    });
  };

  addToSubscribers = (subscriber: {
    index: number;
    observer: Subscriber<any>;
  }) => {
    this.subscribers.push(subscriber);
  };

  removeFromSubscribers = (index: number) => {
    if (index > this.subscribers.length)
      throw new Error(
        `Unexpected error removing subscriber from websocket, because index ${index} is greater than subscriber length ${this.subscribers.length}`,
      );
    this.subscribers.splice(index, 1);
  };

  getObservable = () => {
    return this.observableStompConnection;
  };

  getMessage = (data: { body: string; headers: { [x: string]: any } }) => {
    let out: any = {};
    out.type = 'SUCCESS';
    out.message = JSON.parse(data.body);
    out.headers = {};
    out.headers.messageId = data.headers['message-id'];

    let messageIdIndex = this._messageIds.indexOf(out.headers.messageId);
    if (messageIdIndex > -1) {
      out.self = true;
      this._messageIds = this._messageIds.splice(messageIdIndex, 1);
    }
    return out;
  };

  //_socketListener = (frame: string) => {
  _socketListener = () => {
    //console.log('WebSocket Connected: ' + frame);
    console.log('WebSocket Connected');

    this._socket.stomp.subscribe(this._options.topicName, (data: any) =>
      this.subscribers.forEach((subscriber) =>
        subscriber.observer.next(this.getMessage(data)),
      ),
    );
  };

  _onSocketError = (errorMsg: any) => {
    console.log(`WebSocket _onSocketError ${errorMsg}`);

    let out: any = {};
    out.type = 'ERROR';
    out.message = errorMsg;
    this.subscribers.forEach((subscriber) => subscriber.observer.error(out));
    this.scheduleReconnection();
  };

  scheduleReconnection = () => {
    this.reconnectionPromise = setTimeout(() => {
      console.log(
        'Socket reconnecting... (if it fails, next attempt in ' +
          this._options.reconnectionTimeout +
          ' msec)',
      );
      this.connect();
    }, this._options.reconnectionTimeout);
  };

  reconnectNow = function (this: WebSocketEndpoint) {
    this._socket.stomp.disconnect();
    if (this.reconnectionPromise && this.reconnectionPromise.cancel)
      this.reconnectionPromise.cancel();
    this.connect();
  };

  send = (message: any) => {
    var id = Math.floor(Math.random() * 1000000);
    this._socket.stomp.send(
      this._options.brokerName,
      {
        priority: 9,
      },
      JSON.stringify({
        message: message,
        id: id,
      }),
    );
    this._messageIds.push(id);
  };

  connect = async () => {
    const headers = {};

    if (!this.BACKEND_URL)
      this.BACKEND_URL = await UtilitiesElectron.getBackendUrl();
    let socketUrl = this.BACKEND_URL + this._options.socketUrl;
    if (this._options.getAccessToken())
      socketUrl += `?access_token=${this._options.getAccessToken()}`;

    this._socket.client = new SockJS(socketUrl);

    //console.log(`socketUrl = ${socketUrl}`);

    this._socket.client.discardWebsocketOnCommFailure = true;
    this._socket.client.connectionTimeout = 500;

    this._socket.stomp = Stomp.over(this._socket.client);

    //disable logging
    this._socket.stomp.debug = () => {};

    this._socket.stomp.onclose = this.scheduleReconnection;

    return new Promise<void>((resolve, reject) => {
      this._socket.stomp.connect(
        headers,
        async () => {
          await Utilities.sleep(100);
          this._socketListener();
          resolve();
        },
        (error) => {
          this._onSocketError(error);
          reject(error);
        },
      );
    });
  };
}

class SocketEndpoint {
  client: any;
  stomp: any;
}

export class SocketOptions {
  socketUrl: string;
  topicName: string;
  brokerName: string;
  reconnectionTimeout: number = 30000;

  getAccessToken: Function = () => null;

  constructor(
    socketUrl: string,
    topicName: string,
    getAccessToken?: Function,
    brokerName = '',
    reconnectionTimeout: number = 30000,
  ) {
    this.socketUrl = socketUrl;
    this.topicName = topicName;
    this.brokerName = brokerName;
    this.reconnectionTimeout = reconnectionTimeout;
    this.getAccessToken = getAccessToken || (() => null);
  }
}
