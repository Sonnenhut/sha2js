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
            const chunk = data.slice(chunkOff, chunkOff + this.chunkWords)
            let W = new Array(this.scheduleSize);

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
        return H;
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
            initialH: h,
            K: K,
            chunkSizeBits: 512,
            wordSizeBits: 32,
            scheduleSize: 64
        });
    }
    hash(msg) {
        return super.hash(msg)
            .map(n => (n >>> 0 /*typecast to uint*/).toString(16).padStart(8, '0')).join('');
    }

    s0(v) { return this.rotr(v, 7) ^ this.rotr(v, 18) ^ (v >>> 3); }
    s1(v) { return this.rotr(v, 17) ^ this.rotr(v, 19) ^ (v >>> 10); }

    S0(v) { return this.rotr(v, 2) ^ this.rotr(v,13) ^ this.rotr(v, 22); }
    S1(v) { return this.rotr(v, 6) ^ this.rotr(v, 11) ^ this.rotr(v, 25); }
    rotr(value, count) { return (value >>> count) | (value << (this.wordSizeBits - count)); }

    add(o1, o2, o3, o4, o5) {
        return [o1, o2, o3, o4, o5]
            .filter(n => n) // only truthy values
            .reduce((acc, next) => (acc + next) % 2**this.wordSizeBits, 0); // addition with modulo 2^32
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
            .map(id => view.getUint32(id * 4, false));
    }

/*
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

class Sha512 extends Sha2 {
    constructor() {
        const K = [
            '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc', '0x3956c25bf348b538',
            '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118', '0xd807aa98a3030242', '0x12835b0145706fbe',
            '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2', '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235',
            '0xc19bf174cf692694', '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
            '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5', '0x983e5152ee66dfab',
            '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4', '0xc6e00bf33da88fc2', '0xd5a79147930aa725',
            '0x06ca6351e003826f', '0x142929670a0e6e70', '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed',
            '0x53380d139d95b3df', '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
            '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30', '0xd192e819d6ef5218',
            '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8', '0x19a4c116b8d2d0c8', '0x1e376c085141ab53',
            '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8', '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373',
            '0x682e6ff3d6b2b8a3', '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
            '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b', '0xca273eceea26619c',
            '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178', '0x06f067aa72176fba', '0x0a637dc5a2c898a6',
            '0x113f9804bef90dae', '0x1b710b35131c471b', '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc',
            '0x431d67c49c100d4c', '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
        ].map(n => BigInt(n))

        const h = ['0x6a09e667f3bcc908', '0xbb67ae8584caa73b', '0x3c6ef372fe94f82b', '0xa54ff53a5f1d36f1', '0x510e527fade682d1',
            '0x9b05688c2b3e6c1f', '0x1f83d9abfb41bd6b', '0x5be0cd19137e2179'].map(n => BigInt(n));

        super({
            initialH: h,
            K: K,
            chunkSizeBits: 1024,
            wordSizeBits: 64,
            scheduleSize: 80
        });

        this.wordSizeBitsN = 64n;
    }
    hash(msg) {
        return super.hash(msg).map(n => n.toString(16).padStart(16, '0')).join('');
    }

    s0(v) { return this.rotr(v, 1n) ^ this.rotr(v, 8n) ^ (v >> 7n); }
    s1(v) { return this.rotr(v, 19n) ^ this.rotr(v, 61n) ^ (v >> 6n); }

    S0(v) { return this.rotr(v, 28n) ^ this.rotr(v,34n) ^ this.rotr(v, 39n); }
    S1(v) { return this.rotr(v, 14n) ^ this.rotr(v, 18n) ^ this.rotr(v, 41n); }
    rotr(value, count) { return (value >> count) | (value << (this.wordSizeBitsN - count)); }

    add(o1, o2, o3, o4, o5) {
        return [o1, o2, o3, o4, o5]
            .filter(n => n) // only truthy values
            .reduce((acc, next) => (acc + next) % 2n**64n, 0n); // addition with modulo 2^64
    }
    padMsg(text) {
        const bitLenWithoutPad = text.length * 8 + 1 + 128;
        const bitLen = Math.ceil(bitLenWithoutPad/this.chunkSizeBits) * this.chunkSizeBits;
        const byteLen = bitLen / 8;

        const res = new ArrayBuffer(byteLen);
        let view = new DataView(res);
        Array.from(text).map(s => s.charCodeAt(0))
            .forEach((elem, csr) => view.setUint8(csr, elem));
        view.setUint8(text.length, 0b10000000); // set the next bit to 1
        view.setBigUint64(byteLen - 8, 8n * BigInt(text.length)); // should be 128-bit but its 'good enough' for now

        return [... Array(byteLen / 8).keys()]
            .map(id => view.getBigUint64(id * 8, false))
            .map(n => BigInt(n));
    }
}


const sha256 = new Sha256();
const sha224 = new Sha224();
const sha512 = new Sha512();
export {
    sha256 as Sha256,
    sha224 as Sha224,
    sha512 as Sha512
}
