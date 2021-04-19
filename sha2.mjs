class Sha2 {

    constructor(cfg) {
        this.K = cfg.K;
        this.initial_H = cfg.initialH;
        this.chunkSizeBits = cfg.chunkSizeBits;
        this.chunkWords = cfg.chunkSizeBits / cfg.wordSizeBits;
        this.wordSizeBits = cfg.wordSizeBits;
        this.scheduleSize = cfg.scheduleSize;
    }

    hash(msg) {
        const H = [... this.initial_H];

        const data = this.padMsg(msg);
        let chunkOff = 0;
        do {
            let chunk = data.slice(chunkOff, chunkOff + this.chunkWords)
            let W = [...Array(this.scheduleSize).keys()];

            // copy over the first 16 words
            [...Array(16).keys()].forEach(byteIdx => W[byteIdx] = chunk[byteIdx]);

            // expand
            for (let i = 16; i < this.scheduleSize; i++) {
                W[i] = this.add(W[i-16], this.s0(W[i-15]), W[i-7], this.s1(W[i-2]));
            }

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
                e = this.add(d, temp1);
                d = c;
                c = b;
                b = a;
                a = this.add(temp1, temp2);
            }

            H[0] = this.add(H[0], a);
            H[1] = this.add(H[1], b);
            H[2] = this.add(H[2], c);
            H[3] = this.add(H[3], d);
            H[4] = this.add(H[4], e);
            H[5] = this.add(H[5], f);
            H[6] = this.add(H[6], g);
            H[7] = this.add(H[7], h);

            chunkOff += this.chunkWords;
        } while(chunkOff < data.length);
        return H.map(n => n.toString(16).padStart(8, '0')).join('');
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

    // -- methods must be supplied by implementations
    s0(v) { }
    s1(v) { }
    S0(v) { }
    S1(v) { }
    rotr(value, count) { }
    padMsg(text) { }
    add(o1,o2,o3,o4,o5) { }
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
            initialH: h.map(n => BigInt(n)),
            K: K.map(n => BigInt(n)),
            chunkSizeBits: 512,
            wordSizeBits: 32,
            scheduleSize: 64
        });
    }

    s0(v) { return this.rotr(v, 7n) ^ this.rotr(v, 18n) ^ (v >> 3n); }
    s1(v) { return this.rotr(v, 17n) ^ this.rotr(v, 19n) ^ (v >> 10n); }

    S0(v) { return this.rotr(v, 2n) ^ this.rotr(v,13n) ^ this.rotr(v, 22n); }
    S1(v) { return this.rotr(v, 6n) ^ this.rotr(v, 11n) ^ this.rotr(v, 25n); }
    rotr(value, count) { return (value >> count) | (value << (BigInt(this.wordSizeBits) - count)); }

    add(o1, o2, o3, o4, o5) {
        return [o1, o2, o3, o4, o5]
            .filter(n => n) // only truthy values
            .reduce((acc, next) => (acc + next) % 2n**32n, 0n); // addition with modulo 2^32
    }
    padMsg(text) {
        const bitLenWithoutPad = text.length * 8 + 1 + 64;
        const bitLen = Math.ceil(bitLenWithoutPad/512) * 512;
        const byteLen = bitLen / 8;

        let view = new DataView(new ArrayBuffer(byteLen));
        Array.from(text).map(s => s.charCodeAt(0))
            .forEach((elem, csr) => view.setUint8(csr, elem));
        view.setUint8(text.length, 0b10000000); // set the next bit to 1
        view.setBigUint64(byteLen - 8, 8n * BigInt(text.length));

        return [... Array(byteLen / 4).keys()]
            .map(id => view.getUint32(id * 4, false))
            .map(n => BigInt(n));
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
