
Heavy usage of DataView instead of Uint32Array, cause sha-2 uses big-endian notation and Uint32Array uses
machine-related endianness


APPENDIX B: SHA-256 EXAMPLES really helps debugging
https://csrc.nist.gov/csrc/media/publications/fips/180/2/archive/2002-08-01/documents/fips180-2.pdf


Everything has its pros/cons. Now that the implementation can support 256 and 512 (by extending a base-class) there is some reused code,
but was it worth? The code is now scattered across the file.