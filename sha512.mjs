class Sha {

    constructor(cfg) {
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

        const h = [ '0x6a09e667f3bcc908', '0xbb67ae8584caa73b', '0x3c6ef372fe94f82b', '0xa54ff53a5f1d36f1', '0x510e527fade682d1',
            '0x9b05688c2b3e6c1f', '0x1f83d9abfb41bd6b', '0x5be0cd19137e2179' ].map(n => BigInt(n));
        cfg = {
            initialH: h,
            K,
            chunkSizeBits: 1024,
            wordSizeBits: 64,
            scheduleSize: 80
        };
        this.K = cfg.K;
        this.initial_H = cfg.initialH;
        this.chunkSizeBits = BigInt(cfg.chunkSizeBits);
        this.chunkSizeBytes = cfg.chunkSizeBits / 8;
        this.wordSizeBits = BigInt(cfg.wordSizeBits);
        this.wordSizeBytes = cfg.wordSizeBits / 8;
        this.scheduleSize = cfg.scheduleSize;
        this.cntMod = BigInt(2n**this.wordSizeBits);
    }

    hash(msg) {
        const H = [... this.initial_H];

        const add = (o1, o2, o3, o4, o5) =>  [o1,o2,o3,o4,o5]
            .filter(n => n) // only truthy values
            .map(n => BigInt(n))
            .reduce((acc, next) => (acc + next) % this.cntMod, 0n); // addition with modulo 2^32

        let buffer = this.padMsg(msg);

        let chunkOff = 0;
        do {
            let chunk = new DataView(buffer, chunkOff, this.chunkSizeBytes);
            let schedule = new ArrayBuffer(this.scheduleSize * this.wordSizeBytes);
            let scheduleView = new DataView(schedule);

            const getw = (wordIdx) => scheduleView.getBigUint64(wordIdx * this.wordSizeBytes);
            const setw = (wordIdx, v) => scheduleView.setBigUint64(wordIdx * this.wordSizeBytes, v);

            // copy over the first 16 words
            [...Array(16).keys()]
                .map(n => n * this.wordSizeBytes)
                .forEach(byteIdx => scheduleView.setBigUint64(byteIdx, chunk.getBigUint64(byteIdx)));

            // expand
            for (let i = 16; i < this.scheduleSize; i++) {
                const r = add(getw(i-16), this.s0(getw(i-15)), getw(i-7), this.s1(getw(i-2)));
                setw(i, r)
            }

            // run the main hashing
            let a,b,c,d,e,f,g,h;
            [a,b,c,d,e,f,g,h] = H;
            for (let t = 0; t < this.scheduleSize; t++) {
                let ch = (e & f) ^ ((~e) & g);
                let temp1 = h + this.S1(e) + ch + this.K[t] + getw(t);
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

            H[0] = add(H[0], a);
            H[1] = add(H[1], b);
            H[2] = add(H[2], c);
            H[3] = add(H[3], d);
            H[4] = add(H[4], e);
            H[5] = add(H[5], f);
            H[6] = add(H[6], g);
            H[7] = add(H[7], h);

            chunkOff = chunkOff + this.chunkSizeBytes;
        } while(chunkOff < buffer.byteLength);
        return H.map(n => n.toString(16).padStart(16, '0')).join('');
    }

    s0(v) { return this.rotr(v, 1n) ^ this.rotr(v, 8n) ^ (v >> 7n); }
    s1(v) { return this.rotr(v, 19n) ^ this.rotr(v, 61n) ^ (v >> 6n); }

    S0(v) { return this.rotr(v, 28n) ^ this.rotr(v,34n) ^ this.rotr(v, 39n); }
    S1(v) { return this.rotr(v, 14n) ^ this.rotr(v, 18n) ^ this.rotr(v, 41n); }
    rotr(value, count) { return (value >> count) | (value << (this.wordSizeBits - count)); }

    padMsg(text) {
        const bitLenWithoutPad = text.length * 8 + 1 + 128;
        const bitLen = Math.ceil(bitLenWithoutPad/Number(this.chunkSizeBits)) * Number(this.chunkSizeBits);
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
            res += view.getBigUint64(csr).toString(radix).padStart(16, '0');
            res += " "
            csr += 8;
        }
        console.log(res)
    }
}

const Sha512 = new Sha();
export { Sha512,
}
