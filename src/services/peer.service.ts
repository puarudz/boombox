import Peer, {DataConnection} from "peerjs";
import {v4 as uuid} from 'uuid';

type OnConnectionListener = (conn: DataConnection) => any;
type OnDataListener = (data: any, conn: DataConnection) => any;
type OnCloseListener = (conn: DataConnection) => any;

class PeerService {
  client: Peer;
  id: string;
  onConnection: {
    listeners: OnConnectionListener[],
    addListener: (fn: OnConnectionListener) => any
  } = {
    listeners: [],
    addListener: (fn) => {
      this.onConnection.listeners.push(fn);
    }
  }

  onData: {
    listeners: OnDataListener[],
    addListener: (fn: OnDataListener) => any
  } = {
    listeners: [],
    addListener: (fn) => {
      this.onData.listeners.push(fn);
    }
  }

  onClose: {
    listeners: OnCloseListener[],
    addListener: (fn: OnCloseListener) => any
  } = {
    listeners: [],
    addListener: (fn) => {
      this.onClose.listeners.push(fn);
    }
  }

  initialize(id?: string) {
    if (!id) id = uuid();
    this.id = id;
    this.client = new Peer(id);

    this.client.on("connection", (conn) => {
      conn.on('open', () => {
        this.onConnection.listeners.forEach(fn => fn(conn));
      });
      // other client connected
      conn.on("data", (data) => {
        this.onData.listeners.forEach(fn => fn(data, conn));
      });
      conn.on("close", () => {
        this.onClose.listeners.forEach(fn => fn(conn));
      });
      conn.on("error", () => {
        this.onClose.listeners.forEach(fn => fn(conn));
      })
    });

    this.client.on("error", error => {
      console.log(error);
    });
  }

  connect(peerId: string) {
    const conn = this.client.connect(peerId);
    conn.on("open", () => {
      this.onConnection.listeners.forEach(fn => fn(conn));
    });
    conn.on("data", (data) => {
      this.onData.listeners.forEach(fn => fn(data, conn));
    });
    conn.on("error", () => {
      this.onClose.listeners.forEach(fn => fn(conn));
    });
    conn.on("close", () => {
      this.onClose.listeners.forEach(fn => fn(conn))
    });
    return conn;
  }

  getConnections() {
    return new Promise(resolve => {
      this.client.listAllPeers(resolve);
    });
  }

  disconnect() {
    if (!this.client) return;
    this.onConnection.listeners = [];
    this.onData.listeners = [];
    this.client.disconnect();
    this.client.destroy();
  }
}

export default new PeerService();