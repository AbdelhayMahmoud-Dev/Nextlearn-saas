import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { DashboardService } from '../services/dashboard.service';

export const DashboardController = {
  student: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await DashboardService.getStudentDashboard(user.tenantId, user.id);
    ApiResponse.success(res, data, 'Dashboard');
  }),
};
