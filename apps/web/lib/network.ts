export const sendSuccessResponse = <T>(data: T) => {
  return {
    status: true,
    data: data
  }
}

export const sendErrorResponse = <T>(data: T) => {
  return {
    status: false,
    data: data
  }
}
