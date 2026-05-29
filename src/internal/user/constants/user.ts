export const USER_MESSAGES = {
  CREATED: 'User created successfully',
  UPDATED: 'User updated successfully',
  DELETED: 'User deleted successfully',
  FETCHED: 'User fetched successfully',
  LIST_FETCHED: 'Users fetched successfully',
  NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'Email already registered',
  MOBILE_EXISTS: 'Mobile number already registered',
} as const;

export const USER_DEFAULTS = {
  BCRYPT_SALT_ROUNDS: 12,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
