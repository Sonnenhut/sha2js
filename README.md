### SHA-2 implementation in javascript (not to be used in production)

This is not intended to be used in production, just an implementation of the pseudocode from [wikipedia](https://en.wikipedia.org/wiki/SHA-2#Pseudocode).

Stuff I learned:

 - Everything has its pros/cons. Now that the implementation can support 256 and 512 (by extending a base-class) there is some reused code,
but was it worth the effort? At least its one code to be maintained. But SHA512 needs BigInt (for 64 bit) and SHA256 needs Number (for 32 bit)
   
 - BigInt implementation in SHA512 is significantly slower; Plus, you cannot combine Number and BigInt.

 - DataView and ArrayBuffer exist to do some byte-manipulation which is agnostic of the system endianness.

 - SHA2 is just about shifting bits around in a well-defined way.

 -  APPENDIX B: SHA-256 EXAMPLES really helps debugging
https://csrc.nist.gov/csrc/media/publications/fips/180/2/archive/2002-08-01/documents/fips180-2.pdf

 - `>>>` is a bit-right-shift that turns new left bits into zeroes, whereas `>>` will copy the leftmost bit (and thus negative numbers)

