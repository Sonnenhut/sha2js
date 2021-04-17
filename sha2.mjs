class Sha2 {
    initial_H = [];
    K = [];
    constructor(h, k) {
        this.K = k;
        this.initial_H = h;
    }

    hash(msg) {
        const H = [... this.initial_H];
        const K = this.K
        const rotr = (value, count) => (value >>> count) | (value << (32-count));
        const add = (o1, o2, o3, o4, o5) =>  [o1,o2,o3,o4,o5]
            .filter(n => n) // only truthy values
            .reduce((acc, next) => (acc + next) % 2**32, 0); // addition with modulo 2^32

        let buffer = Sha2.padMsg(msg);
        let chunkOff = 0;
        do {
            let chunk = new DataView(buffer, chunkOff, 64 /* bytes (512 bits)*/);
            let schedule = new ArrayBuffer(256); // 64 * 4-byte (32bit) words
            let scheduleView = new DataView(schedule);
            // copy over the first 16 words
            [...Array(16).keys()].forEach(i => scheduleView.setUint32(i*4, chunk.getUint32(i*4)));

            const getw = (idx) => scheduleView.getUint32(idx * 4);
            // expand
            for (let i = 16; i <= 63; i++) {
                const s0 = rotr(getw(i-15), 7) ^ rotr(getw(i-15), 18) ^ (getw(i-15) >>> 3);
                const s1 = rotr(getw(i- 2), 17) ^ rotr(getw(i- 2), 19) ^ (getw(i- 2) >>> 10)
                const r = add(getw(i-16), s0, getw(i-7), s1);
                scheduleView.setUint32(i * 4, r);
            }

            // run the main hashing
            let a,b,c,d,e,f,g,h;
            [a,b,c,d,e,f,g,h] = H;
            for (let t = 0; t<= 63; t++) {
                let s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
                let ch = (e & f) ^ ((~e) & g);
                let temp1 = h + s1 + ch + K[t] + getw(t);
                let s0 = rotr(a, 2) ^ rotr(a,13) ^ rotr(a, 22);
                let maj = (a & b) ^ (a & c) ^ (b & c)
                let temp2 = s0 + maj;
                h = g;
                g = f;
                f = e;
                e = add(d, temp1);
                d = c;
                c = b;
                b = a;
                a = add(temp1, temp2);
            }

            H[0] = add(H[0], a);
            H[1] = add(H[1], b);
            H[2] = add(H[2], c);
            H[3] = add(H[3], d);
            H[4] = add(H[4], e);
            H[5] = add(H[5], f);
            H[6] = add(H[6], g);
            H[7] = add(H[7], h);

            chunkOff += 64;
        } while(chunkOff < buffer.byteLength);
        return H.map(n => n.toString(16).padStart(8, '0')).join('');
    }

    static padMsg(text){
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
    static printBuffer(b /* DataView | ArrayBuffer */, radix = 16) {
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
const sha2xSeed = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

class Sha256 extends Sha2 {
    constructor() {
        const H = [ 0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ]
        super([... H], sha2xSeed);
    }
}

class Sha224 extends Sha2 {
    constructor() {
        const H = [ 0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ]
        super([... H], sha2xSeed);
    }
    hash(msg) {
        const res = super.hash(msg);
        return res.substring(0, 56); // omits the last uint32
    }
}


const sha256 = new Sha256();
const sha224 = new Sha224();
export { sha256 as Sha256,
    sha224 as Sha224,
}
