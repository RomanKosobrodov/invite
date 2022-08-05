import urllib.request
import urllib.parse
import json
import time
from jose import jwk, jwt
from jose.utils import base64url_decode

iss = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_D7WnK3MWM"
client_id = "7qusi4nt76n9bsrfr1oiubfjlg"

url = iss + "/.well-known/jwks.json"

with urllib.request.urlopen(url) as resp:
  key_set = json.loads(resp.read().decode("utf-8"))

keys = dict()
for k in key_set["keys"]:
  keys[k["kid"]] = jwk.construct(k)

redirect = {
  "status": "302",
  "statusDescription": "Found",
  "headers": {
    "location": [{
      "key": "Location",
      "value": ""
    }]
  }
}

login_uri = "/authentication/login.html"

def get_tokens(headers):
  token = None
  if "cookie" in headers:
    values = headers["cookie"][0]["value"]
    for v in values.split(";"):
      if len(v) > 3:
        p = v.split("=")
        if len(p) < 2:
          continue
        ck = p[0].strip()
        if ck == "token":
          token = p[1].strip()
          break    
  return token 

def handler(event, context):
  request = event["Records"][0]["cf"]["request"]
  headers = request["headers"]

  token = get_tokens(headers)

  host = headers["host"][0]["value"]
  encoded = f"https://{host}{login_uri}?f=https://{host}{request['uri']}"

  if token is None:
    redirect["headers"]["location"][0]["value"] = encoded
    return redirect
      
  try:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid", "")
  except jwt.JWTError as e:
    error_string = str(e)
    error_string = error_string.replace(" ", "+")
    redirect["headers"]["location"][0]["value"] = encoded + f"&error={error_string}"
    return redirect

  parts = str(token).rsplit(".", 1)
  if len(parts) != 2:
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Wrong+token+format"
    return redirect

  message, encoded_signature = parts

  public_key = keys.get(kid, None)
  if public_key is None:
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Public+key+does+not+match"
    return redirect

  decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))
  verified = public_key.verify(message.encode("utf8"), decoded_signature)
  if not verified:
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Signature+verification+failed"
    return redirect
    
  try:
    claims = jwt.get_unverified_claims(token)
  except jwt.JWTError as e:
    error_string = str(e)
    error_string = error_string.replace(" ", "+")
    redirect["headers"]["location"][0]["value"] = encoded + f"&error={error_string}"
    return redirect
    
  if claims.get("token_use", None) != "access":
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Wrong+token+type"
    return redirect

  if claims.get("iss", None) != iss:
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Wrong+ISS"
    return redirect

  if claims.get("client_id", None) != client_id:
    redirect["headers"]["location"][0]["value"] = encoded + "&error=Wrong+client"
    return redirect

  expiration = claims.get("exp", 0)
  if time.time() > expiration:
    redirect["headers"]["location"][0]["value"] = encoded + "&expired=true"
    return redirect

  return request
