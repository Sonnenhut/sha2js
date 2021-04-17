import {Sha256, Sha224} from "./sha2.mjs";

function test(impl, input, expected) {
    const res = impl.hash(input);
    if (res === expected) {
        console.log(expected, "ok");
    } else {
        console.log(expected, "NOT OK: ", res);
        throw new Error("Whelp, that test did not go well.")
    }
}

console.log("Sha256:")
test(Sha256, [...Array(1000000).keys()].map(n => 'a').join(''), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
test(Sha256, "abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

console.log("Sha224:")
test(Sha224, "", "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f");
