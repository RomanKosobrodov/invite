aws s3 cp content/public/index.html s3://invite-kosobrodov-net-public --profile sam
aws s3 cp content/restricted s3://invite-kosobrodov-net-restricted/restricted --profile sam --recursive
aws s3 cp dist s3://invite-kosobrodov-net-frontend/authentication --profile sam --recursive
