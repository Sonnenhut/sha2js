class Sha2 {

    constructor(cfg) {
        this.K = cfg.K;
        this.initial_H = cfg.initialH;
        this.chunkSizeBytes = cfg.chunkSizeBits / 8;
        this.wordSizeBits = cfg.wordSizeBits;
        this.wordSizeBytes = cfg.wordSizeBits / 8;
        this.scheduleSize = cfg.scheduleSize;
    }

    hash(msg) {
        const H = [... this.initial_H];

        const add = (o1, o2, o3, o4, o5) =>  [o1,o2,o3,o4,o5]
            .filter(n => n) // only truthy values
            .reduce((acc, next) => (acc + next) % 2**this.wordSizeBits, 0); // addition with modulo 2^32

        let buffer = this.padMsg(msg);
        let chunkOff = 0;

        let view = new DataView(buffer);
        let data = [... Array(buffer.byteLength / this.wordSizeBytes).keys()].map(id => view.getUint32(id * this.wordSizeBytes, false));

        console.log(data.map(n => (n >>> 0 /* cast to unsigned */).toString(16).padStart(8, '0')).join(' '))
        do {
            console.log("chunkoff", chunkOff, "datalen", data.length)
            let chunk = data.slice(chunkOff, chunkOff + 16)
            console.log("chunk", data.map(n => (n >>> 0 /* cast to unsigned */).toString(16).padStart(8, '0')).join(' '))
            //let chunk = data.slice(chunkOffByte, this.chunkSizeBytes)
            let schedule = new ArrayBuffer(this.scheduleSize * this.wordSizeBytes); // 64 * 4-byte (32bit) words
            let scheduleView = new DataView(schedule);

            let W = [...Array(this.scheduleSize).keys()];

            //console.log(scheduleArr.map(n => n.toString(16)))
            //this.printBuffer(scheduleView)
            //return "a"

            //

            // copy over the first 16 words
            [...Array(16).keys()]
                //.map(n => n * this.wordSizeBytes)
                //.forEach(byteIdx => W[byteIdx] =  chunk.getUint32(byteIdx * this.wordSizeBytes));
                .forEach(byteIdx => W[byteIdx] =  chunk[byteIdx]);

            // expand
            for (let i = 16; i < this.scheduleSize; i++) {
                W[i] = add(W[i-16], this.s0(W[i-15]), W[i-7], this.s1(W[i-2]));
            }
            //console.log(W.map(n => (n >>> 0 /* cast to unsigned */).toString(16).padStart(8, '0')).join(' '));

            // run the main hashing
            let a,b,c,d,e,f,g,h;
            [a,b,c,d,e,f,g,h] = H;
            for (let t = 0; t < this.scheduleSize; t++) {
                let ch = (e & f) ^ ((~e) & g);
                let temp1 = h + this.S1(e) + ch + this.K[t] + W[t];
                let maj = (a & b) ^ (a & c) ^ (b & c)
                let temp2 = this.S0(a) + maj;
                h = g;
                g = f;
                f = e;
                e = add(d, temp1);
                d = c;
                c = b;
                b = a;
                a = add(temp1, temp2);
            }

            H[0] = add(H[0], a) >>> 0;
            H[1] = add(H[1], b) >>> 0;
            H[2] = add(H[2], c) >>> 0;
            H[3] = add(H[3], d) >>> 0;
            H[4] = add(H[4], e) >>> 0;
            H[5] = add(H[5], f) >>> 0;
            H[6] = add(H[6], g) >>> 0;
            H[7] = add(H[7], h) >>> 0;

            chunkOff += 16
        } while(chunkOff < data.length);
        return H.map(n => (n >>> 0 /* cast to unsigned */).toString(16).padStart(8, '0')).join('');
    }

    s0(v) { return this.rotr(v, 7) ^ this.rotr(v, 18) ^ (v >>> 3); }
    s1(v) { return this.rotr(v, 17) ^ this.rotr(v, 19) ^ (v >>> 10); }

    S0(v) { return this.rotr(v, 2) ^ this.rotr(v,13) ^ this.rotr(v, 22); }
    S1(v) { return this.rotr(v, 6) ^ this.rotr(v, 11) ^ this.rotr(v, 25); }
    rotr(value, count) { return (value >>> count) | (value << (this.wordSizeBits - count)); }

    padMsg(text) {
        const bitLenWithoutPad = text.length * 8 + 1 + 64;
        const bitLen = Math.ceil(bitLenWithoutPad/512) * 512;
        const byteLen = bitLen / 8;

        const res = new ArrayBuffer(byteLen);
        let view = new DataView(res);
        Array.from(text).map(s => s.charCodeAt(0))
            .forEach((elem, csr) => view.setUint8(csr, elem));
        view.setUint8(text.length, 0b10000000); // set the next bit to 1
        view.setBigUint64(byteLen - 8, 8n * BigInt(text.length));

        return res;
    }

    // utility fn
    printBuffer(b, radix = 16) {
        let res = ""
        let csr = 0;
        let view = b instanceof DataView ? b : new DataView(b);
        while(csr < b.byteLength) {
            res += view.getUint32(csr).toString(radix).padStart(8, '0');
            res += " "
            csr += 4;
        }
        console.log(res)
    }
}

class Sha2X extends Sha2 {
    constructor(h) {
        const K = [
                    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
                ];
        super({
            initialH: h,
            K,
            chunkSizeBits: 512,
            wordSizeBits: 32,
            scheduleSize: 64
        }, K);
    }

    s0(v) { return this.rotr(v, 7) ^ this.rotr(v, 18) ^ (v >>> 3); }
    s1(v) { return this.rotr(v, 17) ^ this.rotr(v, 19) ^ (v >>> 10); }

    S0(v) { return this.rotr(v, 2) ^ this.rotr(v,13) ^ this.rotr(v, 22); }
    S1(v) { return this.rotr(v, 6) ^ this.rotr(v, 11) ^ this.rotr(v, 25); }
    rotr(value, count) { return (value >>> count) | (value << (this.wordSizeBits - count)); }

    padMsg(text) {
        const bitLenWithoutPad = text.length * 8 + 1 + 64;
        const bitLen = Math.ceil(bitLenWithoutPad/512) * 512;
        const byteLen = bitLen / 8;

        const res = new ArrayBuffer(byteLen);
        let view = new DataView(res);
        Array.from(text).map(s => s.charCodeAt(0))
            .forEach((elem, csr) => view.setUint8(csr, elem));
        view.setUint8(text.length, 0b10000000); // set the next bit to 1
        view.setBigUint64(byteLen - 8, 8n * BigInt(text.length));

        return res;
    }

/*
    // utility fn
    static printBuffer(b, radix = 16) {
        let res = ""
        let csr = 0;
        let view = b instanceof DataView ? b : new DataView(b);
        while(csr < b.byteLength) {
            res += view.getUint32(csr).toString(radix).padStart(8, '0');
            res += " "
            csr += 4;
        }
        console.log(res)
    }
*/
}

class Sha256 extends Sha2X {
    constructor() { super([ 0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ]); }
}

class Sha224 extends Sha2X {
    constructor() { super([ 0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ])}
    hash(msg) {
        const res = super.hash(msg);
        return res.substring(0, 56); // omits the last uint32
    }
}


const sha256 = new Sha256();
const sha224 = new Sha224();
export {
    sha256 as Sha256,
    sha224 as Sha224,
}
