CloudFront

(Default\*) --> public-s3-bucket

/resources/<path> ---> auth-front-end-s3-bucket/authorise.html?p=<path>
CF function (URI rewrite)

/protected/<path>?token=<jwt> ---> URL Lambda ---> protected-s3-bucket/<path>

CF function rewrites URI to redirect to /authorise/authorise.html and converts path to a query string. Cognito User Pool and Client ID are stored in Javascript accessed by authorise.html

/authorise.html

- checks if the jwt is saved in session storage.
  On success: redirects to protected/<path>?token=<jwt>
  On failure:
  Prompts for username and password (until successfully signed in)
  Authorises with Cognito
  saves token in session storage
  redirects to protected/<path>?token=<jwt>

URL Lambda verifies tokens
On success: redirects to protected-s3-bucket/<path>
On failure: returns 403 error code

How to build:

- Build SAM template with Cloudfront, CF function, URL Lambda and buckets for:

  1.  public content
  2.  authorisation front-end
  3.  protected content

- Call custom python script to:

  1. read CloudFormation stack name from `samconfig`
  2. read the outputs of the stack
  3. generate secrets (Cognito User Pool and Client ID) as JS file to be imported by the frontend JS
  4. save front-end bucket into a file

- Build frontend with `parcel`

- Call custom python script to upload frontend into the bucket using `aws s3 sync`
