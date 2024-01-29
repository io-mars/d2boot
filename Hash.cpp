#include <stdio.h>
#include "Hash.h"

char *HashString(const char *dataIn, ALG_ID algo)
{
  // set up the crypto environment
  HCRYPTPROV provider;
  HCRYPTHASH hash;
  DWORD lenOut = 0;

  // PROV_RSA_FULL NOT support ALG_SHA256, CALG_SHA384 or CALG_SHA512.
  // use the provider as PROV_RSA_AES (Microsoft Enhanced RSA and AES Cryptographic Provider)
  if (!CryptAcquireContext(&provider, NULL, NULL, PROV_RSA_AES, CRYPT_VERIFYCONTEXT))
    return NULL;
  if (!CryptCreateHash(provider, algo, 0, 0, &hash))
  {
    CryptReleaseContext(provider, 0);
    return NULL;
  }

  // now we have a working crypto environment, let's encrypt
  if (!CryptHashData(hash, (BYTE *)dataIn, strlen(dataIn), 0))
  {
    CryptDestroyHash(hash);
    CryptReleaseContext(provider, 0);
    return NULL;
  }
  if (!CryptGetHashParam(hash, HP_HASHVAL, NULL, &lenOut, 0))
  {
    CryptDestroyHash(hash);
    CryptReleaseContext(provider, 0);
    return NULL;
  }

  BYTE *result = new BYTE[lenOut];
  memset(result, 0, lenOut);
  if (!CryptGetHashParam(hash, HP_HASHVAL, result, &lenOut, 0))
  {
    delete[] result;
    CryptDestroyHash(hash);
    CryptReleaseContext(provider, 0);
    return NULL;
  }

  // tear down the crypto environment
  CryptDestroyHash(hash);
  CryptReleaseContext(provider, 0);

  // it's the caller's responsibility to clean up the result
  char *szBuffer1 = new char[lenOut * 2 + 1], szBuffer2[10] = "";
  memset(szBuffer1, 0, lenOut * 2 + 1);
  for (DWORD i = 0; i < lenOut; i++)
  {
    sprintf_s(szBuffer2, 10, "%.2x", result[i]);
    strcat_s(szBuffer1, lenOut * 2 + 1, szBuffer2);
  }
  delete[] result;
  return szBuffer1;
}

char *md5(const char *str)
{
  return HashString(str, CALG_MD5);
}

char *sha1(const char *str)
{
  return HashString(str, CALG_SHA1);
}

char *sha256(const char *str)
{
  return HashString(str, CALG_SHA_256);
}

char *sha384(const char *str)
{
  return HashString(str, CALG_SHA_384);
}

char *sha512(const char *str)
{
  return HashString(str, CALG_SHA_512);
}