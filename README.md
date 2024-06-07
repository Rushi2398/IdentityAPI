# IdentityAPI

Identity Reconciliation API for Phone Numbers and Emails using Node, Express, Typescript and Prisma ORM.

## Run Locally

Clone the project

```bash
  git clone https://github.com/Rushi2398/IdentityAPI.git
```

Go to the project directory

```bash
  cd IdentityAPI
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DATABASE_URL`

`PORT`

## API Reference

#### Post Email and Phone number 

```http
  POST /api/identity
```

| Parameter | Type     | Description |
| :-------- | :------- | :--------- |
| `email` | `string` | Correct Email Format |
| `phonNumber` | `string` | 10 digit number |


## Deployed Link

Opens the landing page.

[Identity API](https://identity-recon-api.vercel.app/)

## Running Tests

To test the endpoint, run the following link in postman:

[Identity API](https://identity-recon-api.vercel.app/api/identity)

Pass these parameters in Body
`email` 
`phoneNumber`


