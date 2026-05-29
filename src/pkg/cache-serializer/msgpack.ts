import { CacheSerializer } from './interface';
import { decode, encode } from '@msgpack/msgpack';

export class MsgpackSerializer implements CacheSerializer {
  isBinary = true;

  serialize<T>(data: T): Buffer {
    return Buffer.from(encode(data));
  }

  deserialize<T>(data: Buffer): T {
    return decode(data) as T;
  }
}
