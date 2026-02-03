import { apiGateway } from './apiGateway'

export const apiClient = {
  get: apiGateway.get,
  post: apiGateway.post,
  put: apiGateway.put,
  patch: apiGateway.patch,
  delete: apiGateway.delete
}

export default apiClient