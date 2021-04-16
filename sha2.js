const msg = "abc";

const h0 = 0x6a09e667
const h1 = 0xbb67ae85
const h2 = 0x3c6ef372
const h3 = 0xa54ff53a
const h4 = 0x510e527f
const h5 = 0x9b05688c
const h6 = 0x1f83d9ab
const h7 = 0x5be0cd19

const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

function padMsg(text){
    const bitLenWithoutPad = text.length * 8 + 1 + 64;
    const bitLen = Math.ceil(bitLenWithoutPad/512) * 512;
    const byteLen = bitLen / 8;

    const res = new ArrayBuffer(byteLen);
    let view = new DataView(res);
    let csr = 0;
    const textArr = Array.from(text).map(s => s.charCodeAt(0));
    while (csr < text.length) {
        view.setUint8(csr, textArr[csr]);
        csr += 1;
    }
    view.setUint8(csr++, 2**7); // set the next bit to 1
    view.setUint32(byteLen - 1 - (32/8), text.length * 8); // should be 64bit but thats good enough

    return res;
}

function printBuffer(b) {
    let res = ""
    let csr = 0;
    let view = new DataView(b)
    while(csr < b.byteLength) {
        res += view.getUint8(csr).toString(16)
        res +=" "
        csr++;
    }
    console.log(res)
}

let buffer = padMsg(msg);
printBuffer(buffer)



/*

Process the message in successive 512-bit chunks:
break message into 512-bit chunks
for each chunk
create a 64-entry message schedule array w[0..63] of 32-bit words
(The initial values in w[0..63] don't matter, so many implementations zero them here)
copy chunk into first 16 words w[0..15] of the message schedule array

Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array:
for i from 16 to 63
s0 := (w[i-15] rightrotate  7) xor (w[i-15] rightrotate 18) xor (w[i-15] rightshift  3)
s1 := (w[i- 2] rightrotate 17) xor (w[i- 2] rightrotate 19) xor (w[i- 2] rightshift 10)
w[i] := w[i-16] + s0 + w[i-7] + s1

Initialize working variables to current hash value:
a := h0
b := h1
c := h2
d := h3
e := h4
f := h5
g := h6
h := h7

Compression function main loop:
for i from 0 to 63
S1 := (e rightrotate 6) xor (e rightrotate 11) xor (e rightrotate 25)
ch := (e and f) xor ((not e) and g)
temp1 := h + S1 + ch + k[i] + w[i]
S0 := (a rightrotate 2) xor (a rightrotate 13) xor (a rightrotate 22)
maj := (a and b) xor (a and c) xor (b and c)
temp2 := S0 + maj

h := g
g := f
f := e
e := d + temp1
d := c
c := b
b := a
a := temp1 + temp2

Add the compressed chunk to the current hash value:
h0 := h0 + a
h1 := h1 + b
h2 := h2 + c
h3 := h3 + d
h4 := h4 + e
h5 := h5 + f
h6 := h6 + g
h7 := h7 + h

Produce the final hash value (big-endian):
digest := hash := h0 append h1 append h2 append h3 append h4 append h5 append h6 append h7

 */
