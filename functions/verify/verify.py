import urllib.request
import urllib.parse
import json
import time
from jose import jwk, jwt
from jose.utils import base64url_decode
import boto3

response = {
  "status": "302",
  "statusDescription": "Found",
  "headers": {
    "location": [{
      "key": "Location",
      "value": ""
    }]
  }
}

client = boto3.client(service_name="ssm", region_name="us-east-1")
parameter_name = "invite-user-pool-parameters"
try:
  r = client.get_parameter(Name=parameter_name)
  params_json = r["Parameter"]["Value"]
  params = json.loads(params_json)
  iss = params["iss"]
  client_id = params["cid"]
except client.exceptions.ParameterNotFound:
  response["status"] = "503"
  response["statusDescription"] = f'parameter "{parameter_name}" was not found in the Parameter Store'
except client.exceptions.InternalServerError:
  response["status"] = "503"
  response["statusDescription"] = f'get_parameter for "{parameter_name}" caused Internal Server Error'
except Exception as e:
  response["status"] = "503"
  response["statusDescription"] = str(e)

url = iss + "/.well-known/jwks.json"

with urllib.request.urlopen(url) as resp:
  key_set = json.loads(resp.read().decode("utf-8"))

keys = dict()
for k in key_set["keys"]:
  keys[k["kid"]] = jwk.construct(k)

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
    response["headers"]["location"][0]["value"] = encoded
    return response
      
  try:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid", "")
  except jwt.JWTError as e:
    error_string = str(e)
    error_string = error_string.replace(" ", "+")
    response["headers"]["location"][0]["value"] = encoded + f"&error={error_string}"
    return response

  parts = str(token).rsplit(".", 1)
  if len(parts) != 2:
    response["headers"]["location"][0]["value"] = encoded + "&error=Wrong+token+format"
    return response

  message, encoded_signature = parts

  public_key = keys.get(kid, None)
  if public_key is None:
    response["headers"]["location"][0]["value"] = encoded + "&error=Public+key+does+not+match"
    return response

  decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))
  verified = public_key.verify(message.encode("utf8"), decoded_signature)
  if not verified:
    response["headers"]["location"][0]["value"] = encoded + "&error=Signature+verification+failed"
    return response
    
  try:
    claims = jwt.get_unverified_claims(token)
  except jwt.JWTError as e:
    error_string = str(e)
    error_string = error_string.replace(" ", "+")
    response["headers"]["location"][0]["value"] = encoded + f"&error={error_string}"
    return response
    
  if claims.get("token_use", None) != "access":
    response["headers"]["location"][0]["value"] = encoded + "&error=Wrong+token+type"
    return response

  if claims.get("iss", None) != iss:
    response["headers"]["location"][0]["value"] = encoded + "&error=Wrong+ISS"
    return response

  if claims.get("client_id", None) != client_id:
    response["headers"]["location"][0]["value"] = encoded + "&error=Wrong+client"
    return response

  expiration = claims.get("exp", 0)
  if time.time() > expiration:
    response["headers"]["location"][0]["value"] = encoded + "&expired=true"
    return response

  return request
