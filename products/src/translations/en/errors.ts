export default {
  shared: {
    cantBeBlank: "Can't be empty",
    mustBeEmail: 'Must be a valid email',
  },
  loginRequired: {
    title: 'Re-login required for tenant switching.',
    message:
      'Unfortunately to switch your tenant context you need to login again. Please log out and try again!',
  },
  errorCode: {
    'PRICE-MODEL-DELETION-1':
      'Price model force delete is unauthorized. Please provide an access token with required admin scope.',
    'PRICE-MODEL-DELETION-2':
      'Could not delete the price model when there are related prices.',
  },
}
