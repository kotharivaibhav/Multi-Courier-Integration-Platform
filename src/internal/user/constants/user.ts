export const USER_MESSAGES = {
  CREATED: 'User created successfully',
  UPDATED: 'User updated successfully',
  DELETED: 'User deleted successfully',
  FETCHED: 'User fetched successfully',
  LIST_FETCHED: 'Users fetched successfully',
  LOGIN_SUCCESS: 'Login successful',
} as const;

export const USER_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
