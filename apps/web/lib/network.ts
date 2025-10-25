export const sendSuccessResponse = <T>(data: T) => {
  return {
    status: true,
    data: data
  }
}

export const sendErrorResponse = <T>(error: T) => {
  return {
    status: false,
    error: error
  }
}
