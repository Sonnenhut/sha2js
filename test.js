import {Sha256 as Sha256} from "./sha2.mjs";

function test(impl, input, expected) {
    const res = impl.hash(input);
    if (res === expected) {
        console.log(expected, "ok");
    } else {
        console.log(expected, "NOT OK: ", res);
        throw new Error("Whelp, that test did not go well.")
    }
}

test(Sha256, [...Array(1000000).keys()].map(n => 'a').join(''), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
test(Sha256, "abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
