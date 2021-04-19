import {Sha256, Sha224, Sha512} from "./sha2.mjs";

function test(impl, input, expected) {
    const start = new Date().getTime();
    const res = impl.hash(input);
    const took = new Date().getTime() - start;

    if (res === expected) {
        console.log(expected, "ok", `(took ${took}ms)`);
    } else {
        console.log(expected, "NOT OK: ", res);
        throw new Error("Whelp, that test did not go well.")
    }
}

console.log("Sha256:")
test(Sha256, [...Array(1_000_000).keys()].map(n => 'a').join(''), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
test(Sha256, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1")
test(Sha256, "abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

console.log("Sha224:")
test(Sha224, "", "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f");
test(Sha224, "The quick brown fox jumps over the lazy dog", "730e109bd7a8a32b1cb9d9a09aa2325d2430587ddbc0c38bad911525");
test(Sha224, "The quick brown fox jumps over the lazy dog.", "619cba8e8e05826e9b8c519c0a5c68f4fb653e8a3d8aa04bb2c8cd4c");

console.log("Sha512:")
test(Sha512, "abc", "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f");
test(Sha512, "this is a test",  "7d0a8468ed220400c0b8e6f335baa7e070ce880a37e2ac5995b9a97b809026de626da636ac7365249bb974c719edf543b52ed286646f437dc7f810cc2068375c");
test(Sha512, "The quick brown fox jumps over the lazy dog", "07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb642e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6");
test(Sha512, [...Array(10_000).keys()].map(n => 'a').join(''), "0593036f4f479d2eb8078ca26b1d59321a86bdfcb04cb40043694f1eb0301b8acd20b936db3c916ebcc1b609400ffcf3fa8d569d7e39293855668645094baf0e");
