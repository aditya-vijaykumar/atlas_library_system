## Atlas Library System - Web App

This is the nodejs web application code of the project following the standard file structure.

### Pointers to keep in mind

- After cloning the repository, create a '.env' file in the root of this directory and include all of the environment variables specified below.
- Edit the `/config/keys.js` and include your MongoDB password.
- Specify a 'salt' of your choice in `/routes/index.js` file at line number `15` . This will be used to deterministically generate the ethaddress.
- Modify all the javascript files in `/public/javascripts` and `/routes` with the contract addresses of the smart contracts.
- Pass your MaticVigil websocket read key in the file `/public/javascripts/websocket.js`.

Simply run npm install after doing all of the above and you should have it all working.

### Environment Variables.

This project uses Auth0 for managing user registrations, login and sessions. You will have to specify the following Auth0 credentials as environment variables.

- AUTH0_CLIENT_ID=
- AUTH0_DOMAIN =
- AUTH0_CLIENT_SECRET=
- AUTH0_CALLBACK_URL =

Specify your MaticVigil API Key for writing to the smart contract.

- MATICVIGIL_API_KEY =

Specify your SendGrid API Key for sending out emails.

- SENDGRID_API_KEY =

Specify your AWS S3 storage bucket or FileBase S3 storage bucket credentials used to temporarily store the draft books.

- IAM_USER_KEY =
- IAM_USER_SECRET =
- BUCKET_NAME =

Specify your RazorPay API Key and Secret for the payment gateway.

- RAZORPAY_KEY =
- RAZORPAY_SECRET =
