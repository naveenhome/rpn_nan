import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;
  // Resolve all statuses so 4xx error-envelope assertions don't throw.
  axios.defaults.validateStatus = () => true;
};
