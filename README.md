# Subscription Management API

The Subscription Management API is a starter web api built with Node.js, Express, and MongoDB. It provides a basic foundation for managing organization subscriptions, allowing users to create, renew, and track subscriptions within their organizations. Not meant to be production ready, just to give you a head start. Includes Jest testing for existing controllers. You can start adding additional controllers, models, and tests to suite your needs.

**You will need to build your own front-end (web app, mobile app, etc).**

## Features

- User authentication: Secure user registration and login functionality.
- Subscription creation: Users can create new subscriptions with different tiers and terms.
- Subscription renewal: Renewal of existing subscriptions to extend their validity.
- Organization management: Users can be associated with specific organizations and manage subscriptions within those organizations.
- Admin and owner roles: Differentiate user access levels for managing subscriptions within organizations.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ronthedrummer/subscription-manager-foundation
```

2. Install dependencies:

```bash
cd subscription-management-system
npm install
```

3. Configure the environment:

- Duplicate the example.config.dev.json file and rename it to config.dev.json.
- Update the config.dev.json file with the necessary values for your application to work properly. The required fields are:
  - `app.name`: The name of your application.
  - `jwt_secret`: The secret key used for JWT token generation and verification.
  - `database.mongo_uri`: The URI for your MongoDB database.
  - `email.from_address`: The email address used as the sender for system emails.
  - `mailgun.domain`: The domain for the Mailgun service (required for sending emails).
  - `mailgun.api_key`: The API key for the Mailgun service (required for sending emails).
  - `organizations.enabled`: Set to true if you want to enable organization management, or false to disable it.

4. Start the server:

```bash
npm start
```

## Usage

- Access the api at http://localhost:3200 (or the configured port).
- Use Postman to test endpoints or build a basic front-end in your language of choice

### Running Tests

To run the test suite, just run:

```bash
npm test
```

You should add a seperate config file for testing named `config.test.json` so you can use a different database, JWT secret, email addresses, port, etc.

## Coming Soon

- Postman collection you can access to test all the endpoints
- config file for test data to make it easier to manage

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

MIT License
