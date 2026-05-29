import { PrismaErrorCodes, PrismaClientVersion } from './constants';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function isKnownError(error: unknown): boolean {
  return error instanceof PrismaClientKnownRequestError;
}

export function isRecordNotFound(error: unknown): boolean {
  if (!isKnownError(error)) {
    return false;
  }
  const prismaError = error as PrismaClientKnownRequestError;
  return prismaError.code === PrismaErrorCodes.RecordDoesNotExist;
}

export function isUniqueConstraintFailed(error: unknown): boolean {
  if (!isKnownError(error)) {
    return false;
  }
  const prismaError = error as PrismaClientKnownRequestError;
  return prismaError.code === PrismaErrorCodes.UniqueConstraintFailed;
}

export function newPrismaNotFoundError(): PrismaClientKnownRequestError {
  return new PrismaClientKnownRequestError('Record not found', {
    code: PrismaErrorCodes.RecordDoesNotExist,
    clientVersion: PrismaClientVersion.ClientVersionOfNotFound,
  });
}
