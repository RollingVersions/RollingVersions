import {Transform} from 'stream';

export default class BatchStream extends Transform {
  constructor({maxBatchSize}: {maxBatchSize: number}) {
    let batch: any[] = [];
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(chunk, _encoding, cb) {
        batch.push(chunk);
        if (batch.length === maxBatchSize) {
          this.push(batch);
          batch = [];
        }
        cb();
      },
      flush(cb) {
        this.push(batch);
        batch = [];
        cb();
      },
    });
  }
}
